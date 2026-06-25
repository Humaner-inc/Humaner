import { render } from '@react-email/render';

import {
  PasswordResetEmail,
  type PasswordResetEmailData
} from '@/emails/password-reset-email';
import { sendEmail } from '@/lib/smtp/mailer/send-email';

export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<void> {
  const component = PasswordResetEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await sendEmail({
    recipient: data.recipient,
    subject: 'Reset password instructions',
    html,
    text
  });
}
