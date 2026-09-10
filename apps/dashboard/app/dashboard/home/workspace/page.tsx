import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { OrganizationVerticalTopics } from '@/components/dashboard/home/organization-vertical-topics';
import { BusinessHoursCard } from '@/components/dashboard/settings/organization/information/business-hours-card';
import { DataImprovementConsentCard } from '@/components/dashboard/settings/organization/information/data-improvement-consent-card';
import { OrganizationDangerZoneSection } from '@/components/dashboard/settings/organization/information/organization-danger-zone-section';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { SocialMediaCard } from '@/components/dashboard/settings/organization/information/social-media-card';
import { AnnotatedLayout, AnnotatedSection } from '@/components/ui/annotated';
import { SectionPage } from '@/components/ui/section-shell';
import { Separator } from '@/components/ui/separator';
import { Routes } from '@/constants/routes';
import { getProfile } from '@/data/account/get-profile';
import { getBusinessHours } from '@/data/organization/get-business-hours';
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
  const [details, consentSettings, organization, businessHours, socialMedia] =
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
      owner ? getBusinessHours() : Promise.resolve(null),
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
      <div className="mb-6">
        <h1 className="page-title">Workspace</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {owner
            ? 'Name, hours, and data agreements for this workspace. Team, tasks, and resources sit beside this page.'
            : `${details.name} — ask the workspace owner to change settings.`}
        </p>
      </div>

      <AnnotatedLayout className="py-0">
        <AnnotatedSection
          title="Workspace details"
          description="Basic details about this workspace."
        >
          <OrganizationDetailsCard
            details={details}
            industry={industry}
            targetAudience={organization?.targetAudience ?? null}
            brandHeader="none"
            readOnly={!owner}
          />
        </AnnotatedSection>

        {hasVertical && industry && isOssDeployment() ? (
          <>
            <Separator />
            <AnnotatedSection
              title="Industry topics"
              description="Topics that shape Companion and training for this vertical."
            >
              <OrganizationVerticalTopics
                industry={industry}
                commonTopics={commonTopics}
                selectedTopics={selectedTopics}
                readOnly={!owner}
              />
            </AnnotatedSection>
          </>
        ) : null}

        {owner && businessHours && socialMedia ? (
          <>
            <Separator />
            <AnnotatedSection
              title="Working hours"
              description="Used on the calendar and when assigning tasks."
            >
              <BusinessHoursCard businessHours={businessHours} />
            </AnnotatedSection>

            <Separator />
            <AnnotatedSection
              title="Social media"
              description="Add this workspace's social media links."
            >
              <SocialMediaCard socialMedia={socialMedia} />
            </AnnotatedSection>
          </>
        ) : null}

        {!isOssDeployment() ? (
          <>
            <Separator />
            <AnnotatedSection
              title="Data and Privacy"
              description="The DPA covers mail, calendar, and Resources. Optional platform opt-ins are separate from Companion training on this workspace."
            >
              <DataImprovementConsentCard
                consent={consentSettings.consent}
                consentedAt={consentSettings.consentedAt}
                modelTrainingConsent={consentSettings.modelTrainingConsent}
                modelTrainingConsentedAt={
                  consentSettings.modelTrainingConsentedAt
                }
                isOwner={consentSettings.isOwner}
              />
            </AnnotatedSection>
          </>
        ) : null}

        {owner ? (
          <>
            <Separator />
            <OrganizationDangerZoneSection />
          </>
        ) : null}
      </AnnotatedLayout>
    </SectionPage>
  );
}
