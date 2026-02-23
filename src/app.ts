import { Hono } from 'hono';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export function createApp(): Hono {
  const app = new Hono();

  app.use('*', requestLogger);

  registerRoutes(app);

  app.notFound(notFound);
  app.onError(errorHandler);

  return app;
}
