'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';

const disconnectCalendarSchema = z.object({
  connectionId: z.string().uuid()
});

export const disconnectCalendar = pageActionClient('calendar')
  .metadata({ actionName: 'disconnectCalendar' })
  .schema(disconnectCalendarSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.calendarConnection.findFirst({
      where: {
        id: parsedInput.connectionId,
        organizationId: session.user.organizationId
      },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundError('Calendar connection not found');
    }

    await prisma.calendarConnection.delete({ where: { id: existing.id } });
    revalidatePath(Routes.Calendar);
    return { ok: true };
  });
