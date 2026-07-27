import { EmailLayout, EmailText, EmailTitle } from '@humaner/shared/email-ui';

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
  </EmailLayout>
);
