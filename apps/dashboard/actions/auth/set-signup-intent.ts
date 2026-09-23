'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { actionClient } from '@/actions/safe-action';
import { AuthCookies } from '@/lib/auth/cookies';
import {
  signUpIntentSchema,
  type SignUpIntent
} from '@/schemas/auth/sign-up-schema';

const setSignupIntentSchema = z.object({
  intent: signUpIntentSchema,
  invitationId: z.union([z.string().uuid(), z.literal('')]).optional()
});

export const setSignupIntent = actionClient
  .metadata({ actionName: 'setSignupIntent' })
  .schema(setSignupIntentSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const options = {
      httpOnly: true,
      secure: AuthCookies.isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 30,
      ...(AuthCookies.domain ? { domain: AuthCookies.domain } : {})
    };

    const invitationId = parsedInput.invitationId?.trim();

    // Business owner is chosen on the onboarding account step, after OAuth.
    // A cookie here used to create the workspace before that screen.
    if (parsedInput.intent === 'business_owner' && !invitationId) {
      cookieStore.delete(AuthCookies.SignUpIntent);
      cookieStore.delete(AuthCookies.SignUpInvitationId);
      return { ok: true as const };
    }

    cookieStore.set({
      name: AuthCookies.SignUpIntent,
      value: parsedInput.intent satisfies SignUpIntent,
      ...options
    });

    if (invitationId) {
      cookieStore.set({
        name: AuthCookies.SignUpInvitationId,
        value: invitationId,
        ...options
      });
    } else {
      cookieStore.delete(AuthCookies.SignUpInvitationId);
    }

    return { ok: true as const };
  });
