import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function errorHandler(err: Error, c: Context): Promise<Response> {
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
        status: err.status,
      },
      err.status,
    );
  }

  console.error('Unhandled error:', err);

  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      status: 500,
    },
    500,
  );
}

export async function notFound(c: Context): Promise<Response> {
  return c.json(
    {
      success: false,
      error: `Route not found: ${c.req.method} ${c.req.path}`,
      status: 404,
    },
    404,
  );
}

export async function requestValidator(_err: Error, c: Context, _next: Next): Promise<Response> {
  return c.json(
    {
      success: false,
      error: 'Validation Error',
      details: _err.message,
      status: 422,
    },
    422,
  );
}
