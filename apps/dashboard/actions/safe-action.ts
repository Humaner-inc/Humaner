import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE
} from 'next-safe-action';
import { z } from 'zod';

import type { DashboardPageKey } from '@/constants/dashboard-pages';
import { dedupedAuth } from '@/lib/auth';
import {
  canAccessPageKey,
  getUserAccessContext
} from '@/lib/auth/require-workspace-access';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';
import {
  ForbiddenError,
  GatewayError,
  NotFoundError,
  PreConditionError,
  RateLimitExceededError,
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

    if (
      e instanceof RateLimitExceededError ||
      e?.name === 'RateLimitExceededError'
    ) {
      return 'Too many attempts. Wait a few minutes and try again.';
    }

    // Prisma interactive transactions can dilute `instanceof` across bundles.
    if (
      e instanceof Error &&
      (e.name === 'ValidationError' ||
        e.name === 'PreConditionError' ||
        e.name === 'ForbiddenError' ||
        e.name === 'NotFoundError')
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

/** Signed in; workspace optional (create workspace, delete account, etc.). */
export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const session = await dedupedAuth();
  if (!checkAuthenticatedSession(session)) {
    throw new ForbiddenError('Please sign in again to continue');
  }

  return next({ ctx: { session } });
});

/** Signed in with an active workspace. */
export const authActionClient = authenticatedActionClient.use(
  async ({ next, ctx }) => {
    if (!checkSession(ctx.session)) {
      // Do not redirect() from a Safe Action — it returns a non-RSC response and
      // the client throws "An unexpected response was received from the server."
      throw new ForbiddenError('Select or create a workspace to continue');
    }

    return next({ ctx: { session: ctx.session } });
  }
);

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
  await requireWorkspaceOwner(
    ctx.session.user.id,
    ctx.session.user.organizationId
  );
  return next({ ctx });
});
