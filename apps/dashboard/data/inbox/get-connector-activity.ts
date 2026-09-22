import 'server-only';

import { cache } from 'react';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import {
  listConnectorEvents,
  listConnectorSummaries,
  type ConnectorEventRecord,
  type ConnectorSidebarSummary
} from '@/lib/connectors/events';
import { prisma } from '@/lib/db/prisma';
import {
  isCompanionIntegrationId,
  type CompanionIntegrationId
} from '@/lib/inbox/companion-rights';
import { loadLinearWorkspace } from '@/lib/workspace-api/connectors';

export type LinearIssueRow = {
  id: string;
  identifier: string;
  title: string;
  url: string | null;
  state: string | null;
  assignee: string | null;
  team: string | null;
};

export type ConnectorActivity = {
  connector: CompanionIntegrationId;
  workspace: string | null;
  issues: LinearIssueRow[];
  events: ConnectorEventRecord[];
  error: string | null;
};

export const getConnectorSummaries = cache(
  async (): Promise<ConnectorSidebarSummary[]> => {
    const session = await dedupedAuth();
    if (!checkSession(session) || !session.user.organizationId) return [];

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { onboardingIntegrations: true }
    });
    const connectors = (organization?.onboardingIntegrations ?? []).filter(
      isCompanionIntegrationId
    );
    try {
      return await listConnectorSummaries(
        session.user.organizationId,
        connectors
      );
    } catch {
      return connectors.map((id) => ({
        id,
        processing: false,
        inbound: 0,
        outbound: 0,
        lastTitle: null
      }));
    }
  }
);

export async function getConnectorActivity(
  connector: CompanionIntegrationId
): Promise<ConnectorActivity> {
  const session = await dedupedAuth();
  const organizationId = session?.user.organizationId;
  if (!checkSession(session) || !organizationId) {
    return {
      connector,
      workspace: null,
      issues: [],
      events: [],
      error: 'Sign in to load this connector.'
    };
  }

  let events: ConnectorEventRecord[] = [];
  try {
    events = await listConnectorEvents(organizationId, connector);
  } catch {
    events = [];
  }

  if (connector !== 'linear') {
    return {
      connector,
      workspace: null,
      issues: [],
      events,
      error: null
    };
  }

  const listed = await loadLinearWorkspace(organizationId);

  const data = listed.data as
    | { workspace?: string | null; issues?: LinearIssueRow[] }
    | undefined;

  return {
    connector,
    workspace: data?.workspace ?? null,
    issues: listed.ok ? (data?.issues ?? []) : [],
    events,
    error: listed.ok ? null : (listed.error ?? 'Linear did not return issues.')
  };
}
