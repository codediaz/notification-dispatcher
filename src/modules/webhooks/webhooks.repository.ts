import { getDb } from '../../db/index.js';

type WebhookEventRow = {
  id: string;
  channel_type: string;
  provider: string;
  event_type: string;
  provider_event_id: string | null;
  notification_request_id: string | null;
  status: string;
  raw_payload: unknown;
  received_at: Date;
  processed_at: Date | null;
};

function mapWebhookEvent(row: WebhookEventRow) {
  return {
    id: row.id,
    channelType: row.channel_type,
    provider: row.provider,
    eventType: row.event_type,
    providerEventId: row.provider_event_id,
    status: row.status,
    receivedAt: row.received_at.toISOString(),
    processedAt: row.processed_at ? row.processed_at.toISOString() : null,
  };
}

export async function createWebhookEvent(params: {
  channelType: string;
  provider: string;
  eventType: string;
  providerEventId?: string | null;
  rawPayload: unknown;
}) {
  const sql = getDb();
  const { channelType, provider, eventType, providerEventId, rawPayload } = params;

  const [row] = await sql<WebhookEventRow[]>`
    INSERT INTO webhook_events (channel_type, provider, event_type, provider_event_id, raw_payload)
    VALUES (${channelType}, ${provider}, ${eventType}, ${providerEventId ?? null}, ${JSON.stringify(rawPayload)})
    RETURNING *
  `;
  return mapWebhookEvent(row);
}
