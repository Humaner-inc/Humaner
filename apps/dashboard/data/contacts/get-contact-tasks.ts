import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

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
  getContactTasksSchema,
  type GetContactTasksSchema
} from '@/schemas/contacts/get-contact-tasks-schema';
import type { ContactTaskDto } from '@/types/dtos/contact-task-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getContactTasks(
  input: GetContactTasksSchema
): Promise<ContactTaskDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactTasksSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const tasks = await prisma.contactTask.findMany({
        where: {
          contactId: parsedInput.contactId,
          contact: {
            organizationId: session.user.organizationId
          }
        },
        select: {
          id: true,
          contactId: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          createdAt: true
        },
        orderBy: {
          createdAt: SortDirection.Asc
        }
      });

      const mapped: ContactTaskDto[] = tasks.map((task) => ({
        id: task.id,
        contactId: task.contactId ?? undefined,
        title: task.title,
        description: task.description ?? undefined,
        status: task.status,
        dueDate: task.dueDate ?? undefined,
        createdAt: task.createdAt
      }));

      return mapped;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.ContactTasks,
      session.user.organizationId,
      parsedInput.contactId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.ContactTasks,
          session.user.organizationId,
          parsedInput.contactId
        )
      ]
    }
  )();
}
