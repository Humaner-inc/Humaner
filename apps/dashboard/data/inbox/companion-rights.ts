import 'server-only';

import { cache } from 'react';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  deriveCompanionActionsFromAliases,
  normalizeCompanionActions,
  normalizeCompanionIntegrations,
  type CompanionAction,
  type CompanionAliasPolicy,
  type CompanionIntegrationId
} from '@/lib/inbox/companion-rights';

export type CompanionWorkspaceRights = {
  actions: CompanionAction[];
  integrations: CompanionIntegrationId[];
  actionSuggestions: boolean;
};

type StoredCompanionSettings = {
  companionActions: string[];
  companionActionSuggestions: boolean | null;
};

async function readStoredCompanionSettings(
  organizationId: string
): Promise<StoredCompanionSettings> {
  const rows = await prisma.$queryRaw<StoredCompanionSettings[]>`
    SELECT "companionActions", "companionActionSuggestions"
    FROM "Organization"
    WHERE id = ${organizationId}::uuid
  `;
  return (
    rows[0] ?? {
      companionActions: [],
      companionActionSuggestions: true
    }
  );
}

async function readAliasPolicies(
  organizationId: string
): Promise<CompanionAliasPolicy[]> {
  const aliases = await prisma.mailAlias.findMany({
    where: { organizationId },
    select: { companionPolicy: true }
  });
  return aliases.map((alias) => alias.companionPolicy);
}

export async function readCompanionWorkspaceRights(
  organizationId: string
): Promise<CompanionWorkspaceRights> {
  const [stored, organization] = await Promise.all([
    readStoredCompanionSettings(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { onboardingIntegrations: true }
    })
  ]);

  const normalized = normalizeCompanionActions(stored.companionActions);
  const actions =
    normalized.length > 0
      ? normalized
      : deriveCompanionActionsFromAliases(
          await readAliasPolicies(organizationId)
        );

  return {
    actions,
    integrations: normalizeCompanionIntegrations(
      organization?.onboardingIntegrations
    ),
    actionSuggestions: stored.companionActionSuggestions !== false
  };
}

export async function writeCompanionActions(
  organizationId: string,
  actions: CompanionAction[]
): Promise<CompanionAction[]> {
  const next = normalizeCompanionActions(actions);
  if (next.length === 0) {
    throw new Error('Select at least one Companion action.');
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "Organization" SET "companionActions" = $1::text[] WHERE id = $2::uuid`,
    next,
    organizationId
  );

  return next;
}

export async function writeCompanionActionSuggestions(
  organizationId: string,
  enabled: boolean
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Organization"
    SET "companionActionSuggestions" = ${enabled}
    WHERE id = ${organizationId}::uuid
  `;
}

export async function writeCompanionIntegrations(
  organizationId: string,
  integrations: Iterable<string>
): Promise<CompanionIntegrationId[]> {
  const next = normalizeCompanionIntegrations(integrations);

  await prisma.organization.update({
    where: { id: organizationId },
    data: { onboardingIntegrations: next }
  });

  return next;
}

export async function workspaceAllowsCompanionAction(
  organizationId: string,
  action: CompanionAction
): Promise<boolean> {
  const { actions } = await readCompanionWorkspaceRights(organizationId);
  return actions.includes(action);
}

export const getCompanionWorkspaceRights = cache(
  async (): Promise<CompanionWorkspaceRights> => {
    const session = await dedupedAuth();
    if (!checkSession(session) || !session.user.organizationId) {
      return { actions: ['DRAFT'], integrations: [], actionSuggestions: true };
    }
    return readCompanionWorkspaceRights(session.user.organizationId);
  }
);
