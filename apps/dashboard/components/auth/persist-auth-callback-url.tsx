'use client';

import * as React from 'react';
import { assignTrustedNavigation } from '@humaner/shared/urls';

import { Routes } from '@/constants/routes';
import { persistAuthCallbackUrl } from '@/lib/auth/persist-auth-callback-url';
import { isProtectedAppPath } from '@/lib/routes/public-pathname';
import { isDefaultSignedInHomePath } from '@/lib/routes/signed-in-home';

/**
 * Stashes `?callbackUrl=` into the Auth.js callback cookie via a Server Action.
 * Cookie writes are illegal during RSC render in Next.js 15+.
 *
 * Also recovers from a soft-nav bug where login UI mounts while the address bar
 * still shows a protected path (e.g. /overview) — that breaks the next OAuth.
 */
export function PersistAuthCallbackUrl({
  callbackUrl
}: {
  callbackUrl: string;
}): null {
  React.useEffect(() => {
    try {
      const pathname = window.location.pathname;
      if (isProtectedAppPath(pathname) && !pathname.startsWith(Routes.Auth)) {
        assignTrustedNavigation(Routes.Login);
        return;
      }
    } catch {
      // window may be unavailable in exotic environments
    }

    if (!callbackUrl.trim()) return;
    void persistAuthCallbackUrl(callbackUrl);

    try {
      const url = new URL(window.location.href);
      const raw = url.searchParams.get('callbackUrl');
      if (!raw) return;
      let pathname = raw;
      try {
        pathname = decodeURIComponent(raw).split('?')[0] ?? raw;
      } catch {
        pathname = raw.split('?')[0] ?? raw;
      }
      if (!isDefaultSignedInHomePath(pathname)) return;
      url.searchParams.delete('callbackUrl');
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', next);
    } catch {
      // History API can throw in restricted iframes — ignore.
    }
  }, [callbackUrl]);

  return null;
}
