import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookup = vi.hoisted(() => vi.fn());

vi.mock('node:dns/promises', () => ({ lookup }));

const { validateMailEndpoints } = await import(
  '@/lib/inbox/validate-mail-endpoint'
);

// Documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) count as
// reserved here, so the public fixture is a routable address.
const PUBLIC_HOST = { address: '93.184.216.34', family: 4 };

function resolveTo(address: string): void {
  lookup.mockResolvedValue([
    { address, family: address.includes(':') ? 6 : 4 }
  ]);
}

describe('validateMailEndpoints', () => {
  beforeEach(() => {
    lookup.mockReset();
    lookup.mockResolvedValue([PUBLIC_HOST]);
  });

  it('accepts a public host on the TLS ports', async () => {
    lookup.mockResolvedValue([PUBLIC_HOST]);

    await expect(
      validateMailEndpoints({
        imapHost: 'imap.zoho.eu',
        imapPort: 993,
        smtpHost: 'smtp.zoho.eu',
        smtpPort: 465
      })
    ).resolves.toEqual({
      imap: { hostname: 'imap.zoho.eu', address: PUBLIC_HOST.address },
      smtp: { hostname: 'smtp.zoho.eu', address: PUBLIC_HOST.address }
    });
  });

  it('only allows IMAP over 993 and SMTP over 465 or 587', async () => {
    await expect(
      validateMailEndpoints({
        imapHost: 'imap.fastmail.com',
        imapPort: 143,
        smtpHost: 'smtp.fastmail.com',
        smtpPort: 587
      })
    ).rejects.toThrow('IMAP port must be 993 with TLS.');

    await expect(
      validateMailEndpoints({
        imapHost: 'imap.fastmail.com',
        imapPort: 993,
        smtpHost: 'smtp.fastmail.com',
        smtpPort: 25
      })
    ).rejects.toThrow('SMTP port must be 465 or 587.');

    expect(lookup).not.toHaveBeenCalled();
  });

  it.each([
    'imap.gmail.com',
    'googlemail.com',
    'outlook.office365.com',
    'smtp.outlook.com'
  ])('sends %s to the OAuth flow instead of IMAP', async (host) => {
    await expect(
      validateMailEndpoints({
        imapHost: host,
        imapPort: 993,
        smtpHost: 'smtp.example.com',
        smtpPort: 587
      })
    ).rejects.toThrow(
      'Use the provider OAuth connection for Google or Microsoft mail.'
    );
  });

  it.each(['localhost', 'mail.localhost', 'mail:993', 'user@mail.test', ''])(
    'rejects %s as a hostname',
    async (host) => {
      await expect(
        validateMailEndpoints({
          imapHost: host,
          imapPort: 993,
          smtpHost: 'smtp.example.com',
          smtpPort: 587
        })
      ).rejects.toThrow('Enter a valid public mail server hostname.');
    }
  );

  it('rejects an IP literal so the host must be a name', async () => {
    await expect(
      validateMailEndpoints({
        imapHost: '93.184.216.34',
        imapPort: 993,
        smtpHost: 'smtp.example.com',
        smtpPort: 587
      })
    ).rejects.toThrow(
      'Use a public mail server hostname instead of an IP address.'
    );
  });

  it.each(['127.0.0.1', '10.1.2.3', '169.254.169.254', '::1', 'fd00::1'])(
    'refuses a host that resolves to %s',
    async (address) => {
      resolveTo(address);

      await expect(
        validateMailEndpoints({
          imapHost: 'imap.internal-probe.test',
          imapPort: 993,
          smtpHost: 'smtp.internal-probe.test',
          smtpPort: 587
        })
      ).rejects.toThrow(
        'Mail servers must resolve only to public internet addresses.'
      );
    }
  );

  it('refuses a host that does not resolve at all', async () => {
    lookup.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(
      validateMailEndpoints({
        imapHost: 'imap.example.invalid',
        imapPort: 993,
        smtpHost: 'smtp.example.invalid',
        smtpPort: 587
      })
    ).rejects.toThrow('Could not resolve the mail server hostname.');
  });
});
