import { isOssDeployment } from '@/lib/deployment-mode';

/** Connector / team MCP tools that stay on Cloud. */
const CLOUD_ONLY_WORKSPACE_TOOLS = new Set<string>([
  'list_connectors',
  'list_linear_issues',
  'create_linear_issue',
  'update_linear_issue',
  'link_linear_issue',
  'list_github_issues',
  'list_github_pull_requests',
  'create_github_issue',
  'list_stripe_invoices',
  'search_stripe_billing',
  'search_notion_pages',
  'request_teammate'
]);

export function workspaceToolAllowedOnDeployment(name: string): boolean {
  if (!isOssDeployment()) {
    return true;
  }
  return !CLOUD_ONLY_WORKSPACE_TOOLS.has(name);
}
