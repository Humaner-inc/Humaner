// Configuration that must hold for the server to be safe to serve traffic ischecked here
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { assertAuthSecretConfigured } = await import('@/lib/auth/auth-secret');
  assertAuthSecretConfigured();
}
