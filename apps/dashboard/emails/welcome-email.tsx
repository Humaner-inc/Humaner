import { EmailLayout, EmailText } from '@humaner/shared/email-ui';
import { getEmailXIconUrl, getXUrl } from '@humaner/shared/urls';
import { Img, Link, Section, Text } from '@react-email/components';

import { AppInfo } from '@/constants/app-info';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = (_data: WelcomeEmailData) => (
  <EmailLayout preview="Glad you're here.">
    <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
    <EmailText>Glad you&apos;re here.</EmailText>
    <EmailText>
      Hope this email sounds Human enouhg for you. (yes I left the typo on
      purpose)
    </EmailText>
    <EmailText>
      We want to give Customer Support the attention and the tools it deserves.{' '}
      {AppInfo.APP_NAME} have one goal in mind: allowing businesses to offer
      exceptional support in the AI era.
    </EmailText>
    <EmailText>
      Stay tuned, we will thank you with more than words for being here first.
    </EmailText>
    <Section className="my-[24px]">
      <Text className="m-0 text-[14px] leading-[24px] text-black">
        Follow us on:{' '}
        <Link
          href={getXUrl()}
          className="text-blue-600 no-underline"
        >
          <Img
            src={getEmailXIconUrl()}
            alt=""
            width="16"
            height="16"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: 6
            }}
          />
          <span style={{ verticalAlign: 'middle' }}>X</span>
        </Link>
      </Text>
    </Section>
    <EmailText>
      Lovely day,
      <br />
      Alexandre
    </EmailText>
  </EmailLayout>
);
