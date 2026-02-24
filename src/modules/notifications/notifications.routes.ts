import { Hono } from 'hono';
import { ConflictError, NotFoundError } from '../../errors.js';
import { errorResponse } from '../../schemas/common.js';
import {
  createNotificationRequestSchema,
  listNotificationRequestsQuerySchema,
} from './notifications.schema.js';
import {
  createNotificationRequest,
  listNotificationRequests,
  getNotificationById,
  cancelNotificationRequest,
} from './notifications.service.js';

const notifications = new Hono();

notifications.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createNotificationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid request', parsed.error.issues), 400);
  }

  try {
    const notification = await createNotificationRequest(parsed.data);
    return c.json(notification, 202);
  } catch (err) {
    if (err instanceof ConflictError) {
      return c.json(errorResponse('CONFLICT', err.message), 409);
    }
    if (err instanceof NotFoundError) {
      return c.json(errorResponse('NOT_FOUND', err.message), 404);
    }
    throw err;
  }
});

notifications.get('/', async (c) => {
  const rawQuery = {
    tenantId: c.req.query('tenantId'),
    status: c.req.query('status'),
    channelType: c.req.query('channelType'),
    recipientId: c.req.query('recipientId'),
    from: c.req.query('from'),
    to: c.req.query('to'),
    limit: c.req.query('limit'),
  };

  const parsed = listNotificationRequestsQuerySchema.safeParse(
    Object.fromEntries(Object.entries(rawQuery).filter(([, v]) => v !== undefined)),
  );

  if (!parsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid query parameters', parsed.error.issues), 400);
  }

  const items = await listNotificationRequests(parsed.data);
  return c.json({ items }, 200);
});

notifications.get('/:notificationId', async (c) => {
  const { notificationId } = c.req.param();

  try {
    const notification = await getNotificationById(notificationId);
    return c.json(notification, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json(errorResponse('NOT_FOUND', err.message), 404);
    }
    throw err;
  }
});

notifications.post('/:notificationId/cancel', async (c) => {
  const { notificationId } = c.req.param();

  try {
    const result = await cancelNotificationRequest(notificationId);
    return c.json(result, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json(errorResponse('NOT_FOUND', err.message), 404);
    }
    if (err instanceof ConflictError) {
      return c.json(errorResponse('CONFLICT', err.message), 409);
    }
    throw err;
  }
});

export { notifications };
