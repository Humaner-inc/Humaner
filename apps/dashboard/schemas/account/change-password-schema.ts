import { z } from 'zod';

import { passwordValidator } from '@/lib/auth/password';

export const changePasswordSchema = z
  .object({
    hasPasswordSet: z.boolean(),
    currentPassword: z
      .string({
        required_error: 'Password is required.',
        invalid_type_error: 'Password must be a string.'
      })
      .min(1, 'Password is required.')
      .max(72, 'Maximum 72 characters allowed.')
      .optional()
      .or(z.literal('')),
    newPassword: z
      .string({
        required_error: 'New password is required.',
        invalid_type_error: 'New password must be a string.'
      })
      .min(1, 'New password is required.')
      .max(72, 'Maximum 72 characters allowed.')
      .refine((arg) => passwordValidator.validate(arg).success, {
        message: 'Password does not meet requirements.'
      }),
    verifyPassword: z
      .string({
        required_error: 'Verify password is required.',
        invalid_type_error: 'Verify password must be a string.'
      })
      .min(1, 'Verify password is required.')
      .max(72, 'Maximum 72 characters allowed.')
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.verifyPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match.",
        path: ['confirmNewPassword']
      });
    }
    if (data.hasPasswordSet && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current password is required.',
        path: ['currentPassword']
      });
    }
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type ChangePasswordField = keyof ChangePasswordSchema;
