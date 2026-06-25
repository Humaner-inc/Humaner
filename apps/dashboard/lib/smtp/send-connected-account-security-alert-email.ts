import { render } from '@react-email/render';

import {
  ConnectedAccountSecurityAlertEmail,
  type ConnectedAccountSecurityAlertEmailData
} from '@/emails/connected-account-security-alert-email';
import { sendEmail } from '@/lib/smtp/mailer/send-email';

export async function sendConnectedAccountSecurityAlertEmail(
  data: ConnectedAccountSecurityAlertEmailData
): Promise<void> {
  const component = ConnectedAccountSecurityAlertEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await sendEmail({
    recipient: data.recipient,
    subject: 'Security Alert!',
    html,
    text
  });
}
