import 'server-only';

import { prisma } from '@/lib/db/prisma';

export type MailThreadNoteItem = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export async function updateSharedNoteDraft(input: {
  threadId: string;
  organizationId: string;
  authorId: string;
  body: string;
}): Promise<void> {
  await prisma.mailThread.update({
    where: { id: input.threadId },
    data: {
      sharedNoteDraft: input.body,
      sharedNoteDraftUpdatedAt: new Date(),
      sharedNoteDraftAuthorId: input.authorId
    }
  });
}

export async function sendMailThreadNote(input: {
  threadId: string;
  organizationId: string;
  authorId: string;
  body: string;
}): Promise<MailThreadNoteItem> {
  const body = input.body.trim();
  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.mailThreadNote.create({
      data: {
        threadId: input.threadId,
        authorId: input.authorId,
        body
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
        author: { select: { name: true } }
      }
    });
    await tx.mailThread.update({
      where: { id: input.threadId },
      data: {
        sharedNoteDraft: null,
        sharedNoteDraftUpdatedAt: new Date(),
        sharedNoteDraftAuthorId: input.authorId
      }
    });
    return created;
  });

  return {
    id: note.id,
    body: note.body,
    authorId: note.authorId,
    authorName: note.author.name,
    createdAt: note.createdAt.toISOString()
  };
}
