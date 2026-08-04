import { render } from '@react-email/render';

import {
  TicketResolvedEmail,
  type TicketResolvedEmailData
} from '@/emails/ticket-resolved-email';
import { sendEmail } from '@/lib/smtp/mailer/send-email';

export async function sendTicketResolvedEmail(
  data: TicketResolvedEmailData
): Promise<void> {
  const component = TicketResolvedEmail(data);
  const html = await render(component);
  const text = await render(component, { plainText: true });

  await sendEmail({
    recipient: data.recipient,
    subject: `${data.ticketRef} — Your issue has been resolved`,
    html,
    text,
    replyTo: data.supportEmail || undefined
  });
}
