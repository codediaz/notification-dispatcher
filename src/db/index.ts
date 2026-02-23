import type { Sql } from 'postgres';
import { env } from '../config/env.js';

// DB connection scaffolding using the `postgres` driver.
// Replace with your ORM/query builder of choice (e.g. Drizzle, Prisma).
let sql: Sql | null = null;

export async function connectDb(): Promise<void> {
  // Lazily import to avoid loading postgres in test environments without a real DB.
  const { default: postgres } = await import('postgres');
  sql = postgres(env.DATABASE_URL, { max: 10 });
  console.log('Database connection established');
}

export async function disconnectDb(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    console.log('Database connection closed');
  }
}

export function getDb(): Sql {
  if (!sql) {
    throw new Error('Database not connected. Call connectDb() first.');
  }
  return sql;
}
