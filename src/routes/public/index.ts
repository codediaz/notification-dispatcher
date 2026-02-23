import { Hono } from 'hono';

const publicRoutes = new Hono();

// Public routes are accessible without authentication.
// Add channel-agnostic webhook endpoints, status pages, etc. here.
publicRoutes.get('/status', (c) => {
  return c.json({ success: true, message: 'Public API is operational' });
});

export { publicRoutes };
