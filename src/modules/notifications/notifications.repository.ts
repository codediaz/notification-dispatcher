import { getDb } from '../../db/index.js';
import type { CreateNotificationRequestInput, ListNotificationRequestsQuery } from './notifications.schema.js';

type NotificationRequestRow = {
  id: string;
  tenant_id: string;
  source_service: string;
  external_request_id: string | null;
  event_type: string;
  channel_type: string;
  recipient_id: string;
  template_key: string;
  payload: unknown;
  scheduled_at: Date | null;
  priority: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

type DeliveryRow = {
  id: string;
  notification_request_id: string;
  attempt_number: number;
  provider: string;
  provider_message_id: string | null;
  provider_status: string | null;
  error_code: string | null;
  error_message: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
};

type WebhookEventRow = {
  id: string;
  channel_type: string;
  provider: string;
  event_type: string;
  provider_event_id: string | null;
  status: string;
  received_at: Date;
  processed_at: Date | null;
};

function mapNotification(row: NotificationRequestRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sourceService: row.source_service,
    externalRequestId: row.external_request_id,
    eventType: row.event_type,
    channelType: row.channel_type,
    recipientId: row.recipient_id,
    templateKey: row.template_key,
    payload: row.payload,
    scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : null,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapDelivery(row: DeliveryRow) {
  return {
    id: row.id,
    notificationRequestId: row.notification_request_id,
    attemptNumber: row.attempt_number,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    providerStatus: row.provider_status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    deliveredAt: row.delivered_at ? row.delivered_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

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

export async function createNotificationRequest(
  input: CreateNotificationRequestInput,
  resolvedRecipientId: string,
) {
  const sql = getDb();
  const {
    tenantId,
    sourceService,
    externalRequestId,
    eventType,
    channelType,
    templateKey,
    payload,
    scheduledAt,
    priority,
  } = input;

  const [row] = await sql<NotificationRequestRow[]>`
    INSERT INTO notification_requests
      (tenant_id, source_service, external_request_id, event_type, channel_type, recipient_id, template_key, payload, scheduled_at, priority)
    VALUES
      (${tenantId}, ${sourceService}, ${externalRequestId ?? null}, ${eventType}, ${channelType},
       ${resolvedRecipientId}, ${templateKey}, ${JSON.stringify(payload)},
       ${scheduledAt ?? null}, ${priority})
    RETURNING *
  `;
  return mapNotification(row);
}

export async function findDuplicateRequest(tenantId: string, externalRequestId: string) {
  const sql = getDb();
  const [row] = await sql<NotificationRequestRow[]>`
    SELECT * FROM notification_requests
    WHERE tenant_id = ${tenantId} AND external_request_id = ${externalRequestId}
  `;
  return row ? mapNotification(row) : null;
}

export async function listNotificationRequests(query: ListNotificationRequestsQuery) {
  const sql = getDb();
  const { tenantId, status, channelType, recipientId, from, to, limit } = query;

  const rows = await sql<NotificationRequestRow[]>`
    SELECT * FROM notification_requests
    WHERE tenant_id = ${tenantId}
      ${status ? sql` AND status = ${status}` : sql``}
      ${channelType ? sql` AND channel_type = ${channelType}` : sql``}
      ${recipientId ? sql` AND recipient_id = ${recipientId}` : sql``}
      ${from ? sql` AND created_at >= ${from}` : sql``}
      ${to ? sql` AND created_at <= ${to}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(mapNotification);
}

export async function findNotificationById(id: string) {
  const sql = getDb();
  const [row] = await sql<NotificationRequestRow[]>`
    SELECT * FROM notification_requests WHERE id = ${id}
  `;
  if (!row) return null;

  const deliveries = await sql<DeliveryRow[]>`
    SELECT * FROM notification_deliveries WHERE notification_request_id = ${id} ORDER BY attempt_number
  `;

  const webhooks = await sql<WebhookEventRow[]>`
    SELECT * FROM webhook_events WHERE notification_request_id = ${id} ORDER BY received_at
  `;

  return {
    ...mapNotification(row),
    deliveries: deliveries.map(mapDelivery),
    webhooks: webhooks.map(mapWebhookEvent),
  };
}

export async function cancelNotificationRequest(id: string) {
  const sql = getDb();

  const [row] = await sql<NotificationRequestRow[]>`
    UPDATE notification_requests
    SET status = 'canceled', updated_at = NOW()
    WHERE id = ${id} AND status = 'queued'
    RETURNING *
  `;
  return row ? mapNotification(row) : null;
}

export async function findNotificationStatusById(id: string) {
  const sql = getDb();
  const [row] = await sql<{ id: string; status: string }[]>`
    SELECT id, status FROM notification_requests WHERE id = ${id}
  `;
  return row ?? null;
}
