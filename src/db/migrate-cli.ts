import { connectDb, disconnectDb } from './index.js';
import { runMigrations } from './migrate.js';

await connectDb();
await runMigrations();
await disconnectDb();
