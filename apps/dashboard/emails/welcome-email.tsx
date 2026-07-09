import {
  EmailButton,
  EmailDivider,
  EmailLayout,
  EmailMuted,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = ({ name }: WelcomeEmailData) => (
  <EmailLayout
    preview={`Welcome to ${AppInfo.APP_NAME}!`}
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailTitle>Welcome to {AppInfo.APP_NAME}!</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      Thank you for signing up! We&apos;re excited to have you on board. Your
      account has been successfully created, and you&apos;re ready to start
      exploring our platform.
    </EmailText>
    <EmailButton href={`${getBaseUrl()}${Routes.Dashboard}`}>Get started</EmailButton>
    <EmailText>
      If you have any questions or need assistance, please don&apos;t hesitate
      to reach out to our support team.
    </EmailText>
    <EmailDivider />
    <EmailMuted>
      You receive this email because you signed up on {AppInfo.APP_NAME}.
    </EmailMuted>
  </EmailLayout>
);
