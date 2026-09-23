'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { companyFromEmail } from '@/lib/contacts/contact-email';
import { loadContactMailHistory } from '@/lib/contacts/contact-history';
import {
  refreshUserContactPicture,
  saveUserContact
} from '@/lib/contacts/contact-record';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import {
  addContactSchema,
  contactIdSchema,
  updateContactSchema
} from '@/schemas/contacts/contact-schema';

function revalidateContacts(): void {
  revalidatePath(Routes.Contacts);
  revalidatePath(Routes.InboxAll);
}

export const addContact = authActionClient
  .metadata({ actionName: 'addContact' })
  .schema(addContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const { contact, created } = await saveUserContact({
      userId: session.user.id,
      email: parsedInput.email,
      name: parsedInput.name,
      company: parsedInput.company,
      notes: parsedInput.notes
    });
    revalidateContacts();
    return { ...contact, created };
  });

export const updateContact = authActionClient
  .metadata({ actionName: 'updateContact' })
  .schema(updateContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: session.user.id },
      select: { id: true, email: true }
    });
    if (!existing) throw new NotFoundError('Contact not found.');

    const contact = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        name: parsedInput.name,
        company: companyFromEmail(existing.email),
        notes: parsedInput.notes?.trim() || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        notes: true,
        image: true
      }
    });
    revalidateContacts();
    return contact;
  });

export const deleteContact = authActionClient
  .metadata({ actionName: 'deleteContact' })
  .schema(contactIdSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: session.user.id },
      select: { id: true }
    });
    if (!existing) throw new NotFoundError('Contact not found.');

    await prisma.contact.delete({ where: { id: existing.id } });
    revalidateContacts();
    return { id: existing.id };
  });

export const refreshContactPicture = authActionClient
  .metadata({ actionName: 'refreshContactPicture' })
  .schema(contactIdSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const contact = await refreshUserContactPicture({
      userId: session.user.id,
      contactId: parsedInput.contactId
    });
    revalidateContacts();
    return contact;
  });

export const getContactHistory = authActionClient
  .metadata({ actionName: 'getContactHistory' })
  .schema(contactIdSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: session.user.id },
      select: { email: true }
    });
    if (!contact) throw new NotFoundError('Contact not found.');

    const [threads, organization] = await Promise.all([
      loadContactMailHistory({
        userId: session.user.id,
        organizationId: session.user.organizationId,
        email: contact.email
      }),
      prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { name: true }
      })
    ]);

    return {
      businessName: organization?.name ?? 'this business',
      threads
    };
  });
