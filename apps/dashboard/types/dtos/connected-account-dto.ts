import type { BuiltInProviderType } from '@auth/core/providers';
import type { LiteralUnion } from 'next-auth/react';

export type ConnectedAccountDto = {
  id: LiteralUnion<BuiltInProviderType>;
  name: string;
  type: string;
  linked: boolean;
};
