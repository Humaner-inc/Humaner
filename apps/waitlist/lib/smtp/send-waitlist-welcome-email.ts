import { render } from '@react-email/render';
import { Resend } from 'resend';

import { AppInfo } from '@/constants/app-info';
import {
  WaitlistWelcomeEmail,
  type WaitlistWelcomeEmailData
} from '@/emails/waitlist-welcome-email';

function getResendApiKey(): string | undefined {
  return process.env.EMAIL_RESEND_API_KEY ?? process.env.RESEND_API_KEY;
}

export async function sendWaitlistWelcomeEmail(
  data: WaitlistWelcomeEmailData
): Promise<void> {
  const apiKey = getResendApiKey();
  const from = process.env.EMAIL_SENDER;

  if (!apiKey || !from) {
    return;
  }

  const component = WaitlistWelcomeEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from,
    to: data.recipient,
    subject: `Glad you're here early — ${AppInfo.APP_NAME} waitlist`,
    html,
    text
  });

  if (response.error) {
    throw new Error(response.error.message ?? 'Could not send waitlist email.');
  }
}
