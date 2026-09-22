'use server';

import { revalidateTag } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateBusinessHoursSchema } from '@/schemas/organization/update-business-hours-schema';

export const updateBusinessHours = ownerActionClient
  .metadata({ actionName: 'updateBusinessHours' })
  .schema(updateBusinessHoursSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organization = await prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: {
        name: true,
        businessHours: {
          select: {
            id: true,
            dayOfWeek: true,
            timeSlots: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    const slotIds = organization.businessHours.flatMap((workHours) =>
      workHours.timeSlots.map((slot) => slot.id)
    );

    await prisma.$transaction(async (tx) => {
      for (const id of slotIds) {
        await tx.workTimeSlot.delete({ where: { id } });
      }
      for (const workHours of parsedInput.businessHours) {
        const workHoursId = organization.businessHours.find(
          (item) => item.dayOfWeek === workHours.dayOfWeek
        )!.id;
        if (workHours.timeSlots.length === 0) {
          continue;
        }
        await tx.workTimeSlot.createMany({
          data: workHours.timeSlots.map((timeSlot) => ({
            workHoursId,
            start: timeSlot.start,
            end: timeSlot.end
          }))
        });
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.BusinessHours,
        session.user.organizationId
      ),
      'max'
    );
  });
