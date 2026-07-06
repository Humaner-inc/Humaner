import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

import { AppInfo } from '@/constants/app-info';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type WaitlistWelcomeEmailData = {
  recipient: string;
  unsubscribeUrl: string | null;
};

export const WaitlistWelcomeEmail = (data: WaitlistWelcomeEmailData) => (
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
            Hope this email sounds Human enouhg for you. 
            <br/>(even adding some typos to bring the feel you'll experience with Humaner.)
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Customer support is back in the game. Humaner have one goal in mind: redefining the good old days when support meant something and offering exceptional care your customers deserve in the age of AI.
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
            You receive this email because you joined Humaner.
          
          </Text>
          {data.unsubscribeUrl ? (
            <Section className="mt-3 text-center">
              <Link
                href={data.unsubscribeUrl}
                className="text-[10px] leading-[14px] text-[#999999] underline"
              >
                Unsubscribe
              </Link>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
