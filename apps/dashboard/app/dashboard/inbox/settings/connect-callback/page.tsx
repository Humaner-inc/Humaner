import * as React from 'react';
import { redirect } from 'next/navigation';

import { ConnectCallbackCloser } from '@/components/dashboard/inbox/connect-callback-closer';
import { Routes } from '@/constants/routes';
import {
  readCompanionWorkspaceRights,
  writeCompanionIntegrations
} from '@/data/inbox/companion-rights';
import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';
import { isCompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { VERCEL_CONNECT_APPS } from '@/lib/vercel-connect/catalog';
import {
  completeConnectAuthorization,
  connectErrorMessage
} from '@/lib/vercel-connect/client';

export default async function InboxConnectCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ app?: string }>;
}): Promise<React.JSX.Element> {
  const { app } = await searchParams;
  if (!isCompanionIntegrationId(app)) {
    redirect(`${Routes.OrganizationWorkspace}?tab=connect`);
  }

  const session = await dedupedAuth();
  const organizationId = session?.user.organizationId;
  let ok = false;
  let error: string | undefined;

  if (checkSession(session) && organizationId) {
    try {
      await requireWorkspaceOwner(session.user.id, organizationId);
      await completeConnectAuthorization(organizationId, app);
      const { integrations } =
        await readCompanionWorkspaceRights(organizationId);
      if (!integrations.includes(app)) {
        await writeCompanionIntegrations(organizationId, [
          ...integrations,
          app
        ]);
      }
      ok = true;
    } catch (caught) {
      ok = false;
      error = connectErrorMessage(caught, VERCEL_CONNECT_APPS[app].name);
    }
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <ConnectCallbackCloser
        app={app}
        ok={ok}
        error={error}
      />
    </div>
  );
}
