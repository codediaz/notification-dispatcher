import { createWebhookEvent } from './webhooks.repository.js';

export async function ingestWhatsAppWebhook(rawPayload: unknown) {
  // Determine eventType from the raw payload structure (Meta Cloud API format)
  let eventType = 'unknown';
  let providerEventId: string | null = null;

  if (rawPayload && typeof rawPayload === 'object') {
    const payload = rawPayload as Record<string, unknown>;
    if (Array.isArray(payload['entry'])) {
      eventType = 'message_status';
    }
  }

  const event = await createWebhookEvent({
    channelType: 'whatsapp',
    provider: 'meta_cloud',
    eventType,
    providerEventId,
    rawPayload,
  });

  return event;
}
