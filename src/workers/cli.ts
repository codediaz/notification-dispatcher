import { connectDb, disconnectDb } from '../db/index.js';
import { runMigrations } from '../db/migrate.js';
import { startWorkers, stopWorkers } from './index.js';

await connectDb();
await runMigrations();
await startWorkers();

const shutdown = async (signal: string): Promise<void> => {
  console.log(`\nReceived ${signal}. Shutting down worker...`);
  await stopWorkers();
  await disconnectDb();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
