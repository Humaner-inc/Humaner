import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { WorkspaceAccentSection } from '@/components/dashboard/organization/workspace-accent-section';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { SectionPage } from '@/components/ui/section-shell';
import { getOrganizationDetails } from '@/data/organization/get-organization-details';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Workspace')
};

export default async function WorkspacePage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const [details, organization] = await Promise.all([
    getOrganizationDetails(),
    prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: {
        accentColor: true,
        industry: true,
        targetAudience: true
      }
    })
  ]);

  return (
    <SectionPage width="md">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl leading-none">Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organization details and workspace personalization.
          </p>
        </div>

        <OrganizationDetailsCard
          details={details}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
        />

        <WorkspaceAccentSection
          accentColor={organization?.accentColor ?? null}
        />
      </div>
    </SectionPage>
  );
}
