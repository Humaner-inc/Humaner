import {
  EmailDivider,
  EmailInlineLink,
  EmailLayout,
  EmailMuted,
  EmailText,
} from "@humaner/shared/email-ui";
import { Section } from "@react-email/components";

import { AppInfo } from "@/constants/app-info";
import { getBaseUrl } from "@/lib/urls/get-base-url";

export type WaitlistWelcomeEmailData = {
  recipient: string;
  unsubscribeUrl: string | null;
};

export const WaitlistWelcomeEmail = (data: WaitlistWelcomeEmailData) => (
  <EmailLayout
    preview="Glad you're here early."
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
    <EmailText>Glad you&apos;re here early.</EmailText>
    <EmailText>
      Hope this email sounds Human enouhg for you. (even added typo I know, you
      can do it with {AppInfo.APP_NAME} agents too! But dont tell others yet.)
    </EmailText>
    <EmailText>
      We want to give Customer Support the attention and the tools it deserves.{" "}
      {AppInfo.APP_NAME} have one goal in mind: allowing businesses to offer
      exceptional support in the AI era.
    </EmailText>
    <EmailText>
      Stay tuned, we will thank you with more than words for being here first.
    </EmailText>
    <EmailText>
      Lovely day,
      <br />
      Alexandre
    </EmailText>
    <EmailDivider />
    <EmailMuted>
      You receive this email because you joined the {AppInfo.APP_NAME} waitlist.
    </EmailMuted>
    {data.unsubscribeUrl ? (
      <Section className="mt-3 text-center">
        <EmailInlineLink href={data.unsubscribeUrl}>
          Unsubscribe
        </EmailInlineLink>
      </Section>
    ) : null}
  </EmailLayout>
);
