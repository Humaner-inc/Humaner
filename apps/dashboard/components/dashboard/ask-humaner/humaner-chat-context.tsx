'use client';

import * as React from 'react';

import type { CompanionTaskProposal } from '@/types/companion-task-proposal';

/**
 * Self-Host (OSS) twin of the Ask Humaner chat context.
 *
 * Ask Humaner — the in-dashboard assistant — is a managed Cloud feature. The
 * Self-Host shell never renders the provider (`DashboardSessionShell` gates it
 * behind `!isOssDeployment()`), and `useHumanerChatOptional()` returns `null`
 * so the desk "ask Humaner about this ticket" affordance is simply absent. This
 * twin exposes only the surface open callers touch. josh renames it onto
 * `humaner-chat-context.tsx`.
 */

export type DashboardVisitorMetadata = {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
};

type HumanerChatContextValue = {
  openChat: () => void;
  isStreaming: boolean;
  sendMessage: (text: string, files?: File[]) => Promise<void>;
};

export function useHumanerChatOptional(): HumanerChatContextValue | null {
  return null;
}

export type HumanerChatProviderProps = {
  agentPublicId: string;
  agentAvatarUrl?: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  widgetColor?: string;
  dashboardVisitorId: string;
  visitorMetadata?: DashboardVisitorMetadata;
  suggestedTopics?: string[];
  taskProposals?: CompanionTaskProposal[];
  children: React.ReactNode;
};

export function HumanerChatProvider({
  children
}: HumanerChatProviderProps): React.JSX.Element {
  return <>{children}</>;
}
