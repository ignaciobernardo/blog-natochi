import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const LOCAL_DB_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
  'postgres',
]);

config({
  path: '.env.local',
});

const resetSchema = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const parsedUrl = new URL(process.env.POSTGRES_URL);
  const host = parsedUrl.hostname.toLowerCase();
  if (!LOCAL_DB_HOSTS.has(host)) {
    const defaultPort = process.env.DB_PORT || '5434';
    throw new Error(
      [
        `Refusing to reset non-local database host "${host}".`,
        'This command is only intended for local Docker/Postgres databases.',
        `Set POSTGRES_URL in .env.local to something like: postgresql://postgres:postgres@localhost:${defaultPort}/hack_dev`,
      ].join(' '),
    );
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Resetting database schema...');

  try {
    const start = Date.now();

    await db.execute(sql`SET lock_timeout = '5s'`);
    console.log('✅ Set lock timeout');

    await db.execute(sql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
    `);
    console.log('✅ Terminated active connections');

    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
    console.log('✅ Dropped public schema');

    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
    console.log('✅ Dropped drizzle schema');

    await db.execute(sql`CREATE SCHEMA public`);
    console.log('✅ Recreated public schema');

    await db.execute(sql`GRANT ALL ON SCHEMA public TO CURRENT_USER`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
    console.log('✅ Granted permissions');

    const end = Date.now();
    console.log('✅ Schema reset completed in', end - start, 'ms');
  } catch (error) {
    console.error('❌ Schema reset failed');
    console.error(error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run the reset if this file is executed directly
if (require.main === module) {
  resetSchema().catch((err) => {
    console.error('❌ Schema reset failed');
    console.error(err);
    process.exit(1);
  });
}

export { resetSchema };
