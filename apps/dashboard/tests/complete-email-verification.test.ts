import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeEmailVerification } from '@/lib/auth/complete-email-verification';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  findToken: vi.fn(),
  findUser: vi.fn(),
  countAuthenticatorApp: vi.fn(),
  verifyEmail: vi.fn(),
  sendWelcomeEmail: vi.fn()
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    verificationToken: { findFirst: mocks.findToken },
    user: { findFirst: mocks.findUser },
    authenticatorApp: { count: mocks.countAuthenticatorApp }
  }
}));
vi.mock('@/lib/auth/verification', () => ({ verifyEmail: mocks.verifyEmail }));
vi.mock('@/lib/smtp/send-welcome-email', () => ({
  sendWelcomeEmail: mocks.sendWelcomeEmail
}));
vi.mock('@/lib/auth/reassert-session-cookie', () => ({
  clearSessionCookies: vi.fn()
}));

describe('completeEmailVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = 'test-secret-test-secret-test-secret-1234';
    mocks.findToken.mockResolvedValue({
      identifier: 'john@doe.com',
      expires: new Date(Date.now() + 60_000)
    });
    mocks.findUser.mockResolvedValue({
      id: 'user_1',
      email: 'john@doe.com',
      name: 'John',
      emailVerified: null,
      completedOnboarding: false,
      organizationId: null,
      organization: null,
      organizationMemberships: []
    });
    mocks.countAuthenticatorApp.mockResolvedValue(0);
  });

  it('still verifies the user when the welcome email cannot be sent', async () => {
    mocks.sendWelcomeEmail.mockRejectedValue(new Error('SMTP not configured'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await completeEmailVerification({
      type: 'otp',
      otp: '123456',
      email: 'john@doe.com'
    });

    expect(mocks.verifyEmail).toHaveBeenCalledWith('john@doe.com');
    expect(result.kind).toBe('signIn');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
