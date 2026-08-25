export type ApiKeyDto = {
  id: string;
  description: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
};
