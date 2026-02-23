import { Hono } from 'hono';

const internalRoutes = new Hono();

// Internal routes are intended for service-to-service communication.
// Protect these with authentication/IP allowlisting in production.
internalRoutes.get('/status', (c) => {
  return c.json({ success: true, message: 'Internal API is operational' });
});

export { internalRoutes };
