import { EmailLayout, EmailText, EmailTitle } from '@humaner/shared/email-ui';

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
  <EmailLayout preview="Security alert">
    <EmailTitle>Security alert</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      The login &apos;{provider}&apos; has been {action}{' '}
      {action === 'disconnected' ? 'from' : 'to'} your account.
    </EmailText>
  </EmailLayout>
);
