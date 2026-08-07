import 'server-only';

import { signIn } from '@/lib/auth';
import { toClientAuthRedirect } from '@/lib/auth/callback-url';
import type { EmailVerificationSignInHandshake } from '@/lib/auth/complete-email-verification';
import { forceSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
import { IdentityProvider } from '@/types/identity-provider';

/** Establish an Auth.js session the same way as password / TOTP login. */
export async function signInAfterEmailVerification(
  handshake: EmailVerificationSignInHandshake
): Promise<string> {
  const result = await signIn(IdentityProvider.EmailVerification, {
    token: handshake.token,
    expiry: handshake.expiry,
    redirectTo: handshake.redirectTo,
    redirect: false
  });

  await forceSessionCookieForUser(handshake.userId);

  return toClientAuthRedirect(result, handshake.redirectTo);
}
