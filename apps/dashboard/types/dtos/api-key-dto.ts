export type ApiKeyDto = {
  id: string;
  description: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
};
