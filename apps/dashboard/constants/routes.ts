export enum Routes {
  Root = '/',

  Auth = '/auth',
  Login = '/auth/login',
  Logout = '/auth/logout',
  SignUp = '/auth/signup',
  AuthError = '/auth/error',
  Totp = '/auth/totp',
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
  OrganizationTeam = '/organization/team',
  /** @deprecated Redirects to {@link Routes.OrganizationInformation}. */
  OrganizationWorkspace = '/organization/workspace',
  Agents = '/agents',
  AgentNew = '/agents/new',
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
  InboxAll = '/inbox/all',
  InboxAssigned = '/inbox/assigned',
  InboxArchive = '/inbox/archive',
  InboxAliases = '/inbox/aliases',
  InboxProviders = '/inbox/providers',
  InboxTags = '/inbox/tags',
  Training = '/training',
  AdminTickets = '/admin/tickets',
  AdminDemos = '/admin/demos',
  DemoLanding = '/demo',
  Contacts = '/organization/overview',
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

  Invitations = '/invitations',
  InvitationRequest = '/invitations/request',
  InvitationAlreadyAccepted = '/invitations/already-accepted',
  InvitationRevoked = '/invitations/revoked',
  InvitationLogOutToAccept = '/invitations/log-out-to-accept',

  Onboarding = '/onboarding',
  /** Authenticated account with no workspace membership. */
  NoWorkspace = '/workspace'
}

export function agentPersonaRoute(agentId: string): string {
  return `/agents/${agentId}/persona`;
}

/** @deprecated Use {@link agentPersonaRoute} */
export function agentPersonalityRoute(agentId: string): string {
  return agentPersonaRoute(agentId);
}

export function agentOverviewRoute(agentId: string): string {
  return agentPersonaRoute(agentId);
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

export function integrationChannelRoute(channelId: string): string {
  return `/integrations/${channelId}`;
}

/** Public brand-hero page with the real floating widget — not full-page chat. */
export function demoLandingRoute(publicId: string): string {
  return `${Routes.DemoLanding}/${encodeURIComponent(publicId)}`;
}
