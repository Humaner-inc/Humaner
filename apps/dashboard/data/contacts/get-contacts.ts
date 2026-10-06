import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type ContactListItem = {
  id: string;
  email: string;
  name: string;
  company: string | null;
  notes: string | null;
  image: string | null;
};

export type ContactGroupListItem = {
  id: string;
  name: string;
  color: string;
  contactIds: string[];
};

export async function getUserContacts(): Promise<{
  contacts: ContactListItem[];
  groups: ContactGroupListItem[];
  businessName: string;
}> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  const [contacts, groups, organization] = await Promise.all([
    prisma.contact.findMany({
      where: { userId: session.user.id },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        notes: true,
        image: true
      }
    }),
    prisma.contactGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
        members: { select: { contactId: true } }
      }
    }),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true }
    })
  ]);

  return {
    contacts,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      contactIds: g.members.map((m) => m.contactId)
    })),
    businessName: organization?.name ?? 'this business'
  };
}
