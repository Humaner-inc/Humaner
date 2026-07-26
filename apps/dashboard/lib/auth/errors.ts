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
  return authErrorMessages[AuthErrorCode.UnknownError];
}
