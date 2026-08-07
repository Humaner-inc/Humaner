'use server';

import { cookies } from 'next/headers';

import { AuthCookies } from '@/lib/auth/cookies';

export async function clearAuthCallbackUrl(): Promise<void> {
  const cookieStore = await cookies();
  // Must match domain used when Auth.js / we set the cookie, or the stale
  // value keeps winning after logout / MFA.
  cookieStore.set({
    name: AuthCookies.CallbackUrl,
    value: '',
    ...AuthCookies.sessionCookieOptions(new Date(0))
  });
  cookieStore.delete(AuthCookies.CallbackUrl);
}
