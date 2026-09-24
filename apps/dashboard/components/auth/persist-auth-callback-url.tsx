'use client';

import * as React from 'react';

import { persistAuthCallbackUrl } from '@/lib/auth/persist-auth-callback-url';

/**
 * Stashes `?callbackUrl=` into the Auth.js callback cookie via a Server Action.
 * Cookie writes are illegal during RSC render in Next.js 15+.
 */
const DEFAULT_HOME_CALLBACKS = new Set([
  '/overview',
  '/inbox',
  '/inbox/all',
  '/organization',
  '/organization/overview'
]);

export function PersistAuthCallbackUrl({
  callbackUrl
}: {
  callbackUrl: string;
}): null {
  React.useEffect(() => {
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
      if (!DEFAULT_HOME_CALLBACKS.has(pathname)) return;
      url.searchParams.delete('callbackUrl');
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', next);
    } catch {
      // History API can throw in restricted iframes — ignore.
    }
  }, [callbackUrl]);

  return null;
}
