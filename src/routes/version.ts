import { Hono } from 'hono';
import { env } from '../config/env.js';

const version = new Hono();

version.get('/', (c) => {
  return c.json({
    success: true,
    version: env.APP_VERSION,
    name: 'notification-dispatcher',
  });
});

export { version };
