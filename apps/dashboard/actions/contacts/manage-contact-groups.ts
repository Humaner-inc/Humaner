'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { saveUserContact } from '@/lib/contacts/contact-record';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ValidationError } from '@/lib/validation/exceptions';
import {
  addContactToGroupSchema,
  contactGroupIdSchema,
  createContactGroupSchema,
  removeContactFromGroupSchema,
  updateContactGroupSchema
} from '@/schemas/contacts/contact-group-schema';

function revalidateContacts(): void {
  revalidatePath(Routes.Contacts);
}

export const createContactGroup = authActionClient
  .metadata({ actionName: 'createContactGroup' })
  .schema(createContactGroupSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const name = parsedInput.name.trim();
    const existing = await prisma.contactGroup.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: name, mode: 'insensitive' }
      },
      select: { id: true }
    });
    if (existing) {
      throw new ValidationError('A group with that name already exists.');
    }

    const contactIds: string[] = [];
    for (const member of parsedInput.members ?? []) {
      const { contact } = await saveUserContact({
        userId: session.user.id,
        email: member.email,
        name: member.name
      });
      contactIds.push(contact.id);
    }

    const group = await prisma.contactGroup.create({
      data: {
        userId: session.user.id,
        name,
        color: parsedInput.color,
        members: {
          create: [...new Set(contactIds)].map((contactId) => ({ contactId }))
        }
      },
      select: {
        id: true,
        name: true,
        color: true,
        members: { select: { contactId: true } }
      }
    });
    revalidateContacts();
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      contactIds: group.members.map((m) => m.contactId)
    };
  });

export const updateContactGroup = authActionClient
  .metadata({ actionName: 'updateContactGroup' })
  .schema(updateContactGroupSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.contactGroup.findFirst({
      where: { id: parsedInput.groupId, userId: session.user.id },
      select: { id: true }
    });
    if (!existing) throw new NotFoundError('Group not found.');

    const group = await prisma.contactGroup.update({
      where: { id: existing.id },
      data: {
        ...(parsedInput.color ? { color: parsedInput.color } : {}),
        ...(parsedInput.name ? { name: parsedInput.name.trim() } : {})
      },
      select: { id: true, name: true, color: true }
    });
    revalidateContacts();
    return group;
  });

export const deleteContactGroup = authActionClient
  .metadata({ actionName: 'deleteContactGroup' })
  .schema(contactGroupIdSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.contactGroup.findFirst({
      where: { id: parsedInput.groupId, userId: session.user.id },
      select: { id: true }
    });
    if (!existing) throw new NotFoundError('Group not found.');
    await prisma.contactGroup.delete({ where: { id: existing.id } });
    revalidateContacts();
    return { id: existing.id };
  });

export const addContactToGroup = authActionClient
  .metadata({ actionName: 'addContactToGroup' })
  .schema(addContactToGroupSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const group = await prisma.contactGroup.findFirst({
      where: { id: parsedInput.groupId, userId: session.user.id },
      select: { id: true }
    });
    if (!group) throw new NotFoundError('Group not found.');

    const contact = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: session.user.id },
      select: { id: true }
    });
    if (!contact) throw new NotFoundError('Contact not found.');

    await prisma.contactGroupMember.upsert({
      where: {
        groupId_contactId: {
          groupId: group.id,
          contactId: contact.id
        }
      },
      create: { groupId: group.id, contactId: contact.id },
      update: {}
    });
    revalidateContacts();
    return { ok: true };
  });

export const removeContactFromGroup = authActionClient
  .metadata({ actionName: 'removeContactFromGroup' })
  .schema(removeContactFromGroupSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const group = await prisma.contactGroup.findFirst({
      where: { id: parsedInput.groupId, userId: session.user.id },
      select: { id: true }
    });
    if (!group) throw new NotFoundError('Group not found.');

    await prisma.contactGroupMember.deleteMany({
      where: {
        groupId: group.id,
        contactId: parsedInput.contactId
      }
    });
    revalidateContacts();
    return { ok: true };
  });
