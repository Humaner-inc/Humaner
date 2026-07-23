import 'server-only';

import { getPlanCapabilities } from '@humaner/shared/plans';

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

/** Whether the organization opted in to model fine-tuning contributions. */
export async function organizationAllowsModelTraining(
  organizationId: string
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { modelTrainingConsent: true }
  });

  return organization?.modelTrainingConsent === true;
}

/**
 * Consent + plan gates for org-scoped improvement pipelines
 * (embeddings / content gaps / resolution clusters).
 *
 * Visitor Iris memory is separate and is not gated here.
 * Model fine-tuning requires {@link organizationAllowsModelTraining} separately.
 */
export type OrganizationTrainingAccess = {
  consent: boolean;
  modelTrainingConsent: boolean;
  /** Embed user messages + run HDBSCAN content-gap clustering. */
  canDetectContentGaps: boolean;
  /** Feed Human Desk resolutions into ResolutionCluster training. */
  canAutoTrainClusters: boolean;
  /**
   * Contribute anonymised patterns to platform Skills / Runbooks / failure scores.
   * Same gate as data improvement + Frontier capabilities.
   */
  canContributePlatformPatterns: boolean;
};

export async function getOrganizationTrainingAccess(
  organizationId: string
): Promise<OrganizationTrainingAccess> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      dataImprovementConsent: true,
      modelTrainingConsent: true,
      tier: true
    }
  });

  const consent = organization?.dataImprovementConsent === true;
  const modelTrainingConsent = organization?.modelTrainingConsent === true;
  const capabilities = getPlanCapabilities(organization?.tier ?? 'free');

  return {
    consent,
    modelTrainingConsent,
    canDetectContentGaps: consent && capabilities.contentGaps,
    canAutoTrainClusters: consent && capabilities.autoTraining,
    canContributePlatformPatterns:
      consent && (capabilities.contentGaps || capabilities.autoTraining)
  };
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

export type ModelTrainingConsentState = {
  consent: boolean;
  consentedAt: Date | null;
};

export async function getModelTrainingConsentState(
  organizationId: string
): Promise<ModelTrainingConsentState> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      modelTrainingConsent: true,
      modelTrainingConsentAt: true
    }
  });

  return {
    consent: organization?.modelTrainingConsent === true,
    consentedAt: organization?.modelTrainingConsentAt ?? null
  };
}
