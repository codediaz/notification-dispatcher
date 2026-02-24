import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import { startWorkers, stopWorkers } from './workers/index.js';

async function main(): Promise<void> {
  await connectDb();
  await runMigrations();
  await startWorkers();

  const app = createApp();

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
    },
    (info) => {
      console.log(`🚀 Server running at http://${info.address}:${info.port}`);
    },
  );

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      await stopWorkers();
      await disconnectDb();
      console.log('Shutdown complete.');
      process.exit(0);
    });

    // Force exit after 10 s if graceful shutdown hangs.
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
