export type MultiFactorAuthenticationDto = {
  authenticatorApp?: AuthenticatorAppDto;
};

export type AuthenticatorAppDto = {
  id: string;
  accountName: string;
  issuer: string;
  createdAt: Date;
};
