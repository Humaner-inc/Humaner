import { z } from 'zod';

import { OAuthIdentityProvider } from '@/types/identity-provider';

export const connectAccountSchema = z.object({
  provider: z.nativeEnum(OAuthIdentityProvider, {
    required_error: 'Provider is required',
    invalid_type_error: 'Provider must be a string'
  })
});

export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
