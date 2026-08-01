'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #3B82F6');

async function assertAliasInOrg(
  aliasId: string | null | undefined,
  organizationId: string
): Promise<string | null> {
  if (!aliasId) return null;

  const alias = await prisma.mailAlias.findFirst({
    where: { id: aliasId, organizationId },
    select: { id: true }
  });
  if (!alias) throw new NotFoundError('Inbox not found');
  return alias.id;
}

export const createMailTag = ownerActionClient
  .metadata({ actionName: 'createMailTag' })
  .schema(
    z.object({
      name: z.string().trim().min(1).max(64),
      color: hexColor,
      aliasId: z.string().uuid().nullable().optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const aliasId = await assertAliasInOrg(parsedInput.aliasId, organizationId);

    const existing = await prisma.mailTag.findFirst({
      where: {
        organizationId,
        aliasId,
        name: { equals: parsedInput.name, mode: 'insensitive' }
      },
      select: { id: true }
    });
    if (existing) {
      throw new ValidationError('A tag with this name already exists');
    }

    const tag = await prisma.mailTag.create({
      data: {
        id: crypto.randomUUID(),
        organizationId,
        aliasId,
        name: parsedInput.name,
        color: parsedInput.color.toUpperCase()
      },
      select: { id: true }
    });

    revalidatePath(Routes.InboxTags);
    revalidatePath(Routes.InboxAll);
    return { id: tag.id };
  });

export const updateMailTag = ownerActionClient
  .metadata({ actionName: 'updateMailTag' })
  .schema(
    z.object({
      tagId: z.string().uuid(),
      name: z.string().trim().min(1).max(64),
      color: hexColor,
      aliasId: z.string().uuid().nullable().optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const tag = await prisma.mailTag.findFirst({
      where: { id: parsedInput.tagId, organizationId },
      select: { id: true, aliasId: true, name: true, color: true }
    });
    if (!tag) throw new NotFoundError('Tag not found');

    const nextAliasId =
      parsedInput.aliasId === undefined
        ? tag.aliasId
        : await assertAliasInOrg(parsedInput.aliasId, organizationId);

    const clash = await prisma.mailTag.findFirst({
      where: {
        organizationId,
        aliasId: nextAliasId,
        id: { not: parsedInput.tagId },
        name: { equals: parsedInput.name, mode: 'insensitive' }
      },
      select: { id: true }
    });
    if (clash) {
      throw new ValidationError('A tag with this name already exists');
    }

    await prisma.mailTag.update({
      where: { id: parsedInput.tagId },
      data: {
        name: parsedInput.name,
        color: parsedInput.color.toUpperCase(),
        aliasId: nextAliasId
      }
    });

    revalidatePath(Routes.InboxTags);
    revalidatePath(Routes.InboxAll);
    return { success: true };
  });

export const deleteMailTag = ownerActionClient
  .metadata({ actionName: 'deleteMailTag' })
  .schema(z.object({ tagId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const tag = await prisma.mailTag.findFirst({
      where: { id: parsedInput.tagId, organizationId },
      select: { id: true }
    });
    if (!tag) throw new NotFoundError('Tag not found');

    await prisma.mailTag.delete({ where: { id: parsedInput.tagId } });

    revalidatePath(Routes.InboxTags);
    revalidatePath(Routes.InboxAll);
    return { success: true };
  });
