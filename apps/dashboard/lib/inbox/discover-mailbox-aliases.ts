import type { ImapSmtpEndpoints } from '@/lib/inbox/test-imap-smtp';

const ALIAS_HEADER_NAMES = [
  'delivered-to',
  'x-original-to',
  'x-envelope-to',
  'envelope-to',
  'x-forwarded-to'
] as const;

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const SCAN_MESSAGE_LIMIT = 100;

function parseEmailsFromText(text: string): string[] {
  return (text.match(EMAIL_PATTERN) ?? []).map((address) =>
    address.toLowerCase()
  );
}

function collectEnvelopeAddresses(
  entries: Array<{ address?: string | null } | undefined> | undefined
): string[] {
  if (!entries) return [];

  return entries
    .map((entry) => entry?.address?.trim().toLowerCase())
    .filter((address): address is string => Boolean(address));
}

function collectHeaderAddresses(
  headers: Map<string, Buffer> | Buffer | undefined
): string[] {
  if (!headers) return [];

  if (Buffer.isBuffer(headers)) {
    return parseEmailsFromText(headers.toString('utf8'));
  }

  const addresses: string[] = [];

  for (const headerName of ALIAS_HEADER_NAMES) {
    const value = headers.get(headerName);
    if (!value) continue;
    addresses.push(...parseEmailsFromText(value.toString('utf8')));
  }

  return addresses;
}

export async function discoverMailboxAliases(
  input: ImapSmtpEndpoints
): Promise<string[]> {
  const primary = input.email.trim().toLowerCase();
  const domain = primary.slice(primary.lastIndexOf('@') + 1);
  const candidates = new Set<string>([primary]);

  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({
    host: input.imapHost,
    servername: input.imapServername,
    port: input.imapPort,
    secure: input.imapTls,
    auth: {
      user: input.imapUser?.trim() || input.email,
      pass: input.password
    },
    logger: false,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const mailbox = client.mailbox;
      const messageCount = mailbox === false ? 0 : (mailbox?.exists ?? 0);
      if (messageCount > 0) {
        const start = Math.max(1, messageCount - SCAN_MESSAGE_LIMIT + 1);

        for await (const message of client.fetch(`${start}:*`, {
          envelope: true,
          headers: [...ALIAS_HEADER_NAMES]
        })) {
          const sameDomain = (address: string): boolean =>
            address.slice(address.lastIndexOf('@') + 1) === domain;

          for (const address of collectEnvelopeAddresses(
            message.envelope?.to
          )) {
            if (sameDomain(address)) candidates.add(address);
          }
          for (const address of collectEnvelopeAddresses(
            message.envelope?.cc
          )) {
            if (sameDomain(address)) candidates.add(address);
          }
          for (const address of collectHeaderAddresses(
            message.headers as Map<string, Buffer> | Buffer | undefined
          )) {
            if (sameDomain(address)) candidates.add(address);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    try {
      await client.close();
    } catch {
      // ignore
    }

    const message =
      error instanceof Error ? error.message : 'IMAP alias discovery failed';
    throw new Error(message);
  }

  return [...candidates].sort((left, right) => left.localeCompare(right));
}
