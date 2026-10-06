import nodemailer from 'nodemailer';

export type ImapSmtpEndpoints = {
  email: string;
  password: string;
  imapHost: string;
  imapServername: string;
  imapPort: number;
  imapTls: boolean;
  imapUser?: string;
  smtpHost: string;
  smtpServername: string;
  smtpPort: number;
  smtpTls: boolean;
  smtpUser?: string;
  smtpPassword?: string;
};

export async function testImapLogin(input: ImapSmtpEndpoints): Promise<void> {
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
      minVersion: 'TLSv1.3'
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000
  });

  try {
    await client.connect();
    await client.logout();
  } catch (error) {
    try {
      await client.close();
    } catch {
      // ignore
    }
    const message =
      error instanceof Error ? error.message : 'IMAP connection failed';
    throw new Error(`IMAP: ${message}`);
  }
}

export async function testSmtpLogin(input: ImapSmtpEndpoints): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: input.smtpHost,
    port: input.smtpPort,
    secure:
      input.smtpPort === 465 ? true : input.smtpTls && input.smtpPort !== 587,
    requireTLS: input.smtpPort === 587,
    tls: {
      servername: input.smtpServername,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.3'
    },
    auth: {
      user: input.smtpUser?.trim() || input.email,
      pass: input.smtpPassword || input.password
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000
  });

  try {
    await transporter.verify();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'SMTP connection failed';
    throw new Error(`SMTP: ${message}`);
  } finally {
    transporter.close();
  }
}

export async function testImapAndSmtp(input: ImapSmtpEndpoints): Promise<void> {
  await testImapLogin(input);
  await testSmtpLogin(input);
}
