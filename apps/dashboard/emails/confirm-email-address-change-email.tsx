import {
  EmailButton,
  EmailInlineLink,
  EmailLayout,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';

export type ConfirmEmailAddressChangeEmailData = {
  recipient: string;
  name: string;
  confirmLink: string;
};

export const ConfirmEmailAddressChangeEmail = ({
  name,
  confirmLink
}: ConfirmEmailAddressChangeEmailData) => (
  <EmailLayout
    preview="Confirm new email address"
    footerNote="If you don't want to change your email address or didn't request this, just ignore and delete this message. To keep your account secure, please don't forward this email to anyone."
  >
    <EmailTitle>Confirm new email address</EmailTitle>
    <EmailText>Hello {name},</EmailText>
    <EmailText>
      To complete your email address change request, you must confirm your new
      email address.
    </EmailText>
    <EmailButton href={confirmLink}>Confirm new email</EmailButton>
    <EmailText>
      or copy and paste this URL into your browser:{' '}
      <EmailInlineLink href={confirmLink}>{confirmLink}</EmailInlineLink>
    </EmailText>
  </EmailLayout>
);
