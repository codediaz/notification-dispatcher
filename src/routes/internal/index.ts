import { Hono } from 'hono';
import { apiKeyAuth } from '../../middleware/apiKeyAuth.js';
import { recipients } from '../../modules/recipients/recipients.routes.js';
import { templates } from '../../modules/templates/templates.routes.js';
import { notifications } from '../../modules/notifications/notifications.routes.js';

const internalRoutes = new Hono();

// All internal routes require a valid API key
internalRoutes.use('*', apiKeyAuth);

internalRoutes.route('/recipients', recipients);
internalRoutes.route('/templates', templates);
internalRoutes.route('/notifications', notifications);

export { internalRoutes };
