import { ConflictError } from '../../errors.js';
import type { CreateTemplateInput } from './templates.schema.js';
import type { ChannelType } from '../../schemas/common.js';
import { createTemplate as repoCreate, listTemplates as repoList } from './templates.repository.js';

export async function createTemplate(input: CreateTemplateInput) {
  try {
    return await repoCreate(input);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      throw new ConflictError(
        `Template with key "${input.key}", channel "${input.channelType}", version ${input.version} already exists for tenant "${input.tenantId}"`,
      );
    }
    throw err;
  }
}

export async function listTemplates(tenantId: string, channelType?: ChannelType) {
  return repoList(tenantId, channelType);
}
