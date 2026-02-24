import { Hono } from 'hono';
import { env } from '../../config/env.js';
import { ingestWhatsAppWebhook } from './webhooks.service.js';

const whatsappWebhook = new Hono();

// POST /public/webhooks/whatsapp - receive provider events
whatsappWebhook.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));

  await ingestWhatsAppWebhook(body);

  return c.json({ status: 'received' }, 200);
});

// GET /public/webhooks/whatsapp - verification challenge (Meta webhook handshake)
whatsappWebhook.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    return c.text(challenge ?? '', 200);
  }

  return c.text('Forbidden', 403);
});

export { whatsappWebhook };
