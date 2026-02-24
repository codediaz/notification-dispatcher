import type { Sql } from 'postgres';
import { getDb } from './index.js';

type MigrationFn = (sql: Sql) => Promise<void>;
type Migration = { name: string; fn: MigrationFn };

async function migration001(sql: Sql): Promise<void> {
  // recipients
  await sql`
    CREATE TABLE IF NOT EXISTS recipients (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id   TEXT        NOT NULL,
      external_ref TEXT,
      name        TEXT,
      email       TEXT,
      phone_e164  TEXT,
      locale      TEXT,
      timezone    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS recipients_tenant_external_ref_idx
      ON recipients (tenant_id, external_ref)
      WHERE external_ref IS NOT NULL
  `;

  // recipient_consents
  await sql`
    CREATE TABLE IF NOT EXISTS recipient_consents (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    TEXT        NOT NULL,
      recipient_id UUID        NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
      channel_type TEXT        NOT NULL,
      status       TEXT        NOT NULL,
      source       TEXT        NOT NULL,
      metadata     JSONB,
      granted_at   TIMESTAMPTZ,
      revoked_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, recipient_id, channel_type)
    )
  `;

  // templates
  await sql`
    CREATE TABLE IF NOT EXISTS templates (
      id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id              TEXT        NOT NULL,
      key                    TEXT        NOT NULL,
      channel_type           TEXT        NOT NULL,
      provider_template_name TEXT,
      language               TEXT        NOT NULL,
      status                 TEXT        NOT NULL DEFAULT 'draft',
      version                INTEGER     NOT NULL DEFAULT 1,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, key, channel_type, version)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS templates_tenant_channel_idx
      ON templates (tenant_id, channel_type)
  `;

  // notification_requests
  await sql`
    CREATE TABLE IF NOT EXISTS notification_requests (
      id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id           TEXT        NOT NULL,
      source_service      TEXT        NOT NULL,
      external_request_id TEXT,
      event_type          TEXT        NOT NULL,
      channel_type        TEXT        NOT NULL,
      recipient_id        UUID        NOT NULL REFERENCES recipients(id),
      template_key        TEXT        NOT NULL,
      payload             JSONB       NOT NULL DEFAULT '{}',
      scheduled_at        TIMESTAMPTZ,
      priority            TEXT        NOT NULL DEFAULT 'normal',
      status              TEXT        NOT NULL DEFAULT 'queued',
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notification_requests_idempotency_idx
      ON notification_requests (tenant_id, external_request_id)
      WHERE external_request_id IS NOT NULL
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS notification_requests_tenant_status_idx
      ON notification_requests (tenant_id, status)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS notification_requests_recipient_idx
      ON notification_requests (recipient_id)
  `;

  // notification_deliveries
  await sql`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_request_id UUID        NOT NULL REFERENCES notification_requests(id),
      attempt_number          INTEGER     NOT NULL DEFAULT 1,
      provider                TEXT        NOT NULL,
      provider_message_id     TEXT,
      provider_status         TEXT,
      error_code              TEXT,
      error_message           TEXT,
      sent_at                 TIMESTAMPTZ,
      delivered_at            TIMESTAMPTZ,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS notification_deliveries_request_idx
      ON notification_deliveries (notification_request_id)
  `;

  // webhook_events
  await sql`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_type            TEXT        NOT NULL,
      provider                TEXT        NOT NULL,
      event_type              TEXT        NOT NULL,
      provider_event_id       TEXT,
      notification_request_id UUID        REFERENCES notification_requests(id),
      status                  TEXT        NOT NULL DEFAULT 'received',
      raw_payload             JSONB       NOT NULL DEFAULT '{}',
      received_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at            TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS webhook_events_channel_provider_idx
      ON webhook_events (channel_type, provider)
  `;
}

const migrations: Migration[] = [{ name: '001_initial_schema', fn: migration001 }];

export async function runMigrations(): Promise<void> {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id       SERIAL      PRIMARY KEY,
      filename TEXT        NOT NULL UNIQUE,
      ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const { name, fn } of migrations) {
    const existing = await sql`SELECT id FROM _migrations WHERE filename = ${name}`;
    if (existing.length > 0) continue;

    await fn(sql);
    await sql`INSERT INTO _migrations (filename) VALUES (${name})`;

    console.log(`Migration applied: ${name}`);
  }

  console.log('Migrations up to date');
}
