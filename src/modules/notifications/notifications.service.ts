import { ConflictError, NotFoundError } from '../../errors.js';
import type { CreateNotificationRequestInput, ListNotificationRequestsQuery } from './notifications.schema.js';
import {
  createNotificationRequest as repoCreate,
  findDuplicateRequest,
  listNotificationRequests as repoList,
  findNotificationById as repoFindById,
  cancelNotificationRequest as repoCancel,
  findNotificationStatusById,
} from './notifications.repository.js';
import {
  findRecipientById,
  findRecipientByExternalRef,
  upsertRecipient,
} from '../recipients/recipients.repository.js';

async function resolveRecipientId(
  tenantId: string,
  recipient: CreateNotificationRequestInput['recipient'],
): Promise<string> {
  if (recipient.recipientId) {
    const existing = await findRecipientById(recipient.recipientId);
    if (!existing) throw new NotFoundError(`Recipient ${recipient.recipientId} not found`);
    return recipient.recipientId;
  }

  if (recipient.externalRef) {
    const existing = await findRecipientByExternalRef(tenantId, recipient.externalRef);
    if (existing) return existing.id;
  }

  const created = await upsertRecipient({
    tenantId,
    externalRef: recipient.externalRef ?? undefined,
    name: recipient.name ?? undefined,
    email: recipient.email ?? undefined,
    phoneE164: recipient.phoneE164 ?? undefined,
  });
  return created.id;
}

export async function createNotificationRequest(input: CreateNotificationRequestInput) {
  if (input.externalRequestId) {
    const duplicate = await findDuplicateRequest(input.tenantId, input.externalRequestId);
    if (duplicate) {
      throw new ConflictError(
        `Notification request with externalRequestId "${input.externalRequestId}" already exists`,
      );
    }
  }

  const recipientId = await resolveRecipientId(input.tenantId, input.recipient);
  return repoCreate(input, recipientId);
}

export async function listNotificationRequests(query: ListNotificationRequestsQuery) {
  return repoList(query);
}

export async function getNotificationById(id: string) {
  const notification = await repoFindById(id);
  if (!notification) throw new NotFoundError(`Notification request ${id} not found`);
  return notification;
}

export async function cancelNotificationRequest(id: string) {
  const existing = await findNotificationStatusById(id);
  if (!existing) throw new NotFoundError(`Notification request ${id} not found`);

  if (existing.status !== 'queued') {
    throw new ConflictError(
      `Cannot cancel notification in status "${existing.status}". Only "queued" notifications can be canceled.`,
    );
  }

  const updated = await repoCancel(id);
  if (!updated) {
    throw new ConflictError('Notification could not be canceled due to a concurrent status change');
  }

  return { id: updated.id, status: updated.status };
}
