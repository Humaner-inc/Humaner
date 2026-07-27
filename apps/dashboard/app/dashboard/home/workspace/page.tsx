import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getVerticalConfig } from '@/services/training/verticals';

import { OrganizationVerticalTopics } from '@/components/dashboard/home/organization-vertical-topics';
import { OrganizationWorkspaceBanner } from '@/components/dashboard/home/organization-workspace-banner';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getOrganizationDetails } from '@/data/organization/get-organization-details';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';
import { resolveSelectedVerticalTopics } from '@/lib/organization/vertical-topics';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.OrganizationWorkspace,
  'Workspace'
);

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
        industry: true,
        targetAudience: true,
        logoUrl: true,
        verticalTopics: true
      }
    })
  ]);

  const organizationTitle = details.name?.trim()
    ? `${details.name.trim()}'s Organization`
    : 'Organization';

  const industry = organization?.industry ?? null;
  const vertical = industry ? getVerticalConfig(industry) : null;
  const selectedTopics =
    industry && vertical
      ? resolveSelectedVerticalTopics(
          organization?.verticalTopics,
          vertical.commonTopics
        )
      : [];

  return (
    <SectionPage width="lg">
      <div className="space-y-6">
        <OrganizationWorkspaceBanner
          title={organizationTitle}
          name={details.name}
          website={details.website}
          logoUrl={organization?.logoUrl ?? null}
          industry={industry}
          targetAudience={organization?.targetAudience ?? null}
        />

        {industry && vertical ? (
          <OrganizationVerticalTopics
            industry={industry}
            commonTopics={vertical.commonTopics}
            selectedTopics={selectedTopics}
          />
        ) : null}

        <OrganizationDetailsCard
          details={details}
          industry={industry}
          targetAudience={organization?.targetAudience ?? null}
          brandHeader="none"
        />
      </div>
    </SectionPage>
  );
}
