import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { ContactRecord, Prisma } from '@prisma/client';
import { endOfDay, format, startOfDay } from 'date-fns';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/validation/exceptions';
import {
  getLeadGenerationDataSchema,
  type GetLeadGenerationDataSchema
} from '@/schemas/home/get-lead-generation-data-schema';
import type { LeadGenerationDataPointDto } from '@/types/dtos/lead-generation-data-point-dto';

export async function getLeadGenerationData(
  input: GetLeadGenerationDataSchema
): Promise<LeadGenerationDataPointDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getLeadGenerationDataSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const [contacts] = await prisma.$transaction(
        [
          prisma.contact.findMany({
            where: {
              organizationId: session.user.organizationId,
              createdAt: {
                gte: startOfDay(parsedInput.from),
                lte: endOfDay(parsedInput.to)
              }
            },
            select: {
              record: true,
              createdAt: true
            }
          })
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
        }
      );

      const dataPointsByDate = Object.values(
        contacts.reduce(
          (acc, { record, createdAt }) => {
            const date = format(createdAt, 'yyyy-MM-dd');
            acc[date] = acc[date] || { date, people: 0, companies: 0 };
            acc[date][
              record === ContactRecord.PERSON ? 'people' : 'companies'
            ]++;

            return acc;
          },
          {} as Record<string, LeadGenerationDataPointDto>
        )
      );

      return dataPointsByDate.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.LeadGenerationData,
      session.user.organizationId,
      parsedInput.from.toISOString(),
      parsedInput.to.toISOString()
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.LeadGenerationData,
          session.user.organizationId
        ),
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contacts,
          session.user.organizationId
        )
      ]
    }
  )();
}
