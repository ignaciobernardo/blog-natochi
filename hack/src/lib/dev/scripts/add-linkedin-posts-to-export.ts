#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { distance } from 'fastest-levenshtein';
import Papa from 'papaparse';
import { db } from '@/src/lib/db';
import { events, hackerProfiles, hackers, teams } from '@/src/lib/db/schema';

const DEFAULT_EXPORT_PATH = 'export-hack-25.csv';
const DEFAULT_POSTS_PATH = '/Users/rafafdz/linkedin-scraper/posts-hack-25.csv';
const OUTPUT_COLUMN = 'linkedin_posts_urls';
const EVENT_NAME = 'Platanus Hack 25';
const PERFECT_MATCH_SCORE = 1;
const EXACT_NAME_THRESHOLD = 0.999;
const STRONG_MATCH_THRESHOLD = 0.93;
const REVIEW_MATCH_THRESHOLD = 0.88;

type CsvRow = Record<string, string>;

type TeamMemberRow = {
  teamSlug: string;
  hackerFullName: string;
};

type PostRow = {
  Persona: string;
  Post: string;
};

type PostEntry = {
  originalName: string;
  normalizedName: string;
  tokens: string[];
  urls: string[];
};

type MatchResult = {
  score: number;
  exact: boolean;
  candidate: PostEntry | null;
};

function resolvePathFromArg(index: number, fallbackPath: string): string {
  const value = process.argv[index];
  return value ? path.resolve(value) : path.resolve(fallbackPath);
}

async function readCsv<T extends Record<string, string>>(
  filePath: string,
): Promise<T[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = Papa.parse<T>(raw, {
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

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenizeName(name: string): string[] {
  return normalizeName(name).split(' ').filter(Boolean);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function ratio(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return PERFECT_MATCH_SCORE;
  }

  return 1 - distance(a, b) / Math.max(a.length, b.length);
}

function buildAliases(tokens: string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }

  const aliases = [tokens.join(' ')];

  if (tokens.length >= 2) {
    aliases.push(`${tokens[0]} ${tokens.at(-1) ?? ''}`.trim());
    aliases.push(`${tokens[0]} ${tokens[1]}`.trim());
  }

  if (tokens.length >= 3) {
    aliases.push(`${tokens[0]} ${tokens[1]} ${tokens.at(-1) ?? ''}`.trim());
  }

  for (let index = 1; index < tokens.length; index += 1) {
    aliases.push(`${tokens[0]} ${tokens[index]}`.trim());
  }

  for (let size = 2; size <= Math.min(3, tokens.length); size += 1) {
    for (let start = 0; start <= tokens.length - size; start += 1) {
      aliases.push(tokens.slice(start, start + size).join(' '));
    }
  }

  return unique(aliases.filter(Boolean));
}

function overlapScore(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const overlap = left.filter((token) => rightSet.has(token)).length;

  if (overlap === 0) {
    return 0;
  }

  return overlap / Math.max(leftSet.size, rightSet.size);
}

function shareBoundaryTokens(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) {
    return false;
  }

  const sameFirst = left[0] === right[0];
  const sameLast = left.at(-1) === right.at(-1);
  return sameFirst || sameLast;
}

function scoreCandidate(hackerName: string, post: PostEntry): MatchResult {
  const normalizedHackerName = normalizeName(hackerName);
  const hackerTokens = tokenizeName(hackerName);

  if (normalizedHackerName === post.normalizedName) {
    return {
      score: PERFECT_MATCH_SCORE,
      exact: true,
      candidate: post,
    };
  }

  const hackerAliases = buildAliases(hackerTokens);
  const postAliases = buildAliases(post.tokens);

  const aliasScores = hackerAliases.flatMap((hackerAlias) =>
    postAliases.map((postAlias) => ratio(hackerAlias, postAlias)),
  );
  const bestAliasScore =
    aliasScores.length > 0
      ? Math.max(...aliasScores)
      : ratio(normalizedHackerName, post.normalizedName);
  const tokenOverlap = overlapScore(hackerTokens, post.tokens);
  const boundaryBoost = shareBoundaryTokens(hackerTokens, post.tokens)
    ? 0.04
    : 0;
  const score = Math.max(bestAliasScore, tokenOverlap + boundaryBoost);

  if (
    !shareBoundaryTokens(hackerTokens, post.tokens) &&
    score < PERFECT_MATCH_SCORE
  ) {
    return {
      score: Math.min(score, 0.84),
      exact: false,
      candidate: post,
    };
  }

  return {
    score,
    exact: false,
    candidate: post,
  };
}

function selectBestMatch(hackerName: string, posts: PostEntry[]): MatchResult {
  let best: MatchResult = {
    score: 0,
    exact: false,
    candidate: null,
  };

  for (const post of posts) {
    const candidate = scoreCandidate(hackerName, post);

    if (candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

async function loadTeamMembers(
  teamSlugs: string[],
): Promise<Map<string, string[]>> {
  const [hack25Event] = await db
    .select({
      id: events.id,
    })
    .from(events)
    .where(eq(events.name, EVENT_NAME))
    .limit(1);

  if (!hack25Event) {
    throw new Error(`${EVENT_NAME} event not found`);
  }

  const rows: TeamMemberRow[] = await db
    .select({
      teamSlug: teams.slug,
      hackerFullName: hackers.fullName,
    })
    .from(teams)
    .innerJoin(hackerProfiles, eq(hackerProfiles.teamId, teams.id))
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(
      and(eq(teams.eventId, hack25Event.id), inArray(teams.slug, teamSlugs)),
    )
    .orderBy(asc(teams.slug), asc(hackers.fullName));

  const teamMembers = new Map<string, string[]>();

  for (const row of rows) {
    const currentMembers = teamMembers.get(row.teamSlug) ?? [];
    currentMembers.push(row.hackerFullName);
    teamMembers.set(row.teamSlug, currentMembers);
  }

  return teamMembers;
}

function buildPostsIndex(rows: PostRow[]): PostEntry[] {
  const postsByName = new Map<string, PostEntry>();

  for (const row of rows) {
    const originalName = row.Persona?.trim();
    const url = row.Post?.trim();

    if (!originalName || !url) {
      continue;
    }

    const normalizedName = normalizeName(originalName);

    if (!normalizedName) {
      continue;
    }

    const existing = postsByName.get(normalizedName);

    if (existing) {
      existing.urls.push(url);
      continue;
    }

    postsByName.set(normalizedName, {
      originalName,
      normalizedName,
      tokens: tokenizeName(originalName),
      urls: [url],
    });
  }

  return Array.from(postsByName.values()).map((entry) => ({
    ...entry,
    urls: unique(entry.urls),
  }));
}

function outputPathFor(inputPath: string): string {
  const parsedPath = path.parse(inputPath);
  return path.join(
    parsedPath.dir,
    `${parsedPath.name}.with-linkedin-posts${parsedPath.ext}`,
  );
}

async function main(): Promise<void> {
  const exportPath = resolvePathFromArg(2, DEFAULT_EXPORT_PATH);
  const postsPath = resolvePathFromArg(3, DEFAULT_POSTS_PATH);
  const outputPath = outputPathFor(exportPath);

  console.log(`Reading export CSV from ${exportPath}`);
  console.log(`Reading LinkedIn posts CSV from ${postsPath}`);

  const [exportRows, postRows] = await Promise.all([
    readCsv<CsvRow>(exportPath),
    readCsv<PostRow>(postsPath),
  ]);

  const teamSlugs = unique(
    exportRows
      .map((row) => row['team-slug']?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const [teamMembers, posts] = await Promise.all([
    loadTeamMembers(teamSlugs),
    Promise.resolve(buildPostsIndex(postRows)),
  ]);

  let exactMatches = 0;
  let fuzzyMatches = 0;
  let reviewMatches = 0;
  const unmatchedHackers: string[] = [];
  const reviewHackers: Array<{
    hackerName: string;
    postName: string;
    score: number;
  }> = [];

  const outputRows = exportRows.map((row) => {
    const teamSlug = row['team-slug']?.trim();
    const members = teamSlug ? (teamMembers.get(teamSlug) ?? []) : [];
    const urls: string[] = [];

    for (const member of members) {
      const match = selectBestMatch(member, posts);

      if (!match.candidate || match.score < REVIEW_MATCH_THRESHOLD) {
        unmatchedHackers.push(member);
        continue;
      }

      if (match.exact || match.score >= EXACT_NAME_THRESHOLD) {
        exactMatches += 1;
      } else if (match.score >= STRONG_MATCH_THRESHOLD) {
        fuzzyMatches += 1;
      } else {
        reviewMatches += 1;
        reviewHackers.push({
          hackerName: member,
          postName: match.candidate.originalName,
          score: match.score,
        });
      }

      urls.push(...match.candidate.urls);
    }

    return {
      ...row,
      [OUTPUT_COLUMN]: unique(urls).join(';'),
    };
  });

  await writeCsv(outputPath, outputRows);

  console.log(`Wrote ${outputRows.length} rows to ${outputPath}`);
  console.log(
    `Matched hackers: ${exactMatches + fuzzyMatches + reviewMatches} (${exactMatches} exact, ${fuzzyMatches} strong fuzzy, ${reviewMatches} review-band)`,
  );
  console.log(`Unmatched hackers: ${unmatchedHackers.length}`);

  if (reviewHackers.length > 0) {
    console.log('\nReview-band matches:');
    for (const match of reviewHackers
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)) {
      console.log(
        `  ${match.hackerName} -> ${match.postName} (${match.score.toFixed(3)})`,
      );
    }
  }

  if (unmatchedHackers.length > 0) {
    console.log('\nSample unmatched hackers:');
    for (const hackerName of unique(unmatchedHackers).slice(0, 20)) {
      console.log(`  ${hackerName}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
