import 'server-only';

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

async function linearGraphql(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
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

async function executeListLinearIssues(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

  const query = asString(args.query);
  const result = await linearGraphql(
    token.token,
    query
      ? `query ListIssues($first: Int!, $term: String!) {
      issues(first: $first, filter: { search: $term }) {
        nodes { id identifier title url state { name } team { name key } }
      }
      teams { nodes { id name key } }
    }`
      : `query ListIssues($first: Int!) {
      issues(first: $first) {
        nodes { id identifier title url state { name } team { name key } }
      }
      teams { nodes { id name key } }
    }`,
    query
      ? { first: asLimit(args.limit), term: query }
      : { first: asLimit(args.limit) }
  );
  if (!result.ok) return result;

  const issues = result.data.issues as { nodes?: unknown[] } | undefined;
  const teams = result.data.teams as { nodes?: unknown[] } | undefined;
  return {
    ok: true,
    data: { issues: issues?.nodes ?? [], teams: teams?.nodes ?? [] }
  };
}

async function executeCreateLinearIssue(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const title = asString(args.title);
  if (!title) return { ok: false, error: 'title is required.' };

  const token = await requireToken(context, 'linear');
  if (!('token' in token)) return token;

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
        issue { id identifier title url }
      }
    }`,
    {
      teamId,
      title,
      description: asString(args.description) || null
    }
  );
  if (!created.ok) return created;
  const payload = created.data.issueCreate as {
    success?: boolean;
    issue?: unknown;
  };
  if (!payload?.success || !payload.issue) {
    return { ok: false, error: 'Linear did not create the issue.' };
  }
  return { ok: true, data: payload.issue };
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
