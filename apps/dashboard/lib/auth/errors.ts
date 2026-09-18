export enum AuthErrorCode {
  NewEmailConflict = 'new_email_conflict',
  UnverifiedEmail = 'unverified_email',
  IncorrectEmailOrPassword = 'incorrect_email_or_password',
  TotpCodeRequired = 'totp_code_required',
  IncorrectTotpCode = 'incorrect_totp_code',
  MissingRecoveryCodes = 'missing_recovery_codes',
  IncorrectRecoveryCode = 'incorrect_recovery_code',
  RequestExpired = 'request_expired',
  RateLimitExceeded = 'rate_limit_exceeded',
  IllegalOAuthProvider = 'illegal_oauth_provider',
  InternalServerError = 'internal_server_error',
  UnknownError = 'unknown_error',
  /** Auth.js built-in — OAuth email matches an existing account. */
  OAuthAccountNotLinked = 'OAuthAccountNotLinked'
}

export const authErrorMessages: Record<AuthErrorCode, string> = {
  [AuthErrorCode.NewEmailConflict]: 'Email already exists.',
  [AuthErrorCode.UnverifiedEmail]:
    'Email is not verified. Make sure your GitHub / Google email is verified and public to the app.',
  [AuthErrorCode.IncorrectEmailOrPassword]: 'Email or password is not correct.',
  [AuthErrorCode.TotpCodeRequired]: 'TOTP code is required.',
  [AuthErrorCode.IncorrectTotpCode]: 'The TOTP code is not correct.',
  [AuthErrorCode.MissingRecoveryCodes]: 'Missing recovery codes.',
  [AuthErrorCode.IncorrectRecoveryCode]: 'The recovery code is not correct.',
  [AuthErrorCode.RequestExpired]: 'Request has expired.',
  [AuthErrorCode.RateLimitExceeded]: 'Rate limit exceeded.',
  [AuthErrorCode.IllegalOAuthProvider]: 'Illegal OAuth provider.',
  [AuthErrorCode.InternalServerError]:
    'Something went wrong. Please try again later.',
  [AuthErrorCode.UnknownError]: 'Unknown error.',
  [AuthErrorCode.OAuthAccountNotLinked]:
    'An account with this email already exists. Sign in with your original method, then connect GitHub from Settings → Security.'
};

/**
 * Auth.js v5 only ever forwards a small set of built-in codes (or a provider
 * `code`) to the error page: `Configuration`, `AccessDenied`, `Verification`,
 * plus OAuth sign-in/callback codes. Without these, every real OAuth failure
 * collapses to "Unknown error" and hides what actually broke.
 */
const authjsBuiltinErrorMessages: Record<string, string> = {
  configuration:
    'Sign-in is temporarily unavailable due to a server configuration issue. Please try again later.',
  accessdenied:
    'Access was denied. Your email may be unverified, or you cancelled the sign-in on the provider.',
  verification:
    'This sign-in link is no longer valid — it may have expired or already been used. Request a new one.',
  default: 'Something went wrong while signing you in. Please try again.',
  // OAuth-specific sign-in / callback codes (next-auth may surface any of these).
  oauthsignin: 'Could not start sign-in with your provider. Please try again.',
  oauthcallback:
    'Sign-in with your provider failed on the callback. Please try again.',
  oauthcallbackerror:
    'Sign-in with your provider failed on the callback. Please try again.',
  oauthcreateaccount:
    'We could not create your account from your provider profile. Please try again.',
  oauthaccountnotlinked: authErrorMessages[AuthErrorCode.OAuthAccountNotLinked],
  callback: 'Sign-in could not be completed. Please try again.',
  callbackrouteerror: 'Sign-in could not be completed. Please try again.',
  sessionrequired: 'Please sign in to continue.',
  credentialssignin: authErrorMessages[AuthErrorCode.IncorrectEmailOrPassword]
};

/** Resolve Auth.js / app error query values into a user-facing message. */
export function resolveAuthErrorMessage(
  error: string | null | undefined
): string {
  if (!error) {
    return authErrorMessages[AuthErrorCode.UnknownError];
  }
  if (error in authErrorMessages) {
    return authErrorMessages[error as AuthErrorCode];
  }
  const builtin = authjsBuiltinErrorMessages[error.toLowerCase()];
  if (builtin) {
    return builtin;
  }
  return authErrorMessages[AuthErrorCode.UnknownError];
}
