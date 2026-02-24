import { getDb } from '../db/index.js';

const POLL_INTERVAL_MS = 5_000;

let workerInterval: ReturnType<typeof setInterval> | null = null;

type NotificationRow = {
  id: string;
  channel_type: string;
  template_key: string;
  recipient_id: string;
  payload: unknown;
};

async function processNotification(notification: NotificationRow): Promise<void> {
  const sql = getDb();
  const { id, channel_type } = notification;

  const [delivery] = await sql<{ id: string }[]>`
    INSERT INTO notification_deliveries (notification_request_id, attempt_number, provider, provider_status)
    VALUES (${id}, 1, ${channel_type === 'whatsapp' ? 'meta_cloud' : 'smtp'}, 'sending')
    RETURNING id
  `;

  try {
    // TODO: dispatch to real provider (WhatsApp / email)
    // Placeholder: mark as sent immediately
    await sql`
      UPDATE notification_deliveries
      SET provider_status = 'sent', sent_at = NOW()
      WHERE id = ${delivery.id}
    `;

    await sql`
      UPDATE notification_requests
      SET status = 'sent', updated_at = NOW()
      WHERE id = ${id}
    `;

    console.log(`[worker] Dispatched notification ${id} via ${channel_type}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await sql`
      UPDATE notification_deliveries
      SET provider_status = 'failed', error_message = ${message}
      WHERE id = ${delivery.id}
    `;

    await sql`
      UPDATE notification_requests
      SET status = 'failed', updated_at = NOW()
      WHERE id = ${id}
    `;

    console.error(`[worker] Failed to dispatch notification ${id}:`, message);
  }
}

async function processNextBatch(): Promise<void> {
  const sql = getDb();

  // Atomically claim up to 10 queued notifications (SKIP LOCKED avoids contention)
  const claimed = await sql<NotificationRow[]>`
    UPDATE notification_requests
    SET status = 'processing', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM notification_requests
      WHERE status = 'queued'
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END ASC,
        created_at ASC
      LIMIT 10
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, channel_type, template_key, recipient_id, payload
  `;

  for (const notification of claimed) {
    await processNotification(notification);
  }
}

export async function startWorkers(): Promise<void> {
  workerInterval = setInterval(() => {
    processNextBatch().catch((err) => {
      console.error('[worker] Batch error:', err);
    });
  }, POLL_INTERVAL_MS);

  console.log(`Workers started — polling every ${POLL_INTERVAL_MS / 1000}s`);
}

export async function stopWorkers(): Promise<void> {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  console.log('Workers stopped');
}
