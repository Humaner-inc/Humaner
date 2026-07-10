'use client';

import * as React from 'react';

import { SupportTicketInbox } from '@/components/support/support-ticket-inbox';
import type { AdminSupportTicketListRow } from '@/data/support-tickets/get-admin-tickets-list';

export type AdminTicketsClientProps = {
  initialTickets: AdminSupportTicketListRow[];
};

export function AdminTicketsClient({
  initialTickets
}: AdminTicketsClientProps): React.JSX.Element {
  return (
    <SupportTicketInbox
      tickets={initialTickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        updatedAt: ticket.updatedAt.toISOString(),
        requesterName: ticket.requesterName,
        requesterEmail: ticket.requesterEmail
      }))}
      emptyMessage="No tickets yet."
    />
  );
}
