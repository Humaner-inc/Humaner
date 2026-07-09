import {
  EmailDivider,
  EmailLayout,
  EmailMuted,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type ConnectedAccountSecurityAlertEmailData = {
  recipient: string;
  name: string;
  provider: string;
  action: 'connected' | 'disconnected';
};

export const ConnectedAccountSecurityAlertEmail = ({
  name,
  provider,
  action
}: ConnectedAccountSecurityAlertEmailData) => (
  <EmailLayout
    preview="Security alert"
    logoSrc={`${getBaseUrl()}/humaner.svg`}
    logoAlt={AppInfo.APP_NAME}
  >
    <EmailTitle>Security alert</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      The login &apos;{provider}&apos; has been {action}{' '}
      {action === 'disconnected' ? 'from' : 'to'} your account.
    </EmailText>
    <EmailDivider />
    <EmailMuted>
      You receive this message because there has been account security changes
      on {AppInfo.APP_NAME}.
    </EmailMuted>
  </EmailLayout>
);
