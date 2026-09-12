'use client';

import * as React from 'react';

import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import {
  VERCEL_CONNECT_APPS,
  VERCEL_CONNECT_MESSAGE
} from '@/lib/vercel-connect/catalog';

export function ConnectCallbackCloser({
  app,
  ok
}: {
  app: CompanionIntegrationId;
  ok: boolean;
}): React.JSX.Element {
  React.useEffect(() => {
    const payload = {
      type: VERCEL_CONNECT_MESSAGE,
      app,
      ok
    };
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
    window.close();
  }, [app, ok]);

  return (
    <p className="text-sm text-muted-foreground">
      {ok
        ? `${VERCEL_CONNECT_APPS[app].name} is connected. You can close this window.`
        : `Could not finish ${VERCEL_CONNECT_APPS[app].name}. Close this window and try Link again.`}
    </p>
  );
}
