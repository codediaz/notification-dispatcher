import type { Hono } from 'hono';
import { health } from './health.js';
import { version } from './version.js';
import { publicRoutes } from './public/index.js';
import { internalRoutes } from './internal/index.js';

export function registerRoutes(app: Hono): void {
  app.route('/health', health);
  app.route('/version', version);
  app.route('/public', publicRoutes);
  app.route('/internal', internalRoutes);
}
