import 'server-only';

import { prisma } from '@/lib/db/prisma';

/** Whether the organization opted in to optional data-improvement processing. */
export async function organizationAllowsDataImprovement(
  organizationId: string
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { dataImprovementConsent: true }
  });

  return organization?.dataImprovementConsent === true;
}

export type DataImprovementConsentState = {
  /** null = owner has not answered the prompt yet */
  consent: boolean | null;
  consentedAt: Date | null;
};

export async function getDataImprovementConsentState(
  organizationId: string
): Promise<DataImprovementConsentState> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      dataImprovementConsent: true,
      dataImprovementConsentAt: true
    }
  });

  return {
    consent: organization?.dataImprovementConsent ?? null,
    consentedAt: organization?.dataImprovementConsentAt ?? null
  };
}
