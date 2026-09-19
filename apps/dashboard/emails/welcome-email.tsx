import {
  EmailInlineLink,
  EmailLayout,
  EmailText
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { isViralBetaInboxFree } from '@/lib/auth/viral-beta-constants';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = (_data: WelcomeEmailData) => {
  const earlyAccess = isViralBetaInboxFree();

  return (
    <EmailLayout
      preview="Ready for the inbox(ing)?"
      showUnsubscribe
    >
      <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
      <EmailText>
        I wanted to run my emails while still being kind of personal and here
        we're, reinventing mailing with you.
      </EmailText>
      <EmailText>
        Follow the onboarding and connect your mail provider(s). You can then
        customize Companion's behavior, or use your own agent with our MCP
        server.
      </EmailText>
      <EmailText>
        You were granted some credits to try everything Humaner has to offer..
      </EmailText>
      {earlyAccess ? (
        <EmailText>and more to come since you was here first.</EmailText>
      ) : null}
      <EmailText>
        Please, if you need anything just reach to me at{' '}
        <EmailInlineLink href="https://x.com/alexneyret">
          @alexneyret
        </EmailInlineLink>
        . Until then, I wish you a fast, and happy emailing,
        <br />
        Alexandre
      </EmailText>
    </EmailLayout>
  );
};
