import { NotFoundError } from '../../errors.js';
import type { UpsertRecipientInput, UpsertConsentInput } from './recipients.schema.js';
import {
  upsertRecipient as repoUpsert,
  findRecipientById as repoFindById,
  upsertConsent as repoUpsertConsent,
} from './recipients.repository.js';

export async function upsertRecipient(input: UpsertRecipientInput) {
  return repoUpsert(input);
}

export async function getRecipientById(id: string) {
  const recipient = await repoFindById(id);
  if (!recipient) throw new NotFoundError(`Recipient ${id} not found`);
  return recipient;
}

export async function upsertConsent(recipientId: string, input: UpsertConsentInput) {
  const recipient = await repoFindById(recipientId);
  if (!recipient) throw new NotFoundError(`Recipient ${recipientId} not found`);
  return repoUpsertConsent(recipientId, input);
}
