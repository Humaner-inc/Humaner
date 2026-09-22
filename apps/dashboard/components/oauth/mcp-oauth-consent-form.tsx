'use client';

import * as React from 'react';
import { CompanionMark } from '@humaner/shared/companion-icon';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { approveMcpOAuth } from '@/actions/developers/approve-mcp-oauth';
import { CheckMark } from '@/components/ui/check-icon';
import { type ApiKeyScope } from '@/lib/auth/api-key-scopes';
import { cn } from '@/lib/utils';

const CONSENT_SCOPES: {
  id: ApiKeyScope;
  label: string;
  hint: string;
}[] = [
  {
    id: 'mailbox',
    label: 'Mailbox',
    hint: 'Read, draft, and send mail'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    hint: 'List and create events'
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    hint: 'Hybrid RAG retrieval only'
  }
];

const PILL =
  'inline-flex h-10 flex-1 items-center justify-center rounded-full border-2 font-sans text-sm font-medium transition-colors duration-200 disabled:opacity-50';

export function McpOAuthConsentForm({
  clientName,
  workspaceName,
  clientId,
  redirectUri,
  codeChallenge,
  state,
  defaultScopes
}: {
  clientName: string;
  workspaceName: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  defaultScopes: ApiKeyScope[];
}): React.JSX.Element {
  const [scopes, setScopes] = React.useState<ApiKeyScope[]>(() =>
    defaultScopes.length > 0 ? defaultScopes : ['mailbox']
  );
  const { execute, isExecuting } = useAction(approveMcpOAuth, {
    onSuccess: ({ data }) => {
      if (data?.redirectTo) {
        assignTrustedNavigation(data.redirectTo);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not connect this client.');
    }
  });

  const declineHref = (() => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', 'access_denied');
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  })();

  function toggleScope(id: ApiKeyScope): void {
    setScopes((current) =>
      current.includes(id)
        ? current.filter((scope) => scope !== id)
        : [...current, id]
    );
  }

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
      <CompanionMark
        size={40}
        className="text-[#F2F2F2]"
      />
      <h1 className="mt-6 font-sans text-[15px] font-medium tracking-tight text-[#F2F2F2]">
        Connect {clientName}
      </h1>
      <p className="mt-2 font-sans text-xs text-white/40">on {workspaceName}</p>
      <form
        className="mt-6 w-full"
        onSubmit={(event) => {
          event.preventDefault();
          if (scopes.length === 0) {
            return;
          }
          execute({
            clientId,
            redirectUri,
            codeChallenge,
            state: state || undefined,
            scopes
          });
        }}
      >
        <ul className="w-full divide-y divide-white/10 text-left">
          {CONSENT_SCOPES.map((option) => {
            const checked = scopes.includes(option.id);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleScope(option.id)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                      checked
                        ? 'border-[#F2F2F2] bg-[#F2F2F2] text-[#0a0d0d]'
                        : 'border-white/25 bg-transparent text-transparent'
                    )}
                  >
                    <CheckMark size={11} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-sans text-sm font-medium text-[#F2F2F2]">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block font-sans text-xs text-white/40">
                      {option.hint}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex w-full gap-2">
          <a
            href={declineHref}
            className={cn(
              PILL,
              'border-[#18181b] bg-[#18181b] text-[#F2F2F2] hover:border-[#dc2626] hover:bg-[#dc2626] hover:text-white'
            )}
          >
            Decline
          </a>
          <button
            type="submit"
            disabled={isExecuting || scopes.length === 0}
            className={cn(
              PILL,
              'border-white bg-white text-[#0a0d0d] hover:border-[#16a34a] hover:bg-[#16a34a] hover:text-white'
            )}
          >
            {isExecuting ? 'Connecting…' : 'Allow'}
          </button>
        </div>
      </form>
    </div>
  );
}
