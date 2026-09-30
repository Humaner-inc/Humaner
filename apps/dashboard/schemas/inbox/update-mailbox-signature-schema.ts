import { z } from 'zod';

import { FileUploadAction } from '@/types/file-upload-action';

export const SIGNATURE_ICON_HEIGHT_MIN = 24;
export const SIGNATURE_ICON_HEIGHT_MAX = 96;
export const SIGNATURE_ICON_HEIGHT_DEFAULT = 48;

export const updateMailboxSignatureSchema = z.object({
  connectionId: z.string().uuid(),
  signatureText: z
    .string()
    .max(4000, 'Signature must be 4000 characters or fewer.')
    .optional(),
  signatureIconHeight: z
    .number()
    .int()
    .min(SIGNATURE_ICON_HEIGHT_MIN)
    .max(SIGNATURE_ICON_HEIGHT_MAX)
    .optional(),
  iconAction: z.nativeEnum(FileUploadAction).default(FileUploadAction.None),
  icon: z.string().optional().or(z.literal(''))
});

export type UpdateMailboxSignatureSchema = z.infer<
  typeof updateMailboxSignatureSchema
>;
