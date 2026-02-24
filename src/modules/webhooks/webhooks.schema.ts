import { z } from 'zod';

export const webhookEventStatusSchema = z.enum(['received', 'processed', 'ignored', 'failed']);
export type WebhookEventStatus = z.infer<typeof webhookEventStatusSchema>;
