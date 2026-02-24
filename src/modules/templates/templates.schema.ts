import { z } from 'zod';
import { channelTypeSchema, templateStatusSchema } from '../../schemas/common.js';

export const createTemplateSchema = z.object({
  tenantId: z.string().min(1),
  key: z.string().min(1),
  channelType: channelTypeSchema,
  providerTemplateName: z.string().nullable().optional(),
  language: z.string().min(1),
  status: templateStatusSchema.default('draft'),
  version: z.number().int().min(1).default(1),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
