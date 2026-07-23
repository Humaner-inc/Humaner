import {
  getMailProviderById,
  resolveMailProviderPreset
} from '@/lib/inbox/mail-providers';
import type { ImapSmtpEndpoints } from '@/lib/inbox/test-imap-smtp';
import { validateMailEndpoints } from '@/lib/inbox/validate-mail-endpoint';
import { ValidationError } from '@/lib/validation/exceptions';
import type { DiscoverImapAliasesInput } from '@/schemas/inbox/connect-imap-schema';

export type MailConnectCredentialsInput = DiscoverImapAliasesInput;

export function normalizeMailboxAddress(email: string): string {
  return email.trim().toLowerCase();
}

export async function buildValidatedMailEndpoints(
  input: MailConnectCredentialsInput
): Promise<{ primary: string; endpoints: ImapSmtpEndpoints }> {
  const provider = getMailProviderById(input.providerId);
  if (!provider?.imapAvailable) {
    throw new ValidationError('This provider is not available for IMAP yet.');
  }

  const primary = normalizeMailboxAddress(input.email);
  const preset = resolveMailProviderPreset(input.providerId);
  const imapHost = input.imapHost?.trim() || preset?.imapHost;
  const imapPort = input.imapPort ?? preset?.imapPort;
  const smtpHost = input.smtpHost?.trim() || preset?.smtpHost;
  const smtpPort = input.smtpPort ?? preset?.smtpPort;

  if (!imapHost || !imapPort || !smtpHost || !smtpPort) {
    throw new ValidationError(
      'Enter IMAP and SMTP hosts for this provider in Advanced.'
    );
  }

  const validatedHosts = await validateMailEndpoints({
    imapHost,
    imapPort,
    smtpHost,
    smtpPort
  });

  return {
    primary,
    endpoints: {
      email: primary,
      password: input.password,
      imapHost: validatedHosts.imap.address,
      imapServername: validatedHosts.imap.hostname,
      imapPort,
      imapTls: true,
      smtpHost: validatedHosts.smtp.address,
      smtpServername: validatedHosts.smtp.hostname,
      smtpPort,
      smtpTls: true,
      smtpUser: input.smtpUser,
      smtpPassword: input.smtpPassword
    }
  };
}
