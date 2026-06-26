import { redirect } from 'next/navigation';
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE
} from 'next-safe-action';
import { z } from 'zod';

import type { DashboardPageKey } from '@/constants/dashboard-pages';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import {
  canAccessPageKey,
  getUserAccessContext
} from '@/lib/auth/require-workspace-access';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';
import {
  ForbiddenError,
  GatewayError,
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (
      e instanceof ValidationError ||
      e instanceof ForbiddenError ||
      e instanceof NotFoundError ||
      e instanceof PreConditionError ||
      e instanceof GatewayError
    ) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string()
    });
  }
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return next({ ctx: { session } });
});

export async function requireDashboardPageAccess(
  userId: string,
  pageKey: DashboardPageKey
): Promise<void> {
  const context = await getUserAccessContext(userId);
  if (!context || !canAccessPageKey(context, pageKey)) {
    throw new ForbiddenError('You do not have access to this area');
  }
}

export function pageActionClient(pageKey: DashboardPageKey) {
  return authActionClient.use(async ({ next, ctx }) => {
    await requireDashboardPageAccess(ctx.session.user.id, pageKey);
    return next({ ctx });
  });
}

export const ownerActionClient = authActionClient.use(async ({ next, ctx }) => {
  await requireWorkspaceOwner(ctx.session.user.id);
  return next({ ctx });
});
