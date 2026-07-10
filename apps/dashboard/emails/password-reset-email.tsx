import {
  EmailButton,
  EmailDivider,
  EmailInlineLink,
  EmailLayout,
  EmailMuted,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type PasswordResetEmailData = {
  recipient: string;
  name: string;
  resetPasswordLink: string;
};

export const PasswordResetEmail = ({
  name,
  resetPasswordLink
}: PasswordResetEmailData) => (
  <EmailLayout
    preview={`${AppInfo.APP_NAME} reset your password`}
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailTitle>Reset instructions</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      Someone recently requested a password change for your {AppInfo.APP_NAME}{' '}
      account. If this was you, you can set a new password here:
    </EmailText>
    <EmailButton href={resetPasswordLink}>Reset password</EmailButton>
    <EmailText>
      or copy and paste this URL into your browser:{' '}
      <EmailInlineLink href={resetPasswordLink}>
        {resetPasswordLink}
      </EmailInlineLink>
    </EmailText>
    <EmailDivider />
    <EmailMuted>
      If you don&apos;t want to change your password or didn&apos;t request
      this, just ignore and delete this message. To keep your account secure,
      please don&apos;t forward this email to anyone.
    </EmailMuted>
  </EmailLayout>
);
