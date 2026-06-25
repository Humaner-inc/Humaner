import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

import { AppInfo } from '@/constants/app-info';

export type PasswordResetEmailData = {
  recipient: string;

  name: string;
  resetPasswordLink: string;
};

export const PasswordResetEmail = ({
  name,
  resetPasswordLink
}: PasswordResetEmailData) => (
  <Html>
    <Head />
    <Preview>{AppInfo.APP_NAME} reset your password</Preview>
    <Tailwind>
      <Body className="m-auto bg-white px-2 font-sans">
        <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
          <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
            Reset Instructions
          </Heading>
          <Text className="text-[14px] leading-[24px] text-black">
            Hello {name},
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Someone recently requested a password change for your{' '}
            {AppInfo.APP_NAME} account. If this was you, you can set a new
            password here:
          </Text>
          <Section className="my-[32px] text-center">
            <Button
              className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
              href={resetPasswordLink}
            >
              Reset password
            </Button>
          </Section>
          <Text className="text-[14px] leading-[24px] text-black">
            or copy and paste this URL into your browser:{' '}
            <Link
              href={resetPasswordLink}
              className="text-blue-600 no-underline"
            >
              {resetPasswordLink}
            </Link>
          </Text>
          <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
          <Text className="text-[12px] leading-[24px] text-[#666666]">
            If you don't want to change your password or didn't request this,
            just ignore and delete this message. To keep your account secure,
            please don't forward this email to anyone.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
