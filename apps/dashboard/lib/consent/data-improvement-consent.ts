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
 * Plan + consent gates for training pipelines.
 *
 * Org-scoped Desk features (runbooks, content gaps, resolution loops /
 * auto-training) require plan capability only — they serve the customer's own
 * agents under the DPA and do not need "Help improve Humaner" consent.
 *
 * {@link canContributePlatformPatterns} is the optional product-improvement
 * opt-in (anonymised patterns for Humaner platform / model enhancement).
 * Model fine-tuning requires {@link organizationAllowsModelTraining} separately.
 * Visitor Iris memory is not gated here.
 */
export type OrganizationTrainingAccess = {
  consent: boolean;
  modelTrainingConsent: boolean;
  /** Embed user messages + run HDBSCAN content-gap clustering (org-scoped). */
  canDetectContentGaps: boolean;
  /** Feed Human Desk resolutions into org ResolutionClusters (org-scoped). */
  canAutoTrainClusters: boolean;
  /**
   * Contribute anonymised patterns to platform Skills / Runbooks / failure scores.
   * Requires optional data-improvement consent + Frontier capabilities.
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
    canDetectContentGaps: capabilities.contentGaps,
    canAutoTrainClusters: capabilities.autoTraining,
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
