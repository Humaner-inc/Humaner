import {
  EmailButton,
  EmailDivider,
  EmailEyebrow,
  EmailInlineLink,
  EmailLayout,
  EmailMuted,
  EmailOrDivider,
  EmailOtpGrid,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type VerifyEmailAddressEmailData = {
  recipient: string;
  name: string;
  otp: string;
  verificationLink: string;
};

export const VerifyEmailAddressEmail = ({
  recipient,
  otp,
  verificationLink
}: VerifyEmailAddressEmailData) => (
  <EmailLayout
    variant="onboarding"
    preview={`Your ${AppInfo.APP_NAME} verification code`}
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailEyebrow>Email verification</EmailEyebrow>
    <EmailTitle align="left">Verify your email</EmailTitle>
    <EmailText className="mt-2 text-[#070607]/50">
      Enter the code we sent to{' '}
      <span className="font-medium text-[#070607]">{recipient}</span>.
    </EmailText>

    <EmailOtpGrid code={otp} />

    <EmailButton href={verificationLink} fullWidth>
      Verify email
    </EmailButton>

    <EmailOrDivider />

    <EmailText className="text-center text-[#070607]/50">
      Prefer one tap?{' '}
      <EmailInlineLink href={verificationLink}>Open Humaner</EmailInlineLink>
    </EmailText>

    <EmailDivider />
    <EmailMuted>
      If you didn&apos;t create a {AppInfo.APP_NAME} account, you can ignore
      this email.
    </EmailMuted>
  </EmailLayout>
);
