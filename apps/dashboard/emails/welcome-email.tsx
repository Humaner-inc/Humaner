import {
  EmailButton,
  EmailDivider,
  EmailLayout,
  EmailMuted,
  EmailText
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { getBaseUrl } from '@/lib/urls/get-base-url';

export type WelcomeEmailData = {
  recipient: string;
  name: string;
};

export const WelcomeEmail = (_data: WelcomeEmailData) => (
  <EmailLayout preview="Glad you're here.">
    <EmailText>Hey it&apos;s Alexandre from {AppInfo.APP_NAME}.</EmailText>
    <EmailText>Glad you&apos;re here.</EmailText>
    <EmailText>
      Hope this email sounds Human enouhg for you. (yes I left the typo on
      purpose)
    </EmailText>
    <EmailText>
      We want to give Customer Support the attention and the tools it deserves.{' '}
      {AppInfo.APP_NAME} have one goal in mind: allowing businesses to offer
      exceptional support in the AI era.
    </EmailText>
    <EmailText>
      Stay tuned, we will thank you with more than words for being here first.
    </EmailText>
    <EmailButton href={`${getBaseUrl()}${Routes.Dashboard}`}>
      Get started
    </EmailButton>
    <EmailText>
      Lovely day,
      <br />
      Alexandre
    </EmailText>
    <EmailDivider />
    <EmailMuted>
      You receive this email because you signed up on {AppInfo.APP_NAME}.
    </EmailMuted>
  </EmailLayout>
);
