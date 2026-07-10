import { render } from "@react-email/render";
import { Resend } from "resend";

import { AppInfo } from "@/constants/app-info";
import {
  WaitlistWelcomeEmail,
  type WaitlistWelcomeEmailData,
} from "@/emails/waitlist-welcome-email";
import { createUnsubscribeUrl } from "@/lib/waitlist/create-unsubscribe-url";

function getResendApiKey(): string | undefined {
  return process.env.EMAIL_RESEND_API_KEY ?? process.env.RESEND_API_KEY;
}

export async function sendWaitlistWelcomeEmail(
  data: Pick<WaitlistWelcomeEmailData, "recipient">,
): Promise<void> {
  const apiKey = getResendApiKey();
  const from = process.env.EMAIL_SENDER;

  if (!apiKey || !from) {
    return;
  }

  const emailData: WaitlistWelcomeEmailData = {
    recipient: data.recipient,
    unsubscribeUrl: createUnsubscribeUrl(data.recipient),
  };

  const component = WaitlistWelcomeEmail(emailData);
  const html = await render(component);
  const text = await render(component, { plainText: true });
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from,
    to: data.recipient,
    subject: `Glad you're here early — ${AppInfo.APP_NAME} waitlist`,
    html,
    text,
  });

  if (response.error) {
    throw new Error(response.error.message ?? "Could not send waitlist email.");
  }
}
