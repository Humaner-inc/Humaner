import {
  EmailDivider,
  EmailLayout,
  EmailMuted,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

import { AppInfo } from '@/constants/app-info';

export type FeedbackEmailData = {
  recipient: string;
  organizationName: string;
  name: string;
  email: string;
  category: string;
  message: string;
};

export const FeedbackEmail = ({
  organizationName,
  name,
  email,
  category,
  message
}: FeedbackEmailData) => (
  <EmailLayout preview="Feedback">
    <EmailTitle>Feedback</EmailTitle>
    <EmailText>Organization: {organizationName}</EmailText>
    <EmailText>Name: {name}</EmailText>
    <EmailText>Email: {email}</EmailText>
    <EmailText>Category: {category}</EmailText>
    <EmailText>Message: {message}</EmailText>
    <EmailDivider />
    <EmailMuted>
      You receive this email because someone submitted feedback on{' '}
      {AppInfo.APP_NAME}.
    </EmailMuted>
  </EmailLayout>
);
