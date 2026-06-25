import { render } from '@react-email/render';

import {
  ConfirmEmailAddressChangeEmail,
  type ConfirmEmailAddressChangeEmailData
} from '@/emails/confirm-email-address-change-email';
import { sendEmail } from '@/lib/smtp/mailer/send-email';

export async function sendConfirmEmailAddressChangeEmail(
  data: ConfirmEmailAddressChangeEmailData
): Promise<void> {
  const component = ConfirmEmailAddressChangeEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await sendEmail({
    recipient: data.recipient,
    subject: 'Change email instructions',
    html,
    text
  });
}
