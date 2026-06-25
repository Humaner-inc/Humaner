import { render } from '@react-email/render';

import { FeedbackEmail, type FeedbackEmailData } from '@/emails/feedback-email';
import { sendEmail } from '@/lib/smtp/mailer/send-email';

export async function sendFeedbackEmail(
  data: FeedbackEmailData
): Promise<void> {
  const component = FeedbackEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await sendEmail({
    recipient: data.recipient,
    subject: 'User Feedback',
    html,
    text
  });
}
