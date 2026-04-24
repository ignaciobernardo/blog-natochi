#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';

const DEFAULT_FILES = ['export-hack-24.csv', 'export-hack-25.csv'];
const OUTPUT_COLUMN = 'external_services_providers';
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_RETRIES = 4;
const MAX_TECHNICAL_CHARS = 3_000;
const REQUEST_START_INTERVAL_MS = 2_500;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

type CsvRow = Record<string, string>;

function getPrompt(technicalDescription: string): string {
  return `check the current technical description of the project

${technicalDescription}

Output a bullet list of the external services provider, sorted by higher relevance inside the project to least releavant. make sure to be concise

Example:
- AWS S3
- AWS EC2
- Vercel
- Clerk

Be specific if possible.`;
}

function normalizeTechnicalDescription(technicalDescription: string): string {
  const normalized = technicalDescription.trim();

  if (normalized.length <= MAX_TECHNICAL_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_TECHNICAL_CHARS)}\n\n[truncated]`;
}

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable.');
  }

  return apiKey;
}

function getConcurrency(): number {
  const rawValue = process.env.CONCURRENCY;

  if (!rawValue) {
    return DEFAULT_CONCURRENCY;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid CONCURRENCY value: ${rawValue}`);
  }

  return parsed;
}

function outputPathFor(inputPath: string): string {
  const parsedPath = path.parse(inputPath);
  return path.join(
    parsedPath.dir,
    `${parsedPath.name}.with-external-services${parsedPath.ext}`,
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const requestScheduler = (() => {
  let nextStartAt = 0;
  let queue = Promise.resolve();

  return async () => {
    const scheduled = queue.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, nextStartAt - now);

      nextStartAt = Math.max(now, nextStartAt) + REQUEST_START_INTERVAL_MS;

      if (waitMs > 0) {
        await sleep(waitMs);
      }
    });

    queue = scheduled.catch(() => undefined);
    await scheduled;
  };
})();

async function readCsv(filePath: string): Promise<CsvRow[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = Papa.parse<CsvRow>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const [firstError] = parsed.errors;
    throw new Error(
      `Failed to parse ${filePath}: ${firstError?.message ?? 'Unknown CSV error'}`,
    );
  }

  return parsed.data;
}

async function writeCsv(filePath: string, rows: CsvRow[]): Promise<void> {
  const csv = Papa.unparse(rows, {
    columns: rows.length > 0 ? Object.keys(rows[0]) : undefined,
  });

  await fs.writeFile(filePath, csv, 'utf8');
}

function extractTextFromAnthropicResponse(payload: unknown): string {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('content' in payload) ||
    !Array.isArray(payload.content)
  ) {
    throw new Error('Unexpected Anthropic response format.');
  }

  const text = payload.content
    .filter(
      (item): item is { type: string; text: string } =>
        !!item &&
        typeof item === 'object' &&
        'type' in item &&
        item.type === 'text' &&
        'text' in item &&
        typeof item.text === 'string',
    )
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Anthropic response did not include text content.');
  }

  return text;
}

function sanitizeProvidersOutput(text: string): string {
  const bulletLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-*•])\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, '- ').trim());

  if (bulletLines.length > 0) {
    return bulletLines.join('\n');
  }

  return text.trim();
}

async function generateProviders(
  technicalDescription: string,
  apiKey: string,
): Promise<string> {
  let lastError: unknown;
  const normalizedTechnicalDescription =
    normalizeTechnicalDescription(technicalDescription);

  for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt += 1) {
    try {
      await requestScheduler();

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 200,
          temperature: 0,
          messages: [
            {
              role: 'user',
              content: getPrompt(normalizedTechnicalDescription),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Anthropic API error (${response.status}): ${errorText.slice(0, 500)}`,
        );
      }

      const payload = (await response.json()) as unknown;
      return sanitizeProvidersOutput(extractTextFromAnthropicResponse(payload));
    } catch (error) {
      lastError = error;

      if (attempt < DEFAULT_RETRIES) {
        const backoffMs = 1_000 * 2 ** (attempt - 1);
        await sleep(backoffMs);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

async function processFile(
  filePath: string,
  apiKey: string,
  concurrency: number,
): Promise<void> {
  const rows = await readCsv(filePath);

  if (rows.length === 0) {
    throw new Error(`CSV file is empty: ${filePath}`);
  }

  if (!('technical' in rows[0])) {
    throw new Error(
      `CSV file does not include a technical column: ${filePath}`,
    );
  }

  console.log(`\nProcessing ${filePath} (${rows.length} rows)`);

  await mapWithConcurrency(rows, concurrency, async (row, index) => {
    const technicalDescription = row.technical?.trim() ?? '';

    if (!technicalDescription) {
      row[OUTPUT_COLUMN] = '';
      console.log(
        `[${filePath}] row ${index + 1}/${rows.length}: skipped empty technical`,
      );
      return;
    }

    const providers = await generateProviders(technicalDescription, apiKey);
    row[OUTPUT_COLUMN] = providers;
    console.log(`[${filePath}] row ${index + 1}/${rows.length}: done`);
  });

  const outputPath = outputPathFor(filePath);
  await writeCsv(outputPath, rows);
  console.log(`Wrote ${outputPath}`);
}

async function main(): Promise<void> {
  const apiKey = getApiKey();
  const concurrency = getConcurrency();
  const files = process.argv.slice(2);
  const targetFiles = files.length > 0 ? files : DEFAULT_FILES;

  console.log(`Using model: ${ANTHROPIC_MODEL}`);
  console.log(`Concurrency: ${concurrency}`);

  for (const filePath of targetFiles) {
    await processFile(filePath, apiKey, concurrency);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
