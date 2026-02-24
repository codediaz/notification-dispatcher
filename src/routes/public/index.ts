import { Hono } from 'hono';
import { whatsappWebhook } from '../../modules/webhooks/webhooks.routes.js';

const publicRoutes = new Hono();

publicRoutes.route('/webhooks/whatsapp', whatsappWebhook);

export { publicRoutes };
