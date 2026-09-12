import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { filterUsersWithThreadAccess } from '@/lib/inbox/mail-alias-scope';
import { resolveMentionedUserIds } from '@/lib/inbox/mentions';

export async function notifyMentionedTeammates(input: {
  organizationId: string;
  authorId: string;
  body: string;
  subject: string;
  content: string;
  link: string;
  threadId?: string;
}): Promise<void> {
  const members = await prisma.organizationMembership.findMany({
    where: { organizationId: input.organizationId },
    select: { user: { select: { id: true, name: true } } }
  });
  let mentioned = resolveMentionedUserIds(
    input.body,
    members.map((membership) => membership.user)
  ).filter((userId) => userId !== input.authorId);

  if (mentioned.length === 0) return;

  if (input.threadId) {
    mentioned = await filterUsersWithThreadAccess({
      organizationId: input.organizationId,
      threadId: input.threadId,
      userIds: mentioned
    });
    if (mentioned.length === 0) return;
  }

  await prisma.notification.createMany({
    data: mentioned.map((userId) => ({
      userId,
      subject: input.subject,
      content: input.content,
      link: input.link
    }))
  });
}
