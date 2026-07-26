export enum IdentityProvider {
  Credentials = 'credentials',
  TotpCode = 'totp-code',
  RecoveryCode = 'recovery-code',
  EmailVerification = 'email-verification',
  Google = 'google',
  GitHub = 'github'
}

export enum OAuthIdentityProvider {
  Google = IdentityProvider.Google,
  GitHub = IdentityProvider.GitHub
}

export const identityProviderFriendlyNames = {
  [IdentityProvider.Credentials]: 'Credentials',
  [IdentityProvider.TotpCode]: 'TOTP code',
  [IdentityProvider.RecoveryCode]: 'Recovery code',
  [IdentityProvider.EmailVerification]: 'Email verification',
  [IdentityProvider.Google]: 'Google',
  [IdentityProvider.GitHub]: 'GitHub'
} as const;
