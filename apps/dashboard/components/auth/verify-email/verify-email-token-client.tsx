'use client';

import * as React from 'react';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import { toast } from 'sonner';

import { verifyEmailWithToken } from '@/actions/auth/verify-email-with-token';
import {
  authHeadingClassName,
  authMutedTextClassName
} from '@/components/auth/auth-form-styles';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

export type VerifyEmailTokenClientProps = {
  token: string;
};

export function VerifyEmailTokenClient({
  token
}: VerifyEmailTokenClientProps): React.JSX.Element {
  const [status, setStatus] = React.useState<'working' | 'error'>('working');
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void (async () => {
      try {
        const result = await verifyEmailWithToken({ token });
        if (result?.data?.redirectTo) {
          assignTrustedNavigation(result.data.redirectTo);
          return;
        }
        setStatus('error');
        toast.error("Couldn't verify email");
      } catch {
        setStatus('error');
        toast.error("Couldn't verify email");
      }
    })();
  }, [token]);

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5 text-center">
        <h1 className={cn(authHeadingClassName, 'text-xl')}>
          {status === 'working'
            ? 'Verifying your email'
            : 'Verification failed'}
        </h1>
        <p className={authMutedTextClassName}>
          {status === 'working' ? (
            "One moment — we're signing you in…"
          ) : (
            <>
              This link may be invalid or expired.{' '}
              <a
                href={Routes.VerifyEmail}
                className="underline underline-offset-4"
              >
                Request a new code
              </a>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}
