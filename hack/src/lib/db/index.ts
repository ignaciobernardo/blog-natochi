import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

declare global {
  var __db__: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var __client__: postgres.Sql | undefined;
}

let client: postgres.Sql;
let db: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === 'production') {
  client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  if (!global.__db__ || !global.__client__) {
    client = postgres(connectionString);
    global.__client__ = client;
    global.__db__ = drizzle(client, { schema });
  } else {
    client = global.__client__;
  }
  db = global.__db__;
}

export { db };
