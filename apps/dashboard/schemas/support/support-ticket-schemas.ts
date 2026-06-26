import { z } from 'zod';

import { REPORT_BUG_CONTEXT_TABS } from '@/lib/report-bug-context-options';

export const reportBugSchema = z.object({
  title: z.string().min(3).max(255),
  body: z.string().min(10).max(8000),
  contextTab: z
    .string()
    .min(1)
    .refine(
      (value) => REPORT_BUG_CONTEXT_TABS.some((tab) => tab.value === value),
      'Pick a valid section'
    ),
  contextFeature: z.string().max(255).optional()
});

export const createSupportTicketSchema = reportBugSchema.extend({
  screenshotPath: z.string().min(3).max(2048)
});

export const supportTicketIdSchema = z.object({
  ticketId: z.string().uuid()
});

export const addSupportTicketMessageSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(8000)
});

export const updateSupportTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
});

export type ReportBugSchema = z.infer<typeof reportBugSchema>;
