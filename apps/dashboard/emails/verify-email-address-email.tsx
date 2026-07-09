import {
  EmailButton,
  EmailDivider,
  EmailLayout,
  EmailMuted,
  EmailOtp,
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
  name,
  otp,
  verificationLink
}: VerifyEmailAddressEmailData) => (
  <EmailLayout
    preview={`Your ${AppInfo.APP_NAME} verification code: ${otp}`}
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailTitle>Verify your email</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      Use this code to verify your email and continue setting up {AppInfo.APP_NAME}:
    </EmailText>
    <EmailOtp code={otp} />
    <EmailMuted center>
      Or use the button below to open {AppInfo.APP_NAME}.
    </EmailMuted>
    <EmailButton href={verificationLink}>Open {AppInfo.APP_NAME}</EmailButton>
    <EmailDivider />
    <EmailMuted>
      If you didn&apos;t create a {AppInfo.APP_NAME} account, you can ignore this
      email.
    </EmailMuted>
  </EmailLayout>
);
