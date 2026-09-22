import type SendmailTransport from 'nodemailer/lib/sendmail-transport';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type NodeMailerTransport =
  | SendmailTransport.Options
  | SMTPTransport.Options
  | string;
