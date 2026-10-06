import { z } from 'zod';

export const confirmOAuthLinkSchema = z.object({
  proof: z.string().trim().min(48).max(48),
  password: z.string().max(72).optional(),
  totpCode: z.string().trim().max(12).optional()
});

export type ConfirmOAuthLinkSchema = z.infer<typeof confirmOAuthLinkSchema>;
