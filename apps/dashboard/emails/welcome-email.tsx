import {
  EmailInlineLink,
  EmailLayout,
  EmailText
} from '@humaner/shared/email-ui';
import { getEmailXIconUrl, getXUrl } from '@humaner/shared/urls';
import { Img, Link, Section, Text } from '@react-email/components';

import { AppInfo } from '@/constants/app-info';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = (_data: WelcomeEmailData) => (
  <EmailLayout
    preview="Better inbox waiting for you"
    showUnsubscribe
  >
    <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
    <EmailText>Ready for the inbox(ing)?</EmailText>
    <EmailText>
      We want to give Mailing a new direction. Automation, but just the thing,
      running tasks, managing teams and multi-inboxes effortlessly.
    </EmailText>
    <EmailText>
      Follow the onboarding and connect everything in seconds. You can customize
      Companion behavior then, or use your own agent.
    </EmailText>
    <Section className="my-[24px]">
      <Text className="m-0 text-[14px] leading-[24px] text-[#0A0D0D]">
        Humaner is on:{' '}
        <Link
          href={getXUrl()}
          className="no-underline"
        >
          <Img
            src={getEmailXIconUrl()}
            alt="X"
            width="16"
            height="16"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle'
            }}
          />
        </Link>
      </Text>
    </Section>
    <EmailText>
      If you need onboarding or have any questions just reach to me at{' '}
      <EmailInlineLink href="https://x.com/alexneyret">
        @alexneyret
      </EmailInlineLink>
      . Fast, and happy emailing,
      <br />
      Alexandre
    </EmailText>
  </EmailLayout>
);
