import { getDb } from '../../db/index.js';
import type { CreateTemplateInput } from './templates.schema.js';
import type { ChannelType } from '../../schemas/common.js';

type TemplateRow = {
  id: string;
  tenant_id: string;
  key: string;
  channel_type: string;
  provider_template_name: string | null;
  language: string;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

function mapTemplate(row: TemplateRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    key: row.key,
    channelType: row.channel_type,
    providerTemplateName: row.provider_template_name,
    language: row.language,
    status: row.status,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createTemplate(input: CreateTemplateInput) {
  const sql = getDb();
  const { tenantId, key, channelType, providerTemplateName, language, status, version } = input;

  const [row] = await sql<TemplateRow[]>`
    INSERT INTO templates (tenant_id, key, channel_type, provider_template_name, language, status, version)
    VALUES (${tenantId}, ${key}, ${channelType}, ${providerTemplateName ?? null}, ${language}, ${status}, ${version})
    RETURNING *
  `;
  return mapTemplate(row);
}

export async function listTemplates(tenantId: string, channelType?: ChannelType) {
  const sql = getDb();

  const rows = channelType
    ? await sql<TemplateRow[]>`
        SELECT * FROM templates
        WHERE tenant_id = ${tenantId} AND channel_type = ${channelType}
        ORDER BY created_at DESC
      `
    : await sql<TemplateRow[]>`
        SELECT * FROM templates
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;

  return rows.map(mapTemplate);
}
