import 'server-only';

import {
  finishConnectorEvent,
  recordConnectorEvent,
  upsertThreadConnectorLink
} from '@/lib/connectors/events';
import { prisma } from '@/lib/db/prisma';
import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { getConnectAccessToken } from '@/lib/vercel-connect/client';
import type { WorkspaceToolContext } from '@/lib/workspace-api/authorize';

type WorkspaceToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asLimit(value: unknown, fallback = 20): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(50, Math.max(1, Math.floor(n)));
}

async function requireToken(
  context: WorkspaceToolContext,
  id: CompanionIntegrationId
): Promise<{ token: string } | WorkspaceToolResult> {
  const grant = await getConnectAccessToken(context.organizationId, id);
  if (!grant.ok) {
    return {
      ok: false,
      error: `${grant.error} Activate it in Workspace Settings → Connect.`
    };
  }
  return { token: grant.token };
}

function jsonError(status: number, body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      error?: { message?: string };
    };
    return parsed.message || parsed.error?.message || fallback;
  } catch {
    return body.slice(0, 240) || fallback;
  }
}

async function githubJson(
  token: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers
    }
  });
  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: jsonError(response.status, text, 'GitHub request failed.')
    };
  }
  return { ok: true, data: text ? JSON.parse(text) : null };
}

async function stripeJson(
  token: string,
  path: string
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: jsonError(response.status, text, 'Stripe request failed.')
    };
  }
  return { ok: true, data: text ? JSON.parse(text) : null };
}

const LINEAR_ISSUE_FIELDS = `id identifier title url priority state { id name } assignee { id name } team { id name key }`;

type LinearIssueNode = {
  id: string;
  identifier: string;
  title: string;
  url?: string;
  priority?: number | null;
  state?: { id?: string; name?: string } | null;
  assignee?: { id?: string; name?: string } | null;
  team?: { id?: string; name?: string; key?: string } | null;
};

function mapLinearIssue(node: LinearIssueNode) {
  return {
    id: node.id,
    identifier: node.identifier,
    title: node.title,
    url: node.url ?? null,
    priority: node.priority ?? null,
    state: node.state?.name ?? null,
    stateId: node.state?.id ?? null,
    assignee: node.assignee?.name ?? null,
    team: node.team?.name ?? null,
    teamId: node.team?.id ?? null
  };
}

async function linearGraphql(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  const headers: Record<string, string> = {
    Authorization: token.startsWith('lin_') ? token : `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });
  const payload = (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || payload.errors?.length) {
    return {
      ok: false,
      error: payload.errors?.[0]?.message ?? 'Linear request failed.'
    };
  }
  return { ok: true, data: payload.data ?? {} };
}

async function withLinearEvent<T extends WorkspaceToolResult>(
  context: WorkspaceToolContext,
  kind: string,
  title: string,
  run: () => Promise<T>
): Promise<T> {
  const eventId = await recordConnectorEvent({
    organizationId: context.organizationId,
    connector: 'linear',
    direction: 'outbound',
    status: 'processing',
    kind,
    title
  });
  try {
    const result = await run();
    const data = result.data as
      | { identifier?: string; title?: string; url?: string; id?: string }
      | undefined;
    await finishConnectorEvent(eventId, {
      status: result.ok ? 'ok' : 'error',
      title:
        data?.identifier && data.title
          ? `${data.identifier} · ${data.title}`
          : result.ok
            ? title
            : (result.error ?? title),
      detail: result.ok ? null : result.error,
      externalId: data?.id ?? null,
      externalUrl: data?.url ?? null
    });
    return result;
  } catch (error) {
    await finishConnectorEvent(eventId, {
      status: 'error',
      detail: error instanceof Error ? error.message : 'Linear request failed.'
    });
    throw error;
  }
}

async function upsertThreadLinearLink(
  organizationId: string,
  threadId: string,
  issue: {
    id: string;
    identifier: string;
    title: string;
    url?: string | null;
  }
): Promise<void> {
  await upsertThreadConnectorLink({
    organizationId,
    threadId,
    connector: 'linear',
    externalId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url ?? ''
  });
}

async function fetchLinearIssues(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

  const query = asString(args.query);
  const first = asLimit(args.limit);
  const result = await linearGraphql(
    token.token,
    query
      ? `query SearchIssues($first: Int!, $term: String!) {
          viewer { id displayName organization { name urlKey } }
          searchIssues(term: $term, first: $first, includeComments: false) {
            nodes { ${LINEAR_ISSUE_FIELDS} }
          }
          teams { nodes { id name key } }
        }`
      : `query ListIssues($first: Int!) {
          viewer { id displayName organization { name urlKey } }
          issues(first: $first, includeArchived: false) {
            nodes { ${LINEAR_ISSUE_FIELDS} }
          }
          teams {
            nodes {
              id name key
              issues(first: $first, includeArchived: false) {
                nodes { ${LINEAR_ISSUE_FIELDS} }
              }
            }
          }
        }`,
    query ? { first, term: query } : { first }
  );
  if (!result.ok) return result;

  const viewer = result.data.viewer as
    | { displayName?: string; organization?: { name?: string } }
    | undefined;
  const searched = (
    result.data.searchIssues as { nodes?: LinearIssueNode[] } | undefined
  )?.nodes;
  const root = (result.data.issues as { nodes?: LinearIssueNode[] } | undefined)
    ?.nodes;
  const teams = (
    result.data.teams as {
      nodes?: Array<{
        id: string;
        name: string;
        key: string;
        issues?: { nodes?: LinearIssueNode[] };
      }>;
    }
  )?.nodes;

  const fromTeams = teams?.flatMap((team) => team.issues?.nodes ?? []) ?? [];
  const raw = searched ?? (root && root.length > 0 ? root : fromTeams);
  const seen = new Set<string>();
  const issues = raw
    .filter((node) => {
      if (!node?.id || seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    })
    .map(mapLinearIssue);

  return {
    ok: true,
    data: {
      workspace: viewer?.organization?.name ?? viewer?.displayName ?? null,
      issues,
      teams: (teams ?? []).map((team) => ({
        id: team.id,
        name: team.name,
        key: team.key
      }))
    }
  };
}

async function executeListLinearIssues(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const query = asString(args.query);
  return withLinearEvent(
    context,
    query ? 'issues.search' : 'issues.list',
    query ? `Search Linear · ${query}` : 'List Linear issues',
    () => fetchLinearIssues(args, context)
  );
}

async function executeCreateLinearIssue(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  let title = asString(args.title);
  const threadId = asString(args.threadId);
  let description = asString(args.description);

  if (threadId && (!title || !description)) {
    const thread = await prisma.mailThread.findFirst({
      where: { id: threadId, organizationId: context.organizationId },
      select: {
        subject: true,
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 1,
          select: { bodyText: true, fromAddress: true }
        }
      }
    });
    if (!thread) return { ok: false, error: 'threadId was not found.' };
    if (!title) title = thread.subject;
    if (!description) {
      const first = thread.messages[0];
      description = [first?.fromAddress, first?.bodyText]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, 8000);
    }
  }

  if (!title) return { ok: false, error: 'title is required.' };

  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

  return withLinearEvent(context, 'issues.create', title, async () => {
    let teamId = asString(args.teamId);
    if (!teamId) {
      const teams = await linearGraphql(
        token.token,
        'query { teams { nodes { id name key } } }',
        {}
      );
      if (!teams.ok) return teams;
      const nodes =
        (
          teams.data.teams as {
            nodes?: Array<{ id: string; name: string; key: string }>;
          }
        )?.nodes ?? [];
      if (nodes.length === 0) {
        return { ok: false, error: 'No Linear team is available.' };
      }
      if (nodes.length > 1) {
        return {
          ok: true,
          data: { needsTeam: true, teams: nodes }
        };
      }
      teamId = nodes[0].id;
    }

    const created = await linearGraphql(
      token.token,
      `mutation CreateIssue($teamId: String!, $title: String!, $description: String) {
        issueCreate(input: { teamId: $teamId, title: $title, description: $description }) {
          success
          issue { ${LINEAR_ISSUE_FIELDS} }
        }
      }`,
      {
        teamId,
        title,
        description: description || null
      }
    );
    if (!created.ok) return created;
    const payload = created.data.issueCreate as {
      success?: boolean;
      issue?: LinearIssueNode;
    };
    if (!payload?.success || !payload.issue) {
      return { ok: false, error: 'Linear did not create the issue.' };
    }
    const issue = mapLinearIssue(payload.issue);
    if (threadId) {
      await upsertThreadLinearLink(context.organizationId, threadId, issue);
    }
    return { ok: true, data: { ...issue, threadId: threadId || null } };
  });
}

async function executeUpdateLinearIssue(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const issueId = asString(args.issueId) || asString(args.id);
  if (!issueId) return { ok: false, error: 'issueId is required.' };

  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

  return withLinearEvent(
    context,
    'issues.update',
    `Update ${issueId}`,
    async () => {
      let stateId = asString(args.stateId);
      const stateName = asString(args.state);
      if (!stateId && stateName) {
        const states = await linearGraphql(
          token.token,
          `query IssueStates($id: String!) {
          issue(id: $id) {
            team {
              states { nodes { id name } }
            }
          }
        }`,
          { id: issueId }
        );
        if (!states.ok) return states;
        const nodes =
          (
            states.data.issue as {
              team?: {
                states?: { nodes?: Array<{ id: string; name: string }> };
              };
            }
          )?.team?.states?.nodes ?? [];
        const match = nodes.find(
          (state) => state.name.toLowerCase() === stateName.toLowerCase()
        );
        if (!match) {
          return {
            ok: false,
            error: `No Linear state named "${stateName}".`,
            data: { states: nodes }
          };
        }
        stateId = match.id;
      }

      const priorityRaw = args.priority;
      const priority =
        typeof priorityRaw === 'number'
          ? priorityRaw
          : Number.parseInt(asString(priorityRaw), 10);
      const assigneeId = asString(args.assigneeId);
      const title = asString(args.title);

      const updated = await linearGraphql(
        token.token,
        `mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue { ${LINEAR_ISSUE_FIELDS} }
        }
      }`,
        {
          id: issueId,
          input: {
            ...(stateId ? { stateId } : {}),
            ...(Number.isFinite(priority) ? { priority } : {}),
            ...(assigneeId ? { assigneeId } : {}),
            ...(title ? { title } : {})
          }
        }
      );
      if (!updated.ok) return updated;
      const payload = updated.data.issueUpdate as {
        success?: boolean;
        issue?: LinearIssueNode;
      };
      if (!payload?.success || !payload.issue) {
        return { ok: false, error: 'Linear did not update the issue.' };
      }
      return { ok: true, data: mapLinearIssue(payload.issue) };
    }
  );
}

async function executeLinkLinearIssue(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  const issueId = asString(args.issueId) || asString(args.identifier);
  if (!threadId || !issueId) {
    return { ok: false, error: 'threadId and issueId are required.' };
  }

  const thread = await prisma.mailThread.findFirst({
    where: { id: threadId, organizationId: context.organizationId },
    select: { id: true }
  });
  if (!thread) return { ok: false, error: 'threadId was not found.' };

  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

  return withLinearEvent(
    context,
    'issues.link',
    `Link ${issueId}`,
    async () => {
      const lookedUp = await linearGraphql(
        token.token,
        issueId.includes('-')
          ? `query FindIssue($term: String!) {
            searchIssues(term: $term, first: 5, includeComments: false) {
              nodes { ${LINEAR_ISSUE_FIELDS} }
            }
          }`
          : `query Issue($id: String!) { issue(id: $id) { ${LINEAR_ISSUE_FIELDS} } }`,
        issueId.includes('-') ? { term: issueId } : { id: issueId }
      );
      if (!lookedUp.ok) return lookedUp;
      const nodes =
        (
          lookedUp.data.searchIssues as
            | { nodes?: LinearIssueNode[] }
            | undefined
        )?.nodes ??
        (lookedUp.data.issue ? [lookedUp.data.issue as LinearIssueNode] : []);
      const match =
        nodes.find(
          (node) =>
            node.id === issueId ||
            node.identifier.toLowerCase() === issueId.toLowerCase()
        ) ?? nodes[0];
      if (!match) return { ok: false, error: 'Linear issue was not found.' };
      const issue = mapLinearIssue(match);
      await upsertThreadLinearLink(context.organizationId, threadId, issue);
      return { ok: true, data: { ...issue, threadId } };
    }
  );
}

async function executeListGithubIssues(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'github');
  if (!('token' in token)) return token;

  const owner = asString(args.owner);
  const repo = asString(args.repo);
  const limit = asLimit(args.limit);
  const path =
    owner && repo
      ? `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=${limit}`
      : `/issues?filter=all&state=open&per_page=${limit}`;

  const result = await githubJson(token.token, path);
  if (!result.ok) return result;
  const items = Array.isArray(result.data) ? result.data : [];
  return {
    ok: true,
    data: {
      issues: items
        .filter(
          (item) =>
            item && typeof item === 'object' && !('pull_request' in item)
        )
        .map((item) => {
          const issue = item as {
            number: number;
            title: string;
            html_url: string;
            state: string;
            repository_url?: string;
          };
          return {
            number: issue.number,
            title: issue.title,
            url: issue.html_url,
            state: issue.state,
            repo: issue.repository_url?.split('/').slice(-2).join('/')
          };
        })
    }
  };
}

async function executeListGithubPullRequests(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'github');
  if (!('token' in token)) return token;

  const owner = asString(args.owner);
  const repo = asString(args.repo);
  const limit = asLimit(args.limit);
  const path =
    owner && repo
      ? `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=${limit}`
      : `/search/issues?q=${encodeURIComponent('is:pr is:open involves:@me')}&per_page=${limit}`;

  const result = await githubJson(token.token, path);
  if (!result.ok) return result;

  const items = Array.isArray(result.data)
    ? result.data
    : Array.isArray((result.data as { items?: unknown[] })?.items)
      ? (result.data as { items: unknown[] }).items
      : [];

  return {
    ok: true,
    data: {
      pullRequests: items.map((item) => {
        const pr = item as {
          number: number;
          title: string;
          html_url: string;
          state: string;
          user?: { login?: string };
        };
        return {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: pr.state,
          author: pr.user?.login
        };
      })
    }
  };
}

async function executeCreateGithubIssue(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const title = asString(args.title);
  if (!title) return { ok: false, error: 'title is required.' };

  const token = await requireToken(context, 'github');
  if (!('token' in token)) return token;

  let owner = asString(args.owner);
  let repo = asString(args.repo);
  if (!owner || !repo) {
    const repos = await githubJson(
      token.token,
      '/user/repos?per_page=20&sort=updated&affiliation=owner,collaborator,organization_member'
    );
    if (!repos.ok) return repos;
    const nodes = Array.isArray(repos.data)
      ? (repos.data as Array<{
          full_name: string;
          owner: { login: string };
          name: string;
        }>)
      : [];
    if (nodes.length === 0) {
      return { ok: false, error: 'No GitHub repository is available.' };
    }
    if (nodes.length > 1) {
      return {
        ok: true,
        data: {
          needsRepo: true,
          repos: nodes.map((node) => ({
            owner: node.owner.login,
            repo: node.name,
            fullName: node.full_name
          }))
        }
      };
    }
    owner = nodes[0].owner.login;
    repo = nodes[0].name;
  }

  const created = await githubJson(
    token.token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
    {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: asString(args.body) || undefined
      })
    }
  );
  if (!created.ok) return created;
  const issue = created.data as {
    number: number;
    html_url: string;
    title: string;
  };
  return {
    ok: true,
    data: {
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      owner,
      repo
    }
  };
}

async function executeListStripeInvoices(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'stripe');
  if (!('token' in token)) return token;

  const email = asString(args.email);
  const customerId = asString(args.customerId);
  let customer = customerId;

  if (!customer && email) {
    const found = await stripeJson(
      token.token,
      `/customers/search?query=${encodeURIComponent(`email:'${email}'`)}&limit=5`
    );
    if (!found.ok) return found;
    const customers =
      (
        found.data as {
          data?: Array<{ id: string; email?: string; name?: string }>;
        }
      ).data ?? [];
    if (customers.length === 0) {
      return { ok: true, data: { invoices: [], customers: [] } };
    }
    if (customers.length > 1) {
      return { ok: true, data: { needsCustomer: true, customers } };
    }
    customer = customers[0].id;
  }

  const query = customer
    ? `/invoices?customer=${encodeURIComponent(customer)}&limit=${asLimit(args.limit)}`
    : `/invoices?limit=${asLimit(args.limit)}`;
  const result = await stripeJson(token.token, query);
  if (!result.ok) return result;
  const invoices =
    (result.data as { data?: Array<Record<string, unknown>> }).data ?? [];
  return {
    ok: true,
    data: {
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        customer: invoice.customer,
        hostedUrl: invoice.hosted_invoice_url
      }))
    }
  };
}

async function executeSearchStripeBilling(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'stripe');
  if (!('token' in token)) return token;

  const query = asString(args.query).replace(/['\\]/g, '');
  if (!query)
    return { ok: false, error: 'query is required (email or customer name).' };

  const isEmail = query.includes('@');
  const search = isEmail ? `email:'${query}'` : `name~'${query}'`;
  const result = await stripeJson(
    token.token,
    `/customers/search?query=${encodeURIComponent(search)}&limit=${asLimit(args.limit, 10)}`
  );
  if (!result.ok) return result;
  const customers =
    (result.data as { data?: Array<Record<string, unknown>> }).data ?? [];
  return {
    ok: true,
    data: {
      customers: customers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        delinquent: customer.delinquent
      }))
    }
  };
}

async function executeSearchNotionPages(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'notion');
  if (!('token' in token)) return token;

  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      query: asString(args.query) || undefined,
      page_size: asLimit(args.limit),
      filter: { property: 'object', value: 'page' }
    })
  });
  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      error: jsonError(response.status, text, 'Notion request failed.')
    };
  }
  const payload = JSON.parse(text) as {
    results?: Array<{
      id: string;
      url?: string;
      properties?: Record<string, { title?: Array<{ plain_text?: string }> }>;
    }>;
  };
  return {
    ok: true,
    data: {
      pages: (payload.results ?? []).map((page) => {
        const title =
          Object.values(page.properties ?? {})
            .find((prop) => Array.isArray(prop.title))
            ?.title?.map((span) => span.plain_text ?? '')
            .join('') || page.id;
        return { id: page.id, title, url: page.url };
      })
    }
  };
}

export async function loadLinearWorkspace(
  organizationId: string
): Promise<WorkspaceToolResult> {
  return fetchLinearIssues(
    {},
    { organizationId, apiKeyId: null, actorUserId: '', allowSend: false }
  );
}

export async function executeConnectorTool(
  name: string,
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  switch (name) {
    case 'list_linear_issues':
      return executeListLinearIssues(args, context);
    case 'create_linear_issue':
      return executeCreateLinearIssue(args, context);
    case 'update_linear_issue':
      return executeUpdateLinearIssue(args, context);
    case 'link_linear_issue':
      return executeLinkLinearIssue(args, context);
    case 'list_github_issues':
      return executeListGithubIssues(args, context);
    case 'list_github_pull_requests':
      return executeListGithubPullRequests(args, context);
    case 'create_github_issue':
      return executeCreateGithubIssue(args, context);
    case 'list_stripe_invoices':
      return executeListStripeInvoices(args, context);
    case 'search_stripe_billing':
      return executeSearchStripeBilling(args, context);
    case 'search_notion_pages':
      return executeSearchNotionPages(args, context);
    default:
      return { ok: false, error: 'Unknown tool.' };
  }
}
