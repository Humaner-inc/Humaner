export enum Routes {
  Root = '/',

  Auth = '/auth',
  Login = '/auth/login',
  Logout = '/auth/logout',
  SignUp = '/auth/signup',
  AuthError = '/auth/error',
  Totp = '/auth/totp',
  LinkAccount = '/auth/link-account',
  RecoveryCode = '/auth/recovery-code',
  ChangeEmail = '/auth/change-email',
  ChangeEmailRequest = '/auth/change-email/request',
  ChangeEmailInvalid = '/auth/change-email/invalid',
  ChangeEmailExpired = '/auth/change-email/expired',
  ForgotPassword = '/auth/forgot-password',
  ForgotPasswordSuccess = '/auth/forgot-password/success',
  ResetPassword = '/auth/reset-password',
  ResetPasswordRequest = '/auth/reset-password/request',
  ResetPasswordExpired = '/auth/reset-password/expired',
  ResetPasswordSuccess = '/auth/reset-password/success',
  VerifyEmail = '/auth/verify-email',
  VerifyEmailRequest = '/auth/verify-email/request',
  VerifyEmailExpired = '/auth/verify-email/expired',
  VerifyEmailSuccess = '/auth/verify-email/success',

  /** @deprecated Internal alias — use {@link Routes.Home} for navigation and meta links. */
  Dashboard = '/organization/overview',
  Home = '/organization/overview',
  /** Opens the Team notes / messages dock after navigation. */
  TeamPanel = '/organization/overview?panel=team',
  OrganizationTeam = '/organization/team',
  OrganizationWorkspace = '/organization/workspace',
  Agents = '/agents',
  AgentNew = '/agents/new',
  /** Companion persona. Stable path — not an agent id. */
  Persona = '/persona',
  Knowledge = '/knowledge',
  Integrations = '/integrations',
  Analytics = '/analytics',
  History = '/history',
  Desk = '/desk',
  DeskAgent = '/desk/agent',
  DeskHuman = '/desk/human',
  DeskRunbooks = '/desk/runbooks',
  DeskClusters = '/desk/loops',
  DeskEscalation = '/desk/escalation',
  DeskTeam = '/desk/team',
  DeskSettings = '/desk/settings',
  HumanDesk = '/human-desk',
  Inbox = '/inbox',
  /** Cloud home — mailbox snapshot. Self-Host keeps {@link Routes.Home}. */
  Overview = '/overview',
  InboxAll = '/inbox/all',
  InboxAssigned = '/inbox/assigned',
  InboxArchive = '/inbox/archive',
  InboxSent = '/inbox/sent',
  InboxSpam = '/inbox/spam',
  InboxTrash = '/inbox/trash',
  InboxAliases = '/inbox/aliases',
  InboxProviders = '/inbox/providers',
  InboxTags = '/inbox/tags',
  InboxDrafts = '/inbox/drafts',
  InboxSettings = '/inbox/settings',
  InboxSettingsConnectCallback = '/inbox/settings/connect-callback',
  InboxConnectors = '/inbox/connectors',
  Tasks = '/organization/tasks',
  Calendar = '/calendar',
  Resources = '/organization/resources',
  ResourcesInvoices = '/organization/resources/invoices',
  ResourcesQuotes = '/organization/resources/quotes',
  AdminTickets = '/admin/tickets',
  AdminDemos = '/admin/demos',
  DemoLanding = '/demo',
  Contacts = '/contacts',
  Settings = '/settings',
  Account = '/settings/account',
  Profile = '/settings/account/profile',
  Security = '/settings/account/security',
  Notifications = '/settings/account/notifications',
  Organization = '/settings/organization',
  OrganizationInformation = '/settings/organization/information',
  Members = '/settings/organization/members',
  Billing = '/settings/organization/billing',
  Developers = '/settings/organization/developers',
  AuditLogs = '/settings/organization/audit-logs',
  McpOAuthAuthorize = '/api/oauth/mcp/authorize',
  McpOAuthConsent = '/oauth/mcp/consent',

  Invitations = '/invitations',
  InvitationRequest = '/invitations/request',
  InvitationAlreadyAccepted = '/invitations/already-accepted',
  InvitationRevoked = '/invitations/revoked',
  InvitationLogOutToAccept = '/invitations/log-out-to-accept',

  Onboarding = '/onboarding',
  /** Shown immediately after Google sign-up — mailbox consent, before the wizard. */
  OnboardingConnectGmail = '/onboarding/connect-gmail',
  /**
   * Custom-tier setup guide. Shown once when onboarding completes, and reachable
   * afterwards from the agent Configuration tab.
   */
  OnboardingInitializing = '/onboarding/initializing',
  /** Authenticated account with no workspace membership. */
  NoWorkspace = '/workspace'
}

/** Public Companion persona. The agent id stays internal. */
export function agentPersonaRoute(_agentId?: string): string {
  return Routes.Persona;
}

/** @deprecated Use {@link agentPersonaRoute} */
export function agentPersonalityRoute(agentId: string): string {
  return agentPersonaRoute(agentId);
}

export function agentOverviewRoute(agentId: string): string {
  return agentPersonaRoute(agentId);
}

/**
 * Custom-tier landing: agent identity, endpoints, keys, and guardrails. Cloud
 * splits the same ground across Persona.
 */
export function agentConfigurationRoute(agentId: string): string {
  return `/agents/${agentId}/configuration`;
}

export function agentKnowledgeRoute(agentId: string): string {
  return `/agents/${agentId}/knowledge`;
}

export function agentKnowledgeFixGapRoute(
  agentId: string,
  question: string
): string {
  const params = new URLSearchParams({ fixGap: question });
  return `${agentKnowledgeRoute(agentId)}?${params.toString()}`;
}

export function agentRunbooksRoute(agentId: string): string {
  return `/agents/${agentId}/runbooks`;
}

export function agentEscalationRoute(agentId: string): string {
  return `/agents/${agentId}/escalation`;
}

export function agentAnalyticsRoute(agentId: string): string {
  return `/agents/${agentId}/analytics`;
}

export function agentHistoryRoute(agentId: string): string {
  return `/agents/${agentId}/history`;
}

export function inboxConnectorRoute(app: string): string {
  return `${Routes.InboxConnectors}/${encodeURIComponent(app)}`;
}

export function integrationChannelRoute(channelId: string): string {
  return `/integrations/${channelId}`;
}

/** Public brand-hero page with the real floating widget — not full-page chat. */
export function demoLandingRoute(publicId: string): string {
  return `${Routes.DemoLanding}/${encodeURIComponent(publicId)}`;
}
