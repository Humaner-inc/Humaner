'use client';

import * as React from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { approveMcpOAuth } from '@/actions/developers/approve-mcp-oauth';
import {
  authHighlightButtonClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName
} from '@/components/auth/auth-form-styles';
import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  API_KEY_SCOPE_OPTIONS,
  type ApiKeyScope
} from '@/lib/auth/api-key-scopes';
import { cn } from '@/lib/utils';

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
  const [scopes, setScopes] = React.useState<ApiKeyScope[]>(defaultScopes);
  const { execute, isExecuting } = useAction(approveMcpOAuth, {
    onSuccess: ({ data }) => {
      if (data?.redirectTo) {
        window.location.assign(data.redirectTo);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Could not connect this client.');
    }
  });

  const denyHref = (() => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', 'access_denied');
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  })();

  return (
    <AuthOnboardingCardShell maxWidth="sm">
      <h1 className={authPageTitleClassName}>Connect {clientName}</h1>
      <p className={cn(authMutedTextClassName, 'mt-2')}>
        {clientName} wants mailbox tools on {workspaceName}. Sign in once — the
        agent will not ask again.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (scopes.length === 0) {
            toast.error('Pick at least one scope.');
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
        <div className="space-y-2.5">
          {API_KEY_SCOPE_OPTIONS.map((option) => {
            const checked = scopes.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-2.5"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    setScopes((current) => {
                      if (value === true) {
                        return current.includes(option.id)
                          ? current
                          : [...current, option.id];
                      }
                      return current.filter((scope) => scope !== option.id);
                    });
                  }}
                />
                <span>
                  <Label className="text-sm font-medium text-white">
                    {option.label}
                  </Label>
                  <p className={cn(authMutedTextClassName, 'mt-0.5 text-xs')}>
                    {option.description}
                  </p>
                </span>
              </label>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            disabled={isExecuting}
            className={authHighlightButtonClassName}
          >
            {isExecuting ? 'Connecting…' : 'Allow'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={authOutlineButtonClassName}
            asChild
          >
            <a href={denyHref}>Deny</a>
          </Button>
        </div>
      </form>
    </AuthOnboardingCardShell>
  );
}
