import * as React from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

import { ContactsBrowser } from '@/components/dashboard/contacts/contacts-browser';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getUserContacts } from '@/data/contacts/get-contacts';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.Contacts,
  'Contacts'
);

function ContactsFallback(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="h-8 w-40 animate-pulse bg-muted/40" />
      <div className="h-24 animate-pulse bg-muted/40" />
    </div>
  );
}

async function ContactsPageContent(): Promise<React.JSX.Element> {
  await connection();
  const data = await getUserContacts();
  return (
    <SectionPage width="xl">
      <ContactsBrowser
        contacts={data.contacts}
        businessName={data.businessName}
      />
    </SectionPage>
  );
}

export default function ContactsPage(): React.JSX.Element {
  return (
    <React.Suspense fallback={<ContactsFallback />}>
      <ContactsPageContent />
    </React.Suspense>
  );
}
