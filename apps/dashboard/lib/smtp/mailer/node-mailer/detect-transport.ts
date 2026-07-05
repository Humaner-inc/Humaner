import type { NodeMailerTransport } from '@/lib/smtp/mailer/node-mailer/node-mailer-transport';

export function detectTransport(): NodeMailerTransport {
  if (process.env.EMAIL_SERVER) {
    return process.env.EMAIL_SERVER;
  }

  if (process.env.EMAIL_SERVER_HOST) {
    const port = parseInt(process.env.EMAIL_SERVER_PORT!);
    return {
      host: process.env.EMAIL_SERVER_HOST,
      port,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASS
      },
      secure: port === 465,
      tls: {
        ciphers: process.env.EMAIL_SERVER_CIPHERS,
        rejectUnauthorized: process.env.NODE_ENV !== 'development'
      }
    };
  }

  return {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
    secure: true
  };
}
