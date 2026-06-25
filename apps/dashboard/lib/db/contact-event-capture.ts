import {
  ActionType,
  ActorType,
  type Contact,
  type Prisma
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

const fieldsToCheck = [
  'record',
  'image',
  'name',
  'email',
  'address',
  'phone',
  'stage',
  'tags'
] as const;

type FieldToCheck = (typeof fieldsToCheck)[number];

type ChangeEntry = {
  old: string | null;
  new: string | null;
};

type ContactChanges = {
  [K in FieldToCheck]?: ChangeEntry;
};

type ContactWithTags = Contact & {
  tags: { text: string }[];
};

function safeStringify<T>(value: T): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function joinTags(tags: { text: string }[]): string {
  return [...new Set(tags.map((tag) => tag.text))].join(',');
}

export function detectChanges(
  currentContact: Partial<ContactWithTags> | null,
  updatedContact: ContactWithTags,
  updateData?: Prisma.ContactUpdateInput
): ContactChanges {
  const changes: ContactChanges = {};

  for (const field of fieldsToCheck) {
    if (field === 'tags') {
      const oldTags = currentContact?.tags
        ? joinTags(currentContact.tags)
        : null;
      const newTags = joinTags(updatedContact.tags);
      if (oldTags !== newTags) {
        changes.tags = { old: oldTags, new: newTags };
      }
    } else {
      const oldValue = currentContact
        ? safeStringify(currentContact[field as keyof Contact])
        : null;
      const newValue = safeStringify(updatedContact[field as keyof Contact]);
      if (oldValue !== newValue && (!updateData || field in updateData)) {
        changes[field] = { old: oldValue, new: newValue };
      }
    }
  }

  return changes;
}

export async function createContactAndCaptureEvent(
  contactData: Prisma.ContactCreateInput,
  actorId: string
): Promise<ContactWithTags> {
  return await prisma.$transaction(async (tx) => {
    const createdAt = contactData.createdAt ?? new Date();

    const newContact = await tx.contact.create({
      data: {
        ...contactData,
        createdAt: createdAt,
        updatedAt: createdAt
      },
      include: { tags: true }
    });

    const changes = detectChanges(null, newContact);

    await tx.contactActivity.create({
      data: {
        contactId: newContact.id,
        actionType: ActionType.CREATE,
        actorId,
        actorType: ActorType.MEMBER,
        metadata: changes,
        occurredAt: createdAt
      }
    });

    return newContact;
  });
}

export async function updateContactAndCaptureEvent(
  contactId: string,
  updateData: Prisma.ContactUpdateInput,
  actorId: string
): Promise<ContactChanges> {
  return await prisma.$transaction(async (tx) => {
    const currentContact = await tx.contact.findUnique({
      where: { id: contactId },
      include: { tags: true }
    });

    if (!currentContact) {
      throw new Error('Contact not found');
    }

    const updatedContact = await tx.contact.update({
      where: { id: contactId },
      data: { ...updateData, updatedAt: new Date() },
      include: { tags: true }
    });

    const changes = detectChanges(currentContact, updatedContact, updateData);

    if (Object.keys(changes).length > 0) {
      await tx.contactActivity.create({
        data: {
          contactId,
          actionType: ActionType.UPDATE,
          actorId,
          actorType: ActorType.MEMBER,
          metadata: changes,
          occurredAt: new Date()
        }
      });
    }

    return changes;
  });
}
