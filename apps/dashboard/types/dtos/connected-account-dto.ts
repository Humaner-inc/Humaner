import type { ProviderId } from '@auth/core/providers';

export type ConnectedAccountDto = {
  id: ProviderId;
  name: string;
  type: string;
  linked: boolean;
};
