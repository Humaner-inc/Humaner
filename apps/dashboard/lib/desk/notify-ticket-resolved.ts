import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import { sendTicketResolvedEmail } from '@/lib/smtp/send-ticket-resolved-email';

export type NotifyResolutionInput = {
  ticketId: string;
  organizationId: string;
  resolvedBy: 'human' | 'ai';
  resolvedByName: string;
  resolutionSolution?: string | null;
  sendEmail?: boolean;
};

/**
 * After a ticket is resolved:
 * 1. Writes a resolution summary message into the conversation (visible in live chat / widget).
 * 2. Sends a resolution email to the visitor (if visitorEmail exists).
 *
 * This must be called AFTER the ticket status is already set to RESOLVED.
 */
export async function notifyTicketResolved(
  input: NotifyResolutionInput
): Promise<void> {
  const ticket = await prisma.handoffTicket.findUnique({
    where: { id: input.ticketId },
    select: {
      ticketNumber: true,
      conversationId: true,
      subject: true,
      visitorEmail: true,
      visitorFirstName: true,
      resolutionSolution: true,
      organization: {
        select: { name: true, supportEmail: true }
      }
    }
  });

  if (!ticket) return;

  const solution =
    input.resolutionSolution?.trim() ||
    ticket.resolutionSolution?.trim() ||
    null;
  const ref = formatTicketRef(ticket.ticketNumber);
  const resolverLabel =
    input.resolvedBy === 'ai' ? 'Agent Desk' : input.resolvedByName;

  const summaryParts = [
    `Your issue ${ref} has been resolved by ${resolverLabel}.`
  ];
  if (solution) {
    summaryParts.push(`\n**Resolution:** ${solution}`);
  }
  summaryParts.push(
    '\nIf this doesn\u2019t fully address your concern, please reply or open a new conversation.'
  );
  const summaryMessage = summaryParts.join('');

  const writePromise = ticket.conversationId
    ? prisma.message.create({
        data: {
          conversationId: ticket.conversationId,
          role: 'ASSISTANT',
          content: summaryMessage
        }
      })
    : Promise.resolve(null);

  const shouldSendEmail = input.sendEmail !== false;
  const emailPromise =
    shouldSendEmail && ticket.visitorEmail && ticket.organization
      ? sendTicketResolvedEmail({
          recipient: ticket.visitorEmail,
          visitorName: ticket.visitorFirstName || null,
          ticketRef: ref,
          subject: ticket.subject,
          resolvedByName: resolverLabel,
          resolutionSolution: solution,
          orgName: ticket.organization.name,
          supportEmail: ticket.organization.supportEmail || null
        }).catch((err) => {
          console.error('Failed to send ticket-resolved email', err);
        })
      : Promise.resolve(null);

  await Promise.all([writePromise, emailPromise]);
}
