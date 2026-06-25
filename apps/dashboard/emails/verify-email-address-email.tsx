import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

export type VerifyEmailAddressEmailData = {
  recipient: string;
  name: string;
  otp: string;
  verificationLink: string;
};

export const VerifyEmailAddressEmail = ({
  name,
  otp,
  verificationLink
}: VerifyEmailAddressEmailData) => (
  <Html>
    <Head />
    <Preview>Your Humaner verification code: {otp}</Preview>
    <Tailwind>
      <Body className="m-auto bg-white px-2 font-sans">
        <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
          <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
            Verify your email
          </Heading>
          <Text className="text-[14px] leading-[24px] text-black">
            Hello {name},
          </Text>
          <Text className="text-[14px] leading-[24px] text-black">
            Use this code to verify your email and continue setting up Humaner:
          </Text>
          <Section className="my-[32px] text-center">
            <Text className="m-0 text-[36px] font-bold tracking-[10px] text-black">
              {otp}
            </Text>
          </Section>
          <Text className="text-center text-[14px] leading-[24px] text-[#666666]">
            Or use the button below to open Humaner.
          </Text>
          <Section className="my-[24px] text-center">
            <Button
              className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
              href={verificationLink}
            >
              Open Humaner
            </Button>
          </Section>
          <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
          <Text className="text-[12px] leading-[24px] text-[#666666]">
            If you didn&apos;t create a Humaner account, you can ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
