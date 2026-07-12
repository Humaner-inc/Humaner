import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OrganizationWorkspaceBanner } from '@/components/dashboard/home/organization-workspace-banner';
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
  title: createTitle('Organization')
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
        targetAudience: true,
        logoUrl: true
      }
    })
  ]);

  const organizationTitle = details.name?.trim()
    ? `${details.name.trim()}'s Organization`
    : 'Organization';

  return (
    <SectionPage width="md">
      <div className="space-y-8">
        <OrganizationWorkspaceBanner
          title={organizationTitle}
          name={details.name}
          website={details.website}
          logoUrl={organization?.logoUrl ?? null}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
        />

        <OrganizationDetailsCard
          details={details}
          industry={organization?.industry ?? null}
          targetAudience={organization?.targetAudience ?? null}
          brandHeader="none"
        />

        <WorkspaceAccentSection
          accentColor={organization?.accentColor ?? null}
        />
      </div>
    </SectionPage>
  );
}
