/**
 * Prints the email verification OTP to the server console for local /
 * self-host smoke tests when SMTP is not wired yet.
 *
 * Enabled when NODE_ENV=development or SELF_HOST_LOG_VERIFICATION=true.
 * Never enable in a public production deploy that serves real users.
 */
export function logVerificationCodeForLocalDev(input: {
  email: string;
  otp: string;
  verificationLink: string;
}): void {
  const envEnabled = process.env.SELF_HOST_LOG_VERIFICATION === 'true';
  const enabled = process.env.NODE_ENV === 'development' || envEnabled;

  if (!enabled) {
    return;
  }

  if (envEnabled && process.env.NODE_ENV === 'production') {
    console.warn(
      '[auth] SELF_HOST_LOG_VERIFICATION=true in production — OTPs are logged to stdout. Disable for real-user deploys.'
    );
  }

  console.info(
    `[auth] Email verification for ${input.email}\n` +
      `       OTP:  ${input.otp}\n` +
      `       Link: ${input.verificationLink}`
  );
}
