import { z } from 'zod';
import { channelTypeSchema, consentStatusSchema } from '../../schemas/common.js';

export const upsertRecipientSchema = z.object({
  tenantId: z.string().min(1),
  externalRef: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phoneE164: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export type UpsertRecipientInput = z.infer<typeof upsertRecipientSchema>;

export const upsertConsentSchema = z.object({
  tenantId: z.string().min(1),
  channelType: channelTypeSchema,
  status: consentStatusSchema,
  source: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  grantedAt: z.string().datetime().nullable().optional(),
  revokedAt: z.string().datetime().nullable().optional(),
});

export type UpsertConsentInput = z.infer<typeof upsertConsentSchema>;
