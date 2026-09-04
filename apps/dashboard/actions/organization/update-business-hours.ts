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

    await prisma.$transaction([
      prisma.workTimeSlot.deleteMany({
        where: {
          workHours: {
            organization: {
              id: session.user.organizationId
            }
          },
          workHoursId: {
            in: organization.businessHours.map((workHours) => workHours.id)
          }
        }
      }),
      ...parsedInput.businessHours.map((workHours) =>
        prisma.workTimeSlot.createMany({
          data: workHours.timeSlots.map((timeSlot) => ({
            workHoursId: organization.businessHours.find(
              (w) => w.dayOfWeek === workHours.dayOfWeek
            )!.id,
            start: timeSlot.start,
            end: timeSlot.end
          }))
        })
      )
    ]);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.BusinessHours,
        session.user.organizationId
      ),
      'max'
    );
  });
