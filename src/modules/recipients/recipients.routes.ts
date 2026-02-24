import { Hono } from 'hono';
import { NotFoundError } from '../../errors.js';
import { errorResponse } from '../../schemas/common.js';
import { upsertRecipientSchema, upsertConsentSchema } from './recipients.schema.js';
import { upsertRecipient, getRecipientById, upsertConsent } from './recipients.service.js';

const recipients = new Hono();

recipients.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = upsertRecipientSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid request', parsed.error.issues), 400);
  }

  const recipient = await upsertRecipient(parsed.data);
  return c.json(recipient, 200);
});

recipients.get('/:recipientId', async (c) => {
  const { recipientId } = c.req.param();

  try {
    const recipient = await getRecipientById(recipientId);
    return c.json(recipient, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json(errorResponse('NOT_FOUND', err.message), 404);
    }
    throw err;
  }
});

recipients.post('/:recipientId/consents', async (c) => {
  const { recipientId } = c.req.param();
  const body = await c.req.json().catch(() => null);
  const parsed = upsertConsentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid request', parsed.error.issues), 400);
  }

  try {
    const consent = await upsertConsent(recipientId, parsed.data);
    return c.json(consent, 200);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return c.json(errorResponse('NOT_FOUND', err.message), 404);
    }
    throw err;
  }
});

export { recipients };
