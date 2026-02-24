import { z } from 'zod';
import { channelTypeSchema, notificationStatusSchema, prioritySchema } from '../../schemas/common.js';

export const recipientRefSchema = z.object({
  recipientId: z.string().nullable().optional(),
  externalRef: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phoneE164: z.string().nullable().optional(),
});

export const createNotificationRequestSchema = z.object({
  tenantId: z.string().min(1),
  sourceService: z.string().min(1),
  externalRequestId: z.string().optional(),
  eventType: z.string().min(1),
  channelType: channelTypeSchema,
  recipient: recipientRefSchema,
  templateKey: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  scheduledAt: z.string().datetime().nullable().optional(),
  priority: prioritySchema.default('normal'),
});

export type CreateNotificationRequestInput = z.infer<typeof createNotificationRequestSchema>;

export const listNotificationRequestsQuerySchema = z.object({
  tenantId: z.string().min(1),
  status: notificationStatusSchema.optional(),
  channelType: channelTypeSchema.optional(),
  recipientId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListNotificationRequestsQuery = z.infer<typeof listNotificationRequestsQuerySchema>;
