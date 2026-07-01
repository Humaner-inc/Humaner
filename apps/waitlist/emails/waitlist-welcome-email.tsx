import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

import { AppInfo } from '@/constants/app-info';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type WaitlistWelcomeEmailData = {
  recipient: string;
};

export const WaitlistWelcomeEmail = (_data: WaitlistWelcomeEmailData) => (
  <Html>
    <Head />
    <Preview>Glad you&apos;re here early.</Preview>
    <Tailwind>
      <Body className="m-auto bg-white px-2 font-sans">
        <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
          <Section className="my-[24px] text-center">
            <Img
              src={`${getBaseUrl()}/humaner.svg`}
              alt={AppInfo.APP_NAME}
              width="140"
              className="mx-auto"
            />
          </Section>
          <Text className="text-[14px] leading-[24px] text-black">
            Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Glad you&apos;re here early.
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Hope this email sounds Human enouhg for you. (even added typo I know,
            you can do it with {AppInfo.APP_NAME} agents too! But dont tell
            others yet.)
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            We want to give Customer Support the attention and the tools it
            deserves. {AppInfo.APP_NAME} have one goal in mind: allowing
            businesses to offer exceptional support in the AI era.
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Stay tuned, we will thank you with more than words for being here
            first.
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Lovely day,
            <br />
            Alexandre
          </Text>
          <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
          <Text className="text-[12px] leading-[24px] text-[#666666]">
            You receive this email because you joined the {AppInfo.APP_NAME}{' '}
            waitlist.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
