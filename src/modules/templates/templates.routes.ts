import { Hono } from 'hono';
import { ConflictError } from '../../errors.js';
import { errorResponse, channelTypeSchema } from '../../schemas/common.js';
import { createTemplateSchema } from './templates.schema.js';
import { createTemplate, listTemplates } from './templates.service.js';

const templates = new Hono();

templates.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid request', parsed.error.issues), 400);
  }

  try {
    const template = await createTemplate(parsed.data);
    return c.json(template, 201);
  } catch (err) {
    if (err instanceof ConflictError) {
      return c.json(errorResponse('CONFLICT', err.message), 409);
    }
    throw err;
  }
});

templates.get('/', async (c) => {
  const tenantId = c.req.query('tenantId');
  if (!tenantId) {
    return c.json(errorResponse('BAD_REQUEST', 'tenantId query parameter is required'), 400);
  }

  const rawChannelType = c.req.query('channelType');
  const channelTypeParsed = rawChannelType ? channelTypeSchema.safeParse(rawChannelType) : null;

  if (channelTypeParsed && !channelTypeParsed.success) {
    return c.json(errorResponse('BAD_REQUEST', 'Invalid channelType value'), 400);
  }

  const items = await listTemplates(tenantId, channelTypeParsed?.data);
  return c.json({ items }, 200);
});

export { templates };
