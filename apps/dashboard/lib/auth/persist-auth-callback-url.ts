'use server';

import { cookies } from 'next/headers';

import { toSafeRelativeCallbackPath } from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';

/**
 * Persist a post-login destination from `?callbackUrl=` onto the Auth.js
 * callback cookie so MFA (TOTP / recovery) and OAuth still honor it.
 *
 * Must run as a Server Action (or Route Handler) — not during RSC render.
 */
export async function persistAuthCallbackUrl(
  callbackUrl: string | undefined | null
): Promise<void> {
  const relative = toSafeRelativeCallbackPath(callbackUrl);
  if (!relative) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AuthCookies.CallbackUrl,
    value: relative,
    ...AuthCookies.sessionCookieOptions()
  });
}
