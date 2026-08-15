/**
 * Configuration that must hold for the server to be safe to serve traffic is
 * checked here, so a misconfigured deployment fails at boot instead of at the
 * first user request.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { assertAuthSecretConfigured } = await import('@/lib/auth/auth-secret');
  assertAuthSecretConfigured();
}
