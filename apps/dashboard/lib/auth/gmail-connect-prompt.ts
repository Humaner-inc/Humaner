import 'server-only';

import { cookies } from 'next/headers';

import { AuthCookies } from '@/lib/auth/cookies';

const COOKIE_MAX_AGE_SECONDS = 60 * 30;

function cookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  domain?: string;
} {
  return {
    httpOnly: true,
    secure: AuthCookies.isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    ...(AuthCookies.domain ? { domain: AuthCookies.domain } : {})
  };
}

export async function markGmailConnectPrompt(): Promise<void> {
  const cookieStore = await cookies();
  if (cookieStore.get(AuthCookies.SignUpIntent)?.value === 'team_member') {
    return;
  }
  cookieStore.set({
    name: AuthCookies.GmailConnectPrompt,
    value: '1',
    ...cookieOptions()
  });
}

export async function clearGmailConnectPrompt(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AuthCookies.GmailConnectPrompt);
}

export async function dismissGmailConnectPrompt(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AuthCookies.GmailConnectPrompt);
  cookieStore.set({
    name: AuthCookies.GmailConnectDismissed,
    value: '1',
    ...cookieOptions()
  });
}

export async function hasGmailConnectPrompt(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(AuthCookies.GmailConnectPrompt)?.value === '1';
}

export async function hasDismissedGmailConnectPrompt(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(AuthCookies.GmailConnectDismissed)?.value === '1';
}
