import 'server-only';

import { cache } from 'react';
import type { ChatAttachmentPayload } from '@humaner/shared/chat-attachments';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { getTeamMessageAttachmentsByIds } from '@/lib/team/persist-message-attachments';

export type TeamNoteItem = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  threadId: string;
  subject: string;
};

export type TeamMessageItem = {
  id: string;
  body: string;
  attachments: ChatAttachmentPayload[];
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type TeamWorkspaceFeed = {
  notes: TeamNoteItem[];
  messages: TeamMessageItem[];
};

export const getTeamWorkspaceFeed = cache(
  async (): Promise<TeamWorkspaceFeed> => {
    const session = await dedupedAuth();
    if (!checkSession(session)) {
      return { notes: [], messages: [] };
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) return { notes: [], messages: [] };

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });

    const [notes, messages] = await Promise.all([
      prisma.mailThreadNote.findMany({
        where: {
          thread: mailThreadAccessWhere({
            organizationId,
            userId: session.user.id,
            scope
          })
        },
        orderBy: { createdAt: 'desc' },
        take: 80,
        select: {
          id: true,
          body: true,
          authorId: true,
          createdAt: true,
          author: { select: { name: true } },
          thread: { select: { id: true, subject: true } }
        }
      }),
      prisma.teamMessage.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
        take: 120,
        select: {
          id: true,
          body: true,
          authorId: true,
          createdAt: true,
          author: { select: { name: true } }
        }
      })
    ]);

    const attachmentsById = await getTeamMessageAttachmentsByIds(
      messages.map((message) => message.id)
    );

    return {
      notes: notes.map((note) => ({
        id: note.id,
        body: note.body,
        authorId: note.authorId,
        authorName: note.author.name,
        createdAt: note.createdAt.toISOString(),
        threadId: note.thread.id,
        subject: note.thread.subject || '(no subject)'
      })),
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        attachments: attachmentsById.get(message.id) ?? [],
        authorId: message.authorId,
        authorName: message.author.name,
        createdAt: message.createdAt.toISOString()
      }))
    };
  }
);
