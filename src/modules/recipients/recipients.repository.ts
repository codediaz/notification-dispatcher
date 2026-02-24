import { getDb } from '../../db/index.js';
import type { UpsertRecipientInput, UpsertConsentInput } from './recipients.schema.js';

type RecipientRow = {
  id: string;
  tenant_id: string;
  external_ref: string | null;
  name: string | null;
  email: string | null;
  phone_e164: string | null;
  locale: string | null;
  timezone: string | null;
  created_at: Date;
  updated_at: Date;
};

type ConsentRow = {
  id: string;
  tenant_id: string;
  recipient_id: string;
  channel_type: string;
  status: string;
  source: string;
  metadata: unknown;
  granted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapRecipient(row: RecipientRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    externalRef: row.external_ref,
    name: row.name,
    email: row.email,
    phoneE164: row.phone_e164,
    locale: row.locale,
    timezone: row.timezone,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapConsent(row: ConsentRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    recipientId: row.recipient_id,
    channelType: row.channel_type,
    status: row.status,
    source: row.source,
    metadata: row.metadata ?? null,
    grantedAt: row.granted_at ? row.granted_at.toISOString() : null,
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function upsertRecipient(input: UpsertRecipientInput) {
  const sql = getDb();
  const { tenantId, externalRef, name, email, phoneE164, locale, timezone } = input;

  if (externalRef) {
    const [row] = await sql<RecipientRow[]>`
      INSERT INTO recipients (tenant_id, external_ref, name, email, phone_e164, locale, timezone)
      VALUES (${tenantId}, ${externalRef}, ${name ?? null}, ${email ?? null}, ${phoneE164 ?? null}, ${locale ?? null}, ${timezone ?? null})
      ON CONFLICT (tenant_id, external_ref) WHERE external_ref IS NOT NULL
      DO UPDATE SET
        name       = EXCLUDED.name,
        email      = EXCLUDED.email,
        phone_e164 = EXCLUDED.phone_e164,
        locale     = EXCLUDED.locale,
        timezone   = EXCLUDED.timezone,
        updated_at = NOW()
      RETURNING *
    `;
    return mapRecipient(row);
  }

  const [row] = await sql<RecipientRow[]>`
    INSERT INTO recipients (tenant_id, external_ref, name, email, phone_e164, locale, timezone)
    VALUES (${tenantId}, ${externalRef ?? null}, ${name ?? null}, ${email ?? null}, ${phoneE164 ?? null}, ${locale ?? null}, ${timezone ?? null})
    RETURNING *
  `;
  return mapRecipient(row);
}

export async function findRecipientById(id: string) {
  const sql = getDb();
  const [row] = await sql<RecipientRow[]>`
    SELECT * FROM recipients WHERE id = ${id}
  `;
  return row ? mapRecipient(row) : null;
}

export async function findRecipientByExternalRef(tenantId: string, externalRef: string) {
  const sql = getDb();
  const [row] = await sql<RecipientRow[]>`
    SELECT * FROM recipients WHERE tenant_id = ${tenantId} AND external_ref = ${externalRef}
  `;
  return row ? mapRecipient(row) : null;
}

export async function upsertConsent(recipientId: string, input: UpsertConsentInput) {
  const sql = getDb();
  const { tenantId, channelType, status, source, metadata, grantedAt, revokedAt } = input;

  const [row] = await sql<ConsentRow[]>`
    INSERT INTO recipient_consents (tenant_id, recipient_id, channel_type, status, source, metadata, granted_at, revoked_at)
    VALUES (
      ${tenantId}, ${recipientId}, ${channelType}, ${status}, ${source},
      ${metadata ? JSON.stringify(metadata) : null},
      ${grantedAt ?? null}, ${revokedAt ?? null}
    )
    ON CONFLICT (tenant_id, recipient_id, channel_type) DO UPDATE SET
      status     = EXCLUDED.status,
      source     = EXCLUDED.source,
      metadata   = EXCLUDED.metadata,
      granted_at = EXCLUDED.granted_at,
      revoked_at = EXCLUDED.revoked_at,
      updated_at = NOW()
    RETURNING *
  `;
  return mapConsent(row);
}
