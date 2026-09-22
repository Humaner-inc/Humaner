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
import {
  loadGithubWorkspace,
  loadLinearWorkspace,
  loadNotionWorkspace,
  loadStripeWorkspace
} from '@/lib/workspace-api/connectors';

export type ConnectorFeedItem = {
  id: string;
  title: string;
  emphasis: string | null;
  href: string | null;
};

export type ConnectorFeedSection = {
  id: string;
  noun: string;
  nounPlural: string;
  context: string;
  items: ConnectorFeedItem[];
};

export type ConnectorActivity = {
  connector: CompanionIntegrationId;
  workspace: string | null;
  error: string | null;
  sections: ConnectorFeedSection[];
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

function firstError(
  ...results: Array<{ ok: boolean; error?: string }>
): string | null {
  for (const result of results) {
    if (!result.ok && result.error) return result.error;
  }
  return null;
}

function formatStripeAmount(
  amountDue: unknown,
  currency: unknown
): string | null {
  const cents = typeof amountDue === 'number' ? amountDue : Number(amountDue);
  if (!Number.isFinite(cents)) return null;
  const code = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

function activitySection(
  events: ConnectorEventRecord[],
  name: string
): ConnectorFeedSection | null {
  if (events.length === 0) return null;
  return {
    id: 'activity',
    noun: 'update',
    nounPlural: 'updates',
    context: `from ${name}`,
    items: events.map((event) => ({
      id: event.id,
      title: event.title,
      emphasis:
        event.status === 'error'
          ? 'error'
          : event.direction === 'inbound'
            ? 'received'
            : 'sent',
      href: event.externalUrl
    }))
  };
}

async function loadLinearFeed(
  organizationId: string
): Promise<Pick<ConnectorActivity, 'workspace' | 'error' | 'sections'>> {
  const listed = await loadLinearWorkspace(organizationId);
  const data = listed.data as
    | {
        workspace?: string | null;
        issues?: Array<{
          id: string;
          identifier: string;
          title: string;
          url: string | null;
        }>;
      }
    | undefined;
  const workspace = data?.workspace ?? null;
  const issues = listed.ok ? (data?.issues ?? []) : [];

  return {
    workspace,
    error: listed.ok ? null : (listed.error ?? 'Linear did not return issues.'),
    sections: [
      {
        id: 'issues',
        noun: 'issue',
        nounPlural: 'issues',
        context: workspace ? `in ${workspace}` : 'in Linear',
        items: issues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          emphasis: issue.identifier,
          href: issue.url
        }))
      }
    ]
  };
}

async function loadGithubFeed(
  organizationId: string
): Promise<Pick<ConnectorActivity, 'workspace' | 'error' | 'sections'>> {
  const { pullRequests, issues } = await loadGithubWorkspace(organizationId);
  const prData = pullRequests.data as
    | {
        pullRequests?: Array<{
          number: number;
          title: string;
          url: string;
          author?: string;
        }>;
      }
    | undefined;
  const issueData = issues.data as
    | {
        issues?: Array<{
          number: number;
          title: string;
          url: string;
          repo?: string;
        }>;
      }
    | undefined;
  const prs = pullRequests.ok ? (prData?.pullRequests ?? []) : [];
  const issueRows = issues.ok ? (issueData?.issues ?? []) : [];

  return {
    workspace: null,
    error: firstError(pullRequests, issues),
    sections: [
      {
        id: 'pull-requests',
        noun: 'pull request',
        nounPlural: 'pull requests',
        context: 'open',
        items: prs.map((pr) => ({
          id: `pr-${pr.number}-${pr.url}`,
          title: pr.title,
          emphasis: `#${pr.number}`,
          href: pr.url
        }))
      },
      {
        id: 'issues',
        noun: 'issue',
        nounPlural: 'issues',
        context: 'open',
        items: issueRows.map((issue) => ({
          id: `issue-${issue.number}-${issue.url}`,
          title: issue.title,
          emphasis: issue.repo
            ? `${issue.repo} #${issue.number}`
            : `#${issue.number}`,
          href: issue.url
        }))
      }
    ]
  };
}

async function loadStripeFeed(
  organizationId: string
): Promise<Pick<ConnectorActivity, 'workspace' | 'error' | 'sections'>> {
  const listed = await loadStripeWorkspace(organizationId);
  const data = listed.data as
    | {
        invoices?: Array<{
          id: unknown;
          number?: unknown;
          status?: unknown;
          amountDue?: unknown;
          currency?: unknown;
          hostedUrl?: unknown;
        }>;
      }
    | undefined;
  const invoices = listed.ok ? (data?.invoices ?? []) : [];

  return {
    workspace: null,
    error: listed.ok
      ? null
      : (listed.error ?? 'Stripe did not return invoices.'),
    sections: [
      {
        id: 'invoices',
        noun: 'invoice',
        nounPlural: 'invoices',
        context: 'from Stripe',
        items: invoices.map((invoice) => {
          const id = String(invoice.id ?? '');
          const number =
            typeof invoice.number === 'string' && invoice.number
              ? invoice.number
              : id;
          const amount = formatStripeAmount(
            invoice.amountDue,
            invoice.currency
          );
          const status =
            typeof invoice.status === 'string' ? invoice.status : null;
          return {
            id,
            title: number,
            emphasis: [amount, status].filter(Boolean).join(' · ') || null,
            href:
              typeof invoice.hostedUrl === 'string' ? invoice.hostedUrl : null
          };
        })
      }
    ]
  };
}

async function loadNotionFeed(
  organizationId: string
): Promise<Pick<ConnectorActivity, 'workspace' | 'error' | 'sections'>> {
  const listed = await loadNotionWorkspace(organizationId);
  const data = listed.data as
    | { pages?: Array<{ id: string; title: string; url?: string }> }
    | undefined;
  const pages = listed.ok ? (data?.pages ?? []) : [];

  return {
    workspace: null,
    error: listed.ok ? null : (listed.error ?? 'Notion did not return pages.'),
    sections: [
      {
        id: 'pages',
        noun: 'page',
        nounPlural: 'pages',
        context: 'in Notion',
        items: pages.map((page) => ({
          id: page.id,
          title: page.title,
          emphasis: null,
          href: page.url ?? null
        }))
      }
    ]
  };
}

export async function getConnectorActivity(
  connector: CompanionIntegrationId
): Promise<ConnectorActivity> {
  const session = await dedupedAuth();
  const organizationId = session?.user.organizationId;
  if (!checkSession(session) || !organizationId) {
    return {
      connector,
      workspace: null,
      error: 'Sign in to load this connector.',
      sections: []
    };
  }

  const names = {
    linear: 'Linear',
    github: 'GitHub',
    stripe: 'Stripe',
    notion: 'Notion'
  } as const;

  const [events, feed] = await Promise.all([
    listConnectorEvents(organizationId, connector).catch(
      (): ConnectorEventRecord[] => []
    ),
    connector === 'linear'
      ? loadLinearFeed(organizationId)
      : connector === 'github'
        ? loadGithubFeed(organizationId)
        : connector === 'stripe'
          ? loadStripeFeed(organizationId)
          : loadNotionFeed(organizationId)
  ]);

  const activity = activitySection(events, names[connector]);
  return {
    connector,
    ...feed,
    sections: activity ? [...feed.sections, activity] : feed.sections
  };
}
