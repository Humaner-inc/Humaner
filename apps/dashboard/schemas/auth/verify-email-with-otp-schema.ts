import { z } from 'zod';

import { EMAIL_OTP_LENGTH } from '@/constants/limits';

export const verifyEmailWithOtpSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  otp: z
    .string({
      required_error: 'OTP is required.',
      invalid_type_error: 'OTP must be a string.'
    })
    .trim()
    .regex(
      new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`),
      `OTP must be ${EMAIL_OTP_LENGTH} digits.`
    )
});

export type VerifyEmailWithOtpSchema = z.infer<typeof verifyEmailWithOtpSchema>;
