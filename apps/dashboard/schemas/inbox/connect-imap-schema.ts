import { z } from 'zod';

import { getMailProviderById } from '@/lib/inbox/mail-providers';

const emailSchema = z.string().trim().email('Enter a valid email').max(255);

export const mailConnectCredentialsSchema = z.object({
  providerId: z.string().trim().min(1, 'Select a mail provider'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(512),
  smtpSameAsImap: z.boolean().default(true),
  showAdvanced: z.boolean().default(false),
  imapHost: z.string().trim().max(255).optional(),
  imapPort: z.coerce.number().int().min(1).max(65535).optional(),
  imapTls: z.boolean().default(true),
  smtpHost: z.string().trim().max(255).optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpTls: z.boolean().default(true),
  smtpUser: z.string().trim().max(255).optional(),
  smtpPassword: z.string().max(512).optional()
});

function refineMailConnectInput(
  value: z.infer<typeof mailConnectCredentialsSchema>,
  ctx: z.RefinementCtx
): void {
  const provider = getMailProviderById(value.providerId);
  const needsHosts = Boolean(
    provider?.requiresCustomHosts || value.showAdvanced
  );

  if (needsHosts) {
    if (!value.imapHost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IMAP host is required',
        path: ['imapHost']
      });
    }
    if (!value.imapPort) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IMAP port is required',
        path: ['imapPort']
      });
    }
    if (!value.smtpHost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SMTP host is required',
        path: ['smtpHost']
      });
    }
    if (!value.smtpPort) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SMTP port is required',
        path: ['smtpPort']
      });
    }
  }

  if (!value.smtpSameAsImap) {
    if (!value.smtpUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SMTP username is required',
        path: ['smtpUser']
      });
    }
    if (!value.smtpPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SMTP password is required',
        path: ['smtpPassword']
      });
    }
  }
}

export const discoverImapAliasesSchema =
  mailConnectCredentialsSchema.superRefine(refineMailConnectInput);

export const connectImapSchema = mailConnectCredentialsSchema
  .extend({
    aliases: z.array(emailSchema).max(20).default([])
  })
  .superRefine(refineMailConnectInput);

export type ConnectImapInput = z.infer<typeof connectImapSchema>;
export type DiscoverImapAliasesInput = z.infer<
  typeof discoverImapAliasesSchema
>;
