import { z } from 'zod';

/** Short-lived handshake after OTP/link verify — same shape as TOTP bridge tokens. */
export const submitEmailVerificationSchema = z.object({
  token: z.string().trim().min(1),
  expiry: z.string().trim().min(1)
});

export type SubmitEmailVerificationSchema = z.infer<
  typeof submitEmailVerificationSchema
>;
