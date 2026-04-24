import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('POSTGRES_URL is not defined');
  process.exit(1);
}

const connection = postgres(databaseUrl, { max: 1 });
const db = drizzle(connection);

console.log('Running database migrations...');

try {
  const start = Date.now();
  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
  const durationMs = Date.now() - start;
  console.log(`Migrations completed in ${durationMs}ms`);
} catch (error) {
  console.error('Migration failed');
  console.error(error);
  process.exitCode = 1;
} finally {
  await connection.end({ timeout: 5 });
}
