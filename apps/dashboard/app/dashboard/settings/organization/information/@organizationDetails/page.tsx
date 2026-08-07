import * as React from 'react';
import { redirect } from 'next/navigation';
import { getVerticalConfig } from '@/services/training/verticals';

import { OrganizationVerticalTopics } from '@/components/dashboard/home/organization-vertical-topics';
import { DataImprovementConsentCard } from '@/components/dashboard/settings/organization/information/data-improvement-consent-card';
import { OrganizationDetailsCard } from '@/components/dashboard/settings/organization/information/organization-details-card';
import { AnnotatedSection } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { getDataImprovementConsentSettings } from '@/data/organization/get-data-improvement-consent-settings';
import { getOrganizationDetails } from '@/data/organization/get-organization-details';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { resolveSelectedVerticalTopics } from '@/lib/organization/vertical-topics';

export default async function OrganizationDetailsPage(): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const [details, consentSettings, organization] = await Promise.all([
    getOrganizationDetails(),
    getDataImprovementConsentSettings(),
    prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: {
        industry: true,
        targetAudience: true,
        verticalTopics: true
      }
    })
  ]);

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
    <>
      <AnnotatedSection
        title="Organization details"
        description="Basic details about your organization."
      >
        <OrganizationDetailsCard
          details={details}
          industry={industry}
          targetAudience={organization?.targetAudience ?? null}
        />
      </AnnotatedSection>

      {industry && vertical ? (
        <>
          <Separator />
          <AnnotatedSection
            title="Industry topics"
            description="Topics that shape agent persona and training focus for this vertical."
          >
            <OrganizationVerticalTopics
              industry={industry}
              commonTopics={vertical.commonTopics}
              selectedTopics={selectedTopics}
            />
          </AnnotatedSection>
        </>
      ) : null}

      {!isOssDeployment() && (
        <>
          <Separator />
          <AnnotatedSection
            title="Data and Privacy"
            description="Manage your Org data agreement. Humaner only aggregates anonymised patterns for agents improvements. Company's data is never shared."
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
      )}
    </>
  );
}
