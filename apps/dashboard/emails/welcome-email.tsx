import { HUMANER_LEGAL_CONTACT_EMAIL } from '@humaner/shared/company';
import {
  EmailInlineLink,
  EmailLayout,
  EmailMuted,
  EmailText
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = (_data: WelcomeEmailData) => {
  return (
    <EmailLayout
      preview="Ready for the inbox(ing)?"
      showUnsubscribe
    >
      <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
      <EmailText>
        Have you too, ever felt your inbox wasn't made for your business ? Super
        time consuming, hard to switch between inboxes, not connected enough,
        and the list goes on.. Humaner fixes all of these, and way more to come.
      </EmailText>
      <EmailText>
        Follow the onboarding, connect your mail provider(s) and automate things
        right away with Companion or your own agent.
      </EmailText>
      <EmailText>
        If you need anything else just reach out to me at{' '}
        <EmailInlineLink href={`mailto:${HUMANER_LEGAL_CONTACT_EMAIL}`}>
          {HUMANER_LEGAL_CONTACT_EMAIL}
        </EmailInlineLink>
        .
      </EmailText>
      <EmailText>Until then, have a fast, and happy emailing.</EmailText>
      <EmailMuted className="italic">
        btw: you were granted some credits to try everything Humaner has to
        offer, enjoy!
      </EmailMuted>
    </EmailLayout>
  );
};
