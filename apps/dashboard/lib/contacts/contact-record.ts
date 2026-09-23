import 'server-only';

import {
  companyFromEmail,
  nameFromEmail,
  normalizeContactEmail
} from '@/lib/contacts/contact-email';
import { importContactPictureFromEmail } from '@/lib/contacts/import-contact-picture';
import { prisma } from '@/lib/db/prisma';
import { getContactImageUrl } from '@/lib/urls/get-contact-image-url';
import { ValidationError } from '@/lib/validation/exceptions';

export type SavedContact = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  notes: string | null;
  image: string | null;
};

async function storePicture(
  contactId: string,
  email: string
): Promise<string | null> {
  const picture = await importContactPictureFromEmail(email);
  if (!picture) return null;

  await prisma.contactImage.upsert({
    where: { contactId },
    create: {
      contactId,
      data: picture.bytes,
      contentType: picture.contentType,
      hash: picture.hash
    },
    update: {
      data: picture.bytes,
      contentType: picture.contentType,
      hash: picture.hash
    }
  });

  const image = getContactImageUrl(contactId, picture.hash);
  await prisma.contact.update({
    where: { id: contactId },
    data: { image }
  });
  return image;
}

export async function saveUserContact(input: {
  userId: string;
  email: string;
  name?: string | null;
  company?: string | null;
  notes?: string | null;
}): Promise<{ contact: SavedContact; created: boolean }> {
  const email = normalizeContactEmail(input.email);
  if (!email) throw new ValidationError('Enter a valid email address.');

  const existing = await prisma.contact.findUnique({
    where: { userId_email: { userId: input.userId, email } },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      notes: true,
      image: true
    }
  });

  const company = companyFromEmail(email);

  if (existing) {
    let image = existing.image;
    if (!image) {
      image = await storePicture(existing.id, email);
    }
    if (existing.company !== company) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { company }
      });
    }
    return {
      created: false,
      contact: { ...existing, company, image }
    };
  }

  const name = (input.name?.trim() || nameFromEmail(email)).slice(0, 128);

  const created = await prisma.contact.create({
    data: {
      userId: input.userId,
      email,
      name,
      company,
      notes: input.notes?.trim() || null
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

  const image = await storePicture(created.id, email);
  return {
    created: true,
    contact: { ...created, image }
  };
}

export async function loadUserContactsByEmail(
  userId: string,
  emails: string[]
): Promise<Map<string, { id: string; email: string; image: string | null }>> {
  const unique = [
    ...new Set(
      emails
        .map((email) => normalizeContactEmail(email))
        .filter((email): email is string => Boolean(email))
    )
  ];
  if (unique.length === 0) return new Map();

  const rows = await prisma.contact.findMany({
    where: { userId, email: { in: unique } },
    select: { id: true, email: true, image: true }
  });
  return new Map(rows.map((row) => [row.email, row]));
}

export async function refreshUserContactPicture(input: {
  userId: string;
  contactId: string;
}): Promise<SavedContact> {
  const contact = await prisma.contact.findFirst({
    where: { id: input.contactId, userId: input.userId },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      notes: true,
      image: true
    }
  });
  if (!contact) throw new ValidationError('Contact not found.');

  const image =
    (await storePicture(contact.id, contact.email)) ?? contact.image;
  return { ...contact, image };
}
