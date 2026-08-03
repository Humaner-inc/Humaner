import {
  EmailDivider,
  EmailLayout,
  EmailText,
  EmailTitle
} from '@humaner/shared/email-ui';
import { Section, Text } from '@react-email/components';

export type TicketResolvedEmailData = {
  recipient: string;
  visitorName: string | null;
  ticketRef: string;
  subject: string;
  resolvedByName: string;
  resolutionSolution: string | null;
  orgName: string;
  supportEmail: string | null;
};

export const TicketResolvedEmail = (data: TicketResolvedEmailData) => (
  <EmailLayout preview={`${data.ticketRef} has been resolved`}>
    <EmailTitle>Issue resolved</EmailTitle>

    <EmailText>
      {data.visitorName ? `Hi ${data.visitorName},` : 'Hi,'}
    </EmailText>

    <EmailText>
      Your support ticket <strong>{data.ticketRef}</strong> &mdash;{' '}
      <em>{data.subject}</em> &mdash; has been resolved by{' '}
      <strong>{data.resolvedByName}</strong>.
    </EmailText>

    {data.resolutionSolution ? (
      <Section className="my-[16px] rounded-[8px] bg-[#f5f5f5] px-[20px] py-[16px]">
        <Text className="m-0 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#666]">
          Resolution
        </Text>
        <Text className="mt-[8px] text-[14px] leading-[22px] text-[#333]">
          {data.resolutionSolution}
        </Text>
      </Section>
    ) : null}

    <EmailText>
      If this doesn&apos;t fully address your concern, simply reply to this
      email
      {data.supportEmail ? ` or contact us at ${data.supportEmail}` : ''}.
    </EmailText>

    <EmailDivider />

    <EmailText>Thank you for reaching out to {data.orgName}.</EmailText>
  </EmailLayout>
);
