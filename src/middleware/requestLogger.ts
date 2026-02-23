import type { Context, Next } from 'hono';

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const { method, path } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} ${duration}ms`);
}
