import type { Context, Next } from 'hono';
import { env } from '../config/env.js';
import { errorResponse } from '../schemas/common.js';

export async function apiKeyAuth(c: Context, next: Next): Promise<void | Response> {
  const key = c.req.header('x-api-key');

  if (!key || key !== env.API_KEY) {
    return c.json(errorResponse('UNAUTHORIZED', 'Missing or invalid API key'), 401);
  }

  await next();
}
