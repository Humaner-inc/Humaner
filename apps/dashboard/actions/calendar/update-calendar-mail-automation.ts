'use server';

import { revalidatePath } from 'next/cache';
import { backfillMailCalendarEvents } from '@/services/calendar/ingest-mail-for-calendar';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';

const updateCalendarMailAutomationSchema = z.object({
  enabled: z.boolean()
});

export const updateCalendarMailAutomation = pageActionClient('calendar')
  .metadata({ actionName: 'updateCalendarMailAutomation' })
  .schema(updateCalendarMailAutomationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { calendarMailAutomation: parsedInput.enabled }
    });

    if (parsedInput.enabled) {
      await backfillMailCalendarEvents({
        organizationId: session.user.organizationId,
        createdById: session.user.id
      });
    }

    revalidatePath(Routes.Calendar);
    return { enabled: parsedInput.enabled };
  });
