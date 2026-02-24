import { z } from 'zod';

export const channelTypeSchema = z.enum(['whatsapp', 'email']);
export type ChannelType = z.infer<typeof channelTypeSchema>;

export const consentStatusSchema = z.enum(['opted_in', 'opted_out', 'pending']);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const notificationStatusSchema = z.enum(['queued', 'processing', 'sent', 'failed', 'canceled']);
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;

export const prioritySchema = z.enum(['low', 'normal', 'high']);
export type Priority = z.infer<typeof prioritySchema>;

export const templateStatusSchema = z.enum(['draft', 'active', 'disabled']);
export type TemplateStatus = z.infer<typeof templateStatusSchema>;

export function errorResponse(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
