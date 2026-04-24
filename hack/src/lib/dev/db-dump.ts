#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const COMPOSE_FILE = join(process.cwd(), 'docker-compose.production.yml');
const DUMP_DIR = join(process.cwd(), 'dumps');
const DUMP_FILE = join(DUMP_DIR, `production-${Date.now()}.dump`);

type ComposePostgresConfig = {
  containerName: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbPort: string;
};

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function cleanYamlValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function extractPostgresSection(composeContent: string): string {
  const match = composeContent.match(
    /^ {2}postgres:\n([\s\S]*?)(?=^ {2}[a-zA-Z0-9_-]+:\n|^volumes:\n|^networks:\n|$)/m,
  );

  if (!match) {
    throw new Error(
      `Could not find 'services.postgres' section in ${COMPOSE_FILE}`,
    );
  }

  return match[1];
}

function readComposePostgresConfig(): ComposePostgresConfig {
  const composeContent = readFileSync(COMPOSE_FILE, 'utf-8');
  const postgresSection = extractPostgresSection(composeContent);
  const envUserFallback = `\${POSTGRES_USER:-postgres}`;
  const envPasswordFallback = `\${POSTGRES_PASSWORD:-postgres}`;

  const containerName =
    postgresSection.match(/^\s{4}container_name:\s*(.+)\s*$/m)?.[1] ??
    'hack-postgres';
  const dbName =
    postgresSection.match(/^\s{6}POSTGRES_DB:\s*(.+)\s*$/m)?.[1] ?? 'hack_prod';
  const dbUser =
    postgresSection.match(/^\s{6}POSTGRES_USER:\s*(.+)\s*$/m)?.[1] ??
    envUserFallback;
  const dbPassword =
    postgresSection.match(/^\s{6}POSTGRES_PASSWORD:\s*(.+)\s*$/m)?.[1] ??
    envPasswordFallback;
  const dbPort =
    postgresSection.match(/^\s{6}POSTGRES_PORT:\s*(.+)\s*$/m)?.[1] ?? '5432';

  return {
    containerName: cleanYamlValue(containerName),
    dbName: cleanYamlValue(dbName),
    dbUser: cleanYamlValue(dbUser),
    dbPassword: cleanYamlValue(dbPassword),
    dbPort: cleanYamlValue(dbPort),
  };
}

function buildRemoteDumpCommand(config: ComposePostgresConfig): string {
  const { containerName, dbName, dbUser, dbPassword, dbPort } = config;

  const containerCommand = [
    `export PGPASSWORD="${dbPassword}";`,
    `exec pg_dump --format=custom --compress=9 --no-owner --no-acl --host=localhost --port="${dbPort}" --username="${dbUser}" --dbname="${dbName}"`,
  ].join(' ');

  return `docker exec -i ${shellQuote(containerName)} sh -lc ${shellQuote(containerCommand)}`;
}

async function dumpProductionDatabase() {
  try {
    console.log('📁 Creating dumps directory...');
    if (!existsSync(DUMP_DIR)) {
      mkdirSync(DUMP_DIR, { recursive: true });
    }

    const composeConfig = readComposePostgresConfig();
    const remoteDumpCommand = buildRemoteDumpCommand(composeConfig);
    const sshCommand = `ssh swiss ${shellQuote(remoteDumpCommand)} > ${shellQuote(DUMP_FILE)}`;

    console.log('💾 Dumping production database over SSH...');
    console.log('   Host: swiss');
    console.log(`   Container: ${composeConfig.containerName}`);
    console.log(`   Database: ${composeConfig.dbName}`);
    console.log(`   User: ${composeConfig.dbUser}`);
    console.log(`   Destination: ${DUMP_FILE}`);

    execSync(sshCommand, { stdio: 'inherit' });

    console.log('✅ Production database dumped successfully!');
    console.log(`   File: ${DUMP_FILE}`);

    return DUMP_FILE;
  } catch (error) {
    if (existsSync(DUMP_FILE)) {
      unlinkSync(DUMP_FILE);
    }
    console.error('❌ Error dumping production database:', error);
    process.exit(1);
  }
}

dumpProductionDatabase();
