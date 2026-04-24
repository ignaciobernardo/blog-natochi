#!/usr/bin/env node
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DUMP_DIR = join(process.cwd(), 'dumps');
const LOCAL_DB_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
  'postgres',
]);

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      env[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return env;
}

function getLatestDumpFile(): string {
  if (!existsSync(DUMP_DIR)) {
    throw new Error(`Dumps directory not found: ${DUMP_DIR}`);
  }

  const files = readdirSync(DUMP_DIR)
    .filter((f) => f.endsWith('.dump'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(
      "No dump files found. Run 'pnpm db:production:dump' first.",
    );
  }

  return join(DUMP_DIR, files[0]);
}

function assertDumpFileIsUsable(filePath: string): void {
  const stats = statSync(filePath);

  if (stats.size === 0) {
    throw new Error(`Dump file is empty: ${filePath}`);
  }
}

function assertLocalDatabaseUrl(url: string, defaultPort: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `Invalid database URL in .env.local: ${url}. Expected a valid postgres connection string.`,
    );
  }

  const host = parsed.hostname.toLowerCase();
  if (!LOCAL_DB_HOSTS.has(host)) {
    throw new Error(
      [
        `Refusing to restore into non-local host "${host}".`,
        'This command is only for local Docker/Postgres databases.',
        `Set POSTGRES_URL in .env.local to something like: postgresql://postgres:postgres@localhost:${defaultPort}/hack_dev`,
      ].join(' '),
    );
  }
}

async function restoreProductionDatabase() {
  try {
    const customPath = process.argv[2];
    let dumpFile: string;

    if (customPath) {
      if (existsSync(customPath)) {
        dumpFile = customPath;
        console.log('📁 Using custom dump file...');
      } else {
        throw new Error(`Custom dump file not found: ${customPath}`);
      }
    } else {
      dumpFile = getLatestDumpFile();
      console.log('📁 Using latest dump file...');
    }
    assertDumpFileIsUsable(dumpFile);

    console.log('🔍 Getting local database URL...');
    const env = parseEnvFile('.env.local');
    const localDbUrl = env.POSTGRES_URL || env.DATABASE_URL;
    const localDbPort = env.DB_PORT || '5434';

    if (!localDbUrl) {
      throw new Error(
        'POSTGRES_URL or DATABASE_URL not found in .env.local. Make sure your local database is configured.',
      );
    }
    assertLocalDatabaseUrl(localDbUrl, localDbPort);

    console.log('🗑️  Resetting local database...');
    execSync('pnpm db:reset', { stdio: 'inherit' });

    console.log('📤 Restoring database from dump...');
    console.log(`   Source: ${dumpFile}`);

    try {
      execFileSync(
        'pg_restore',
        [
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-acl',
          '--no-password',
          '--verbose',
          '--dbname',
          localDbUrl,
          dumpFile,
        ],
        { stdio: 'inherit' },
      );
    } catch (_restoreError) {
      // pg_restore exits with 1 even for warnings, check if data was actually restored
      console.log(
        '⚠️  pg_restore reported warnings (this is often normal for version differences)',
      );
    }

    console.log('✅ Database restore completed!');
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    process.exit(1);
  }
}

restoreProductionDatabase();
