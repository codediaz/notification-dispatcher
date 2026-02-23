import { Hono } from 'hono';
import { env } from '../config/env.js';

const health = new Hono();

health.get('/', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

export { health };
