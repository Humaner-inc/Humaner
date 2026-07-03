'use server';

import { cookies } from 'next/headers';

import { AuthCookies } from '@/lib/auth/cookies';

export async function clearAuthCallbackUrl(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AuthCookies.CallbackUrl);
}
