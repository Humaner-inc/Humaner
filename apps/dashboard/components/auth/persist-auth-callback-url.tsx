'use client';

import * as React from 'react';

import { persistAuthCallbackUrl } from '@/lib/auth/persist-auth-callback-url';

/**
 * Stashes `?callbackUrl=` into the Auth.js callback cookie via a Server Action.
 * Cookie writes are illegal during RSC render in Next.js 15+.
 */
export function PersistAuthCallbackUrl({
  callbackUrl
}: {
  callbackUrl: string;
}): null {
  React.useEffect(() => {
    if (!callbackUrl.trim()) return;
    void persistAuthCallbackUrl(callbackUrl);
  }, [callbackUrl]);

  return null;
}
