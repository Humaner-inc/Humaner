import { z } from 'zod';

import { AUTH_ACCESS_CODE_LENGTH } from '@/lib/auth/access-code-constants';

export const submitAuthAccessCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(AUTH_ACCESS_CODE_LENGTH, {
      message: `Enter the ${AUTH_ACCESS_CODE_LENGTH}-character access code.`
    })
});

export type SubmitAuthAccessCodeSchema = z.infer<
  typeof submitAuthAccessCodeSchema
>;
