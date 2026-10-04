import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { OrganizationVerticalTopics } from '@/components/dashboard/home/organization-vertical-topics';
import { InboxSettingsTabs } from '@/components/dashboard/inbox/inbox-settings-tabs';
import { DataImprovementConsentCard } from '@/components/dashboard/settings/organization/information/data-improvement-consent-card';
import { OrganizationDangerZoneCard } from '@/components/dashboard/settings/organization/information/organization-danger-zone-card';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { SocialMediaCard } from '@/components/dashboard/settings/organization/information/social-media-card';
import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getDataImprovementConsentSettings } from '@/data/organization/get-data-improvement-consent-settings';
import { getOrganizationDetails } from '@/data/organization/get-organization-details';
import { getSocialMedia } from '@/data/organization/get-social-media';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { createDashboardPageMetadata } from '@/lib/metadata/dashboard-metadata';
import {
  getVerticalCommonTopics,
  resolveSelectedVerticalTopics
} from '@/lib/organization/vertical-topics';

export const metadata: Metadata = createDashboardPageMetadata(
  Routes.OrganizationWorkspace,
  'Workspace'
);

export default async function WorkspacePage(): Promise<React.JSX.Element> {
  await connection();

  const session = await dedupedAuth();
  if (!checkSession(session)) {
    redirect(getLoginRedirect());
  }

  await requireDashboardPageOrRedirect('overview');

  const profile = await getProfile();
  const owner = isWorkspaceOwner(profile);
  const [details, consentSettings, organization, socialMedia] =
    await Promise.all([
      getOrganizationDetails(),
      getDataImprovementConsentSettings(),
      prisma.organization.findFirst({
        where: { id: session.user.organizationId },
        select: {
          industry: true,
          targetAudience: true,
          verticalTopics: true
        }
      }),
      owner ? getSocialMedia() : Promise.resolve(null)
    ]);

  const industry = organization?.industry ?? null;
  const commonTopics = industry ? getVerticalCommonTopics(industry) : [];
  const hasVertical = Boolean(industry && commonTopics.length > 0);
  const selectedTopics = hasVertical
    ? resolveSelectedVerticalTopics(organization?.verticalTopics, commonTopics)
    : [];

  return (
    <SectionPage
      width="xl"
      className="flex min-h-0 flex-1 flex-col"
    >
      <InboxSettingsTabs
        active="settings"
        className="justify-center"
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <OrganizationDetailsCard
          details={details}
          industry={industry}
          targetAudience={organization?.targetAudience ?? null}
          brandHeader="none"
          readOnly={!owner}
        />

        {hasVertical && industry && isOssDeployment() ? (
          <OrganizationVerticalTopics
            industry={industry}
            commonTopics={commonTopics}
            selectedTopics={selectedTopics}
            readOnly={!owner}
          />
        ) : null}

        {owner && socialMedia ? (
          <SocialMediaCard socialMedia={socialMedia} />
        ) : null}

        {!isOssDeployment() ? (
          <DataImprovementConsentCard
            consent={consentSettings.consent}
            consentedAt={consentSettings.consentedAt}
            modelTrainingConsent={consentSettings.modelTrainingConsent}
            modelTrainingConsentedAt={consentSettings.modelTrainingConsentedAt}
            isOwner={consentSettings.isOwner}
          />
        ) : null}

        <OrganizationDangerZoneCard
          workspaceName={details.name}
          workspaceRole={profile.workspaceRole}
        />
      </div>
    </SectionPage>
  );
}
