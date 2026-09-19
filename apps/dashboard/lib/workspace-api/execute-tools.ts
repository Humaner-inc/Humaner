import 'server-only';

import { suggestMailReplies } from '@/services/inbox/suggest-mail-replies';
import {
  HandoffTicketStatus,
  HandoffTicketUrgency,
  InvitationStatus,
  MailThreadStatus
} from '@prisma/client';

import { Routes } from '@/constants/routes';
import {
  readCompanionWorkspaceRights,
  workspaceAllowsCompanionAction
} from '@/data/inbox/companion-rights';
import { parseCalendarWhen } from '@/lib/calendar/parse-calendar-when';
import { CONNECT_APPS } from '@/lib/connect-apps';
import { prisma } from '@/lib/db/prisma';
import { createHandoffTicketWithNumber } from '@/lib/desk/allocate-ticket-number';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import {
  connectorActivationError,
  integrationForConnectorTool
} from '@/lib/inbox/companion-rights';
import {
  composeMailboxMail,
  isMailboxAddress
} from '@/lib/inbox/compose-mailbox-mail';
import { createTaskFromMailThread } from '@/lib/inbox/create-task-from-thread';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import {
  applyMailThreadAssignee,
  COMPANION_ASSIGNEE,
  mailAssigneeLabel
} from '@/lib/inbox/mail-assignee';
import { sendMailThreadNote } from '@/lib/inbox/mail-thread-notes';
import {
  aliasAllowsCompanionSend,
  sendMailThreadReply
} from '@/lib/inbox/send-mail-thread-reply';
import { loadTeamProfileRefs } from '@/lib/team/load-team-profile-refs';
import { resolveProfileAssignee } from '@/lib/team/resolve-profile-assignee';
import { inferRoutingTopics } from '@/lib/team/routing-topics';
import {
  UNTRUSTED_MAIL_GUARD,
  wrapUntrustedMailBody
} from '@/lib/untrusted-content';
import type { WorkspaceToolContext } from '@/lib/workspace-api/authorize';
import {
  resolveWorkspaceToolName,
  type WorkspaceToolName
} from '@/lib/workspace-api/catalog';
import { executeConnectorTool } from '@/lib/workspace-api/connectors';

export type WorkspaceToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

/** Mail bodies handed to a model are truncated, then delimited as untrusted. */
const MAX_TOOL_BODY_CHARS = 4000;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTopicList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDueAt(value: unknown): Date | null {
  const raw = asString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function actorMailAccess(context: WorkspaceToolContext) {
  const scope = await resolveMailAliasScope({
    userId: context.actorUserId,
    organizationId: context.organizationId
  });
  return mailThreadAccessWhere({
    organizationId: context.organizationId,
    userId: context.actorUserId,
    scope
  });
}

function asLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

async function executeListThreads(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const limit = asLimit(args.limit, 40, 100);
  const unreadOnly = args.unreadOnly === true;
  const statusRaw = asString(args.status);
  const status =
    statusRaw === 'OPEN' || statusRaw === 'PENDING' || statusRaw === 'RESOLVED'
      ? (statusRaw as MailThreadStatus)
      : undefined;

  const access = await actorMailAccess(context);
  const threads = await prisma.mailThread.findMany({
    where: {
      ...access,
      archivedAt: null,
      folder: 'INBOX',
      ...(unreadOnly ? { isUnread: true } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    select: {
      id: true,
      subject: true,
      status: true,
      isUnread: true,
      assigneeKind: true,
      lastMessageAt: true,
      alias: { select: { address: true } },
      assignee: { select: { name: true } }
    }
  });

  return {
    ok: true,
    data: {
      threads: threads.map((thread) => ({
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        isUnread: thread.isUnread,
        alias: thread.alias.address,
        assignee: mailAssigneeLabel({
          assigneeKind: thread.assigneeKind,
          assigneeName: thread.assignee?.name ?? null
        }),
        lastMessageAt: thread.lastMessageAt.toISOString()
      }))
    }
  };
}

async function executeReadThread(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  if (!threadId) return { ok: false, error: 'threadId is required.' };

  const access = await actorMailAccess(context);
  const thread = await prisma.mailThread.findFirst({
    where: { id: threadId, ...access },
    select: {
      id: true,
      subject: true,
      status: true,
      assigneeKind: true,
      assigneeId: true,
      handoffTicketId: true,
      alias: { select: { address: true, companionPolicy: true } },
      assignee: { select: { name: true } },
      notes: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { name: true } }
        }
      },
      messages: {
        orderBy: { sentAt: 'asc' },
        take: 40,
        select: {
          id: true,
          direction: true,
          fromAddress: true,
          bodyText: true,
          sentAt: true
        }
      }
    }
  });
  if (!thread) return { ok: false, error: 'Thread not found.' };

  const rights = await readCompanionWorkspaceRights(context.organizationId);
  const inbound = thread.messages.find(
    (message) => message.direction === 'INBOUND'
  );
  const inferredTopics = inferRoutingTopics({
    subject: thread.subject,
    body: inbound?.bodyText,
    fromAddress: inbound?.fromAddress
  });
  const suggestedAssigneeId =
    thread.assigneeId || thread.assigneeKind === 'COMPANION'
      ? null
      : await resolveProfileAssignee(
          context.organizationId,
          inferredTopics.length > 0 ? inferredTopics : ['inbox']
        );

  return {
    ok: true,
    data: {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      alias: thread.alias.address,
      companionPolicy: thread.alias.companionPolicy,
      companionActions: rights.actions,
      assignee: mailAssigneeLabel({
        assigneeKind: thread.assigneeKind,
        assigneeName: thread.assignee?.name ?? null
      }),
      suggestedAssigneeId,
      handoffTicketId: thread.handoffTicketId,
      contentGuard: UNTRUSTED_MAIL_GUARD,
      notes: thread.notes.map((note) => ({
        id: note.id,
        body: note.body,
        authorName: note.author.name,
        createdAt: note.createdAt.toISOString()
      })),
      messages: thread.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        fromAddress: message.fromAddress,
        bodyText: wrapUntrustedMailBody(message.bodyText, MAX_TOOL_BODY_CHARS),
        sentAt: message.sentAt.toISOString()
      }))
    }
  };
}

async function executeSearchThreads(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const query = asString(args.query);
  if (!query) return { ok: false, error: 'query is required.' };
  const limit = asLimit(args.limit, 20, 50);

  const access = await actorMailAccess(context);
  const threads = await prisma.mailThread.findMany({
    where: {
      ...access,
      AND: [
        {
          OR: [
            { subject: { contains: query, mode: 'insensitive' } },
            {
              messages: {
                some: { bodyText: { contains: query, mode: 'insensitive' } }
              }
            }
          ]
        }
      ]
    },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    select: {
      id: true,
      subject: true,
      status: true,
      alias: { select: { address: true } },
      lastMessageAt: true
    }
  });

  return {
    ok: true,
    data: {
      threads: threads.map((thread) => ({
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        alias: thread.alias.address,
        lastMessageAt: thread.lastMessageAt.toISOString()
      }))
    }
  };
}

async function executeSuggestReply(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  if (!threadId) return { ok: false, error: 'threadId is required.' };

  const access = await actorMailAccess(context);
  const thread = await prisma.mailThread.findFirst({
    where: { id: threadId, ...access },
    select: {
      subject: true,
      alias: { select: { address: true } },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromAddress: true, bodyText: true, direction: true }
      }
    }
  });
  if (!thread) return { ok: false, error: 'Thread not found.' };

  const canDraft = await workspaceAllowsCompanionAction(
    context.organizationId,
    'DRAFT'
  );
  if (!canDraft) {
    return {
      ok: false,
      error:
        'Companion draft is off for this workspace. Turn it on in Workspace Settings → Companion.'
    };
  }

  const latest = thread.messages[0];
  const suggestions = await suggestMailReplies({
    subject: thread.subject,
    fromAddress: latest?.fromAddress ?? '',
    aliasAddress: thread.alias.address,
    bodyText: latest?.bodyText ?? ''
  });

  return {
    ok: true,
    data: {
      suggestions,
      subject: thread.subject,
      from: thread.alias.address,
      ...(latest?.direction === 'INBOUND' && latest.fromAddress
        ? { to: latest.fromAddress }
        : {})
    }
  };
}

async function listSendableAliases(
  context: WorkspaceToolContext
): Promise<Array<{ id: string; address: string; mailbox: string }>> {
  const scope = await resolveMailAliasScope({
    userId: context.actorUserId,
    organizationId: context.organizationId
  });
  if (scope.type === 'ids' && scope.aliasIds.length === 0) {
    return [];
  }

  const aliases = await prisma.mailAlias.findMany({
    where: {
      organizationId: context.organizationId,
      enabled: true,
      ...(scope.type === 'ids' ? { id: { in: scope.aliasIds } } : {})
    },
    select: {
      id: true,
      address: true,
      connection: { select: { email: true } }
    },
    orderBy: { address: 'asc' }
  });

  return aliases.map((alias) => ({
    id: alias.id,
    address: alias.address,
    mailbox: alias.connection.email
  }));
}

async function executeListMailAliases(
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const aliases = await listSendableAliases(context);
  return { ok: true, data: { aliases } };
}

async function executeListTeamMembers(
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const [memberships, invitations, profiles, load, rights] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId: context.organizationId },
      select: {
        workspaceRole: true,
        allowedPages: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            timeZone: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: context.organizationId,
        status: InvitationStatus.PENDING
      },
      select: {
        email: true,
        allowedPages: true,
        lastSentAt: true
      },
      orderBy: { email: 'asc' }
    }),
    prisma.teamMemberProfile.findMany({
      where: { organizationId: context.organizationId },
      select: {
        userId: true,
        role: true,
        knowledgeAreas: true,
        maxConcurrent: true
      }
    }),
    loadTeamProfileRefs(context.organizationId),
    readCompanionWorkspaceRights(context.organizationId)
  ]);

  const loadByUser = new Map(load.map((profile) => [profile.userId, profile]));
  const profileByUser = new Map(
    profiles.map((profile) => [profile.userId, profile])
  );

  return {
    ok: true,
    data: {
      memberCount: memberships.length,
      pendingInviteCount: invitations.length,
      companionActions: rights.actions,
      integrations: rights.integrations,
      members: memberships.map((membership) => {
        const profile = profileByUser.get(membership.user.id);
        const capacity = loadByUser.get(membership.user.id);
        return {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          timeZone: membership.user.timeZone,
          workspaceRole: membership.workspaceRole,
          allowedPages: membership.allowedPages,
          profile: profile
            ? {
                role: profile.role,
                knowledgeAreas: profile.knowledgeAreas,
                assigned: capacity?.currentTickets ?? 0,
                maxConcurrent: profile.maxConcurrent
              }
            : null
        };
      }),
      pendingInvitations: invitations.map((invite) => ({
        email: invite.email,
        allowedPages: invite.allowedPages,
        lastSentAt: invite.lastSentAt
      })),
      membersPath: Routes.Members
    }
  };
}

async function executeListConnectors(
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const { integrations } = await readCompanionWorkspaceRights(
    context.organizationId
  );
  const connected = new Set<string>(integrations);

  return {
    ok: true,
    data: {
      connectors: CONNECT_APPS.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        connected: connected.has(app.id),
        status: app.status === 'coming_soon' ? 'coming_soon' : 'available'
      })),
      connectPath: Routes.InboxSettings
    }
  };
}

async function requireActivatedConnector(
  name: string,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult | null> {
  if (!integrationForConnectorTool(name)) return null;

  const { integrations } = await readCompanionWorkspaceRights(
    context.organizationId
  );
  const error = connectorActivationError(name, integrations);
  return error ? { ok: false, error } : null;
}

async function executeSendMail(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  const body = asString(args.body);
  if (!body) {
    return { ok: false, error: 'body is required.' };
  }

  if (threadId) {
    const access = await actorMailAccess(context);
    const visible = await prisma.mailThread.findFirst({
      where: { id: threadId, ...access },
      select: { id: true }
    });
    if (!visible) return { ok: false, error: 'Thread not found.' };

    const allowed = await aliasAllowsCompanionSend(
      context.organizationId,
      threadId
    );
    if (!allowed) {
      return {
        ok: false,
        error:
          'Companion send is off for this workspace. Turn it on in Workspace Settings → Companion, or draft for approval.'
      };
    }

    try {
      const sent = await sendMailThreadReply({
        threadId,
        organizationId: context.organizationId,
        body
      });
      return { ok: true, data: sent };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Could not send.'
      };
    }
  }

  return executeComposeMail(args, context, body);
}

async function executeComposeMail(
  args: Record<string, unknown>,
  context: WorkspaceToolContext,
  body: string
): Promise<WorkspaceToolResult> {
  const to = asString(args.to);
  const subject = asString(args.subject);
  if (!to || !subject) {
    return {
      ok: false,
      error:
        'Pass threadId to reply, or to + subject + body to send a new email.'
    };
  }
  if (!isMailboxAddress(to)) {
    return { ok: false, error: 'to must be a valid email address.' };
  }

  const canSend = await workspaceAllowsCompanionAction(
    context.organizationId,
    'SEND'
  );
  if (!canSend) {
    return {
      ok: false,
      error:
        'Companion send is off for this workspace. Turn it on in Workspace Settings → Companion.'
    };
  }

  const aliases = await listSendableAliases(context);
  if (aliases.length === 0) {
    return { ok: false, error: 'No mailbox alias is available to send from.' };
  }

  const aliasId = asString(args.aliasId);
  const from = asString(args.from).toLowerCase();
  const selected = aliasId
    ? aliases.find((alias) => alias.id === aliasId)
    : from
      ? aliases.find((alias) => alias.address.toLowerCase() === from)
      : aliases.length === 1
        ? aliases[0]
        : undefined;

  if (!selected) {
    return {
      ok: true,
      data: { needsAlias: true, aliases }
    };
  }

  try {
    const sent = await composeMailboxMail({
      organizationId: context.organizationId,
      actorUserId: context.actorUserId,
      aliasId: selected.id,
      to,
      subject,
      body
    });
    return { ok: true, data: sent };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not send.'
    };
  }
}

async function executeAssign(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  if (!threadId) return { ok: false, error: 'threadId is required.' };

  const raw = args.assigneeId;
  const explicitTopics = asTopicList(args.topics);
  const unassign = raw === null;
  let assignee =
    unassign || raw === undefined || raw === ''
      ? null
      : asString(raw) === COMPANION_ASSIGNEE
        ? COMPANION_ASSIGNEE
        : asString(raw);

  const access = await actorMailAccess(context);
  const visible = await prisma.mailThread.findFirst({
    where: { id: threadId, ...access },
    select: {
      id: true,
      subject: true,
      messages: {
        where: { direction: 'INBOUND' },
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromAddress: true, bodyText: true }
      }
    }
  });
  if (!visible) return { ok: false, error: 'Thread not found.' };

  if (!unassign && !assignee) {
    const inbound = visible.messages[0];
    const inferred = inferRoutingTopics({
      subject: visible.subject,
      body: inbound?.bodyText,
      fromAddress: inbound?.fromAddress
    });
    const topics =
      explicitTopics.length > 0
        ? explicitTopics
        : inferred.length > 0
          ? inferred
          : ['inbox'];
    assignee = await resolveProfileAssignee(context.organizationId, topics);
    if (!assignee && explicitTopics.length > 0) {
      return {
        ok: false,
        error:
          'No team profile matches those skills, or everyone is at capacity. Add profiles or pass assigneeId.'
      };
    }
    if (!assignee) {
      assignee = COMPANION_ASSIGNEE;
    }
  }

  const applied = await applyMailThreadAssignee({
    threadId,
    organizationId: context.organizationId,
    assignee
  });
  if (!applied.ok) {
    return {
      ok: false,
      error:
        applied.reason === 'conflict'
          ? 'Thread was updated by someone else.'
          : 'Thread or assignee not found.'
    };
  }
  return { ok: true, data: { assigned: true } };
}

async function executeTag(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  if (!threadId) return { ok: false, error: 'threadId is required.' };

  const access = await actorMailAccess(context);
  const thread = await prisma.mailThread.findFirst({
    where: { id: threadId, ...access },
    select: { id: true, aliasId: true }
  });
  if (!thread) return { ok: false, error: 'Thread not found.' };

  await prisma.mailThreadTag.deleteMany({ where: { threadId } });

  const tagId = asString(args.tagId);
  if (tagId) {
    const tag = await prisma.mailTag.findFirst({
      where: { id: tagId, organizationId: context.organizationId },
      select: { id: true, aliasId: true }
    });
    if (!tag) return { ok: false, error: 'Tag not found.' };
    if (tag.aliasId && tag.aliasId !== thread.aliasId) {
      return {
        ok: false,
        error: 'This tag is only available on another inbox.'
      };
    }
    await prisma.mailThreadTag.create({
      data: { id: crypto.randomUUID(), threadId, tagId: tag.id }
    });
  }

  return { ok: true, data: { tagged: true } };
}

async function executeAddNote(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  const body = asString(args.body);
  if (!threadId || !body) {
    return { ok: false, error: 'threadId and body are required.' };
  }

  const [thread, author] = await Promise.all([
    prisma.mailThread.findFirst({
      where: { id: threadId, ...(await actorMailAccess(context)) },
      select: { id: true, subject: true }
    }),
    prisma.user.findFirst({
      where: { id: context.actorUserId },
      select: { name: true }
    })
  ]);
  if (!thread) return { ok: false, error: 'Thread not found.' };

  const note = await sendMailThreadNote({
    threadId,
    organizationId: context.organizationId,
    authorId: context.actorUserId,
    authorName: author?.name || 'Companion',
    subject: thread.subject,
    body
  });
  return { ok: true, data: note };
}

const TASK_STATUSES = new Set<string>(Object.values(HandoffTicketStatus));
const TASK_URGENCIES = new Set<string>(Object.values(HandoffTicketUrgency));

async function executeListTasks(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const limit = asLimit(args.limit, 20, 50);
  const statusRaw = asString(args.status);
  const status = TASK_STATUSES.has(statusRaw)
    ? (statusRaw as HandoffTicketStatus)
    : undefined;

  const tasks = await prisma.handoffTicket.findMany({
    where: {
      organizationId: context.organizationId,
      ...(status ? { status } : { status: { in: ['OPEN', 'IN_PROGRESS'] } })
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      urgency: true,
      dueAt: true,
      updatedAt: true,
      assignee: { select: { name: true } },
      mailThreads: { select: { id: true }, take: 1 }
    }
  });

  return {
    ok: true,
    data: {
      tasks: tasks.map((task) => ({
        id: task.id,
        ref: formatTicketRef(task.ticketNumber),
        subject: task.subject,
        status: task.status,
        urgency: task.urgency,
        assignee: task.assignee?.name ?? null,
        dueAt: task.dueAt?.toISOString() ?? null,
        threadId: task.mailThreads[0]?.id ?? null,
        updatedAt: task.updatedAt.toISOString()
      }))
    }
  };
}

async function resolveTaskAgentId(
  organizationId: string
): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: { organizationId },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });
  return agent?.id ?? null;
}

async function executeCreateTask(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const subject = asString(args.subject);
  if (!subject) return { ok: false, error: 'subject is required.' };

  const agentId = await resolveTaskAgentId(context.organizationId);
  if (!agentId) {
    return {
      ok: false,
      error: 'This workspace has no agent to attach tasks to yet.'
    };
  }

  let assigneeId = asString(args.assigneeId) || null;
  const explicitTopics = asTopicList(args.topics);
  const summary = asString(args.summary) || subject;
  if (!assigneeId) {
    const inferred = inferRoutingTopics({ subject, body: summary });
    const topics = explicitTopics.length > 0 ? explicitTopics : inferred;
    if (topics.length > 0) {
      assigneeId = await resolveProfileAssignee(context.organizationId, topics);
    }
    if (!assigneeId && explicitTopics.length > 0) {
      return {
        ok: false,
        error:
          'No team profile matches those skills, or everyone is at capacity. Add profiles or pass assigneeId.'
      };
    }
  }
  if (assigneeId) {
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId: assigneeId, organizationId: context.organizationId },
      select: { id: true }
    });
    if (!membership) return { ok: false, error: 'Teammate not found.' };
  }

  const urgencyRaw = asString(args.urgency);

  const task = await createHandoffTicketWithNumber({
    organizationId: context.organizationId,
    agentId,
    subject: subject.slice(0, 255),
    summary: summary.slice(0, 4000),
    transcript: '',
    source: 'EMAIL',
    status: 'OPEN',
    urgency: TASK_URGENCIES.has(urgencyRaw)
      ? (urgencyRaw as HandoffTicketUrgency)
      : 'MEDIUM',
    routedTo: 'HUMAN',
    assigneeId,
    assignedAt: assigneeId ? new Date() : null,
    dueAt: parseDueAt(args.dueAt)
  });

  return {
    ok: true,
    data: {
      id: task.id,
      ref: formatTicketRef(task.ticketNumber),
      subject: subject.slice(0, 255)
    }
  };
}

async function executeCreateTaskFromThread(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const threadId = asString(args.threadId);
  if (!threadId) return { ok: false, error: 'threadId is required.' };

  let assigneeId = asString(args.assigneeId) || null;
  const explicitTopics = asTopicList(args.topics);

  const access = await actorMailAccess(context);
  const visible = await prisma.mailThread.findFirst({
    where: { id: threadId, ...access },
    select: {
      id: true,
      subject: true,
      messages: {
        where: { direction: 'INBOUND' },
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { fromAddress: true, bodyText: true }
      }
    }
  });
  if (!visible) return { ok: false, error: 'Thread not found.' };

  if (!assigneeId) {
    const inbound = visible.messages[0];
    const inferred = inferRoutingTopics({
      subject: visible.subject,
      body: inbound?.bodyText,
      fromAddress: inbound?.fromAddress
    });
    const topics =
      explicitTopics.length > 0
        ? explicitTopics
        : inferred.length > 0
          ? inferred
          : ['inbox'];
    assigneeId = await resolveProfileAssignee(context.organizationId, topics);
    if (!assigneeId && explicitTopics.length > 0) {
      return {
        ok: false,
        error:
          'No team profile matches those skills, or everyone is at capacity. Add profiles or pass assigneeId.'
      };
    }
  }
  if (assigneeId) {
    const membership = await prisma.organizationMembership.findFirst({
      where: { userId: assigneeId, organizationId: context.organizationId },
      select: { id: true }
    });
    if (!membership) return { ok: false, error: 'Teammate not found.' };
  }

  try {
    const task = await createTaskFromMailThread({
      threadId,
      organizationId: context.organizationId,
      assigneeId
    });
    return {
      ok: true,
      data: {
        id: task.id,
        ref: formatTicketRef(task.ticketNumber),
        alreadyExisted: task.existing
      }
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not create the task.'
    };
  }
}

async function executeListCalendar(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const raw = asString(args.weekStart);
  const start = raw ? new Date(raw) : new Date();
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: 'weekStart is not a valid date.' };
  }
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const events = await prisma.calendarEvent.findMany({
    where: {
      organizationId: context.organizationId,
      startsAt: { lt: end },
      endsAt: { gt: start }
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      source: true
    },
    orderBy: { startsAt: 'asc' },
    take: 80
  });

  return {
    ok: true,
    data: {
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        source: event.source
      }))
    }
  };
}

async function executeCreateCalendar(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const title = asString(args.title);
  const startsAtRaw = asString(args.startsAt) || asString(args.when);
  const timeZone = asString(args.timeZone) || context.timeZone;
  const startsAt = startsAtRaw
    ? parseCalendarWhen(startsAtRaw, new Date(), timeZone)
    : null;
  const endsAt = asString(args.endsAt)
    ? parseCalendarWhen(asString(args.endsAt), new Date(), timeZone)
    : startsAt
      ? new Date(startsAt.getTime() + 60 * 60 * 1000)
      : null;
  const description = asString(args.description);

  if (!title || !startsAt || !endsAt) {
    return {
      ok: false,
      error: 'title and a valid startsAt or when are required.'
    };
  }
  if (endsAt <= startsAt) {
    return { ok: false, error: 'Event times are invalid.' };
  }

  const event = await prisma.calendarEvent.create({
    data: {
      organizationId: context.organizationId,
      createdById: context.actorUserId,
      title: title.slice(0, 255),
      description: description ? description.slice(0, 8000) : null,
      startsAt,
      endsAt,
      source: 'companion',
      attendees: { create: { userId: context.actorUserId } }
    },
    select: { id: true, title: true, startsAt: true, endsAt: true }
  });

  return {
    ok: true,
    data: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString()
    }
  };
}

const TEAMMATE_REQUEST_TOPICS: Record<string, string[]> = {
  linear: ['linear'],
  github: ['github'],
  stripe: ['stripe', 'billing'],
  notion: ['notion'],
  inbox: ['inbox']
};

async function executeRequestTeammate(
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const summary = asString(args.summary);
  if (!summary) return { ok: false, error: 'summary is required.' };

  const connector = asString(args.connector) || 'inbox';
  const topics = TEAMMATE_REQUEST_TOPICS[connector] ?? ['inbox'];
  const threadId = asString(args.threadId);
  const assigneeId = asString(args.assigneeId);
  const details = asString(args.details);

  if (threadId) {
    return executeCreateTaskFromThread(
      { threadId, assigneeId: assigneeId || undefined, topics },
      context
    );
  }

  return executeCreateTask(
    {
      subject: summary,
      summary: details || summary,
      assigneeId: assigneeId || undefined,
      topics
    },
    context
  );
}

export async function executeWorkspaceTool(
  name: string,
  args: Record<string, unknown>,
  context: WorkspaceToolContext
): Promise<WorkspaceToolResult> {
  const resolved: WorkspaceToolName | null = resolveWorkspaceToolName(name);
  if (!resolved) return { ok: false, error: 'Unknown tool.' };

  switch (resolved) {
    case 'list_mail_threads':
      return executeListThreads(args, context);
    case 'read_mail_thread':
      return executeReadThread(args, context);
    case 'search_mail_threads':
      return executeSearchThreads(args, context);
    case 'list_mail_aliases':
      return executeListMailAliases(context);
    case 'suggest_mail_reply':
      return executeSuggestReply(args, context);
    case 'send_mail':
      return executeSendMail(args, context);
    case 'assign_mail_thread':
      return executeAssign(args, context);
    case 'tag_mail_thread':
      return executeTag(args, context);
    case 'add_mail_thread_note':
      return executeAddNote(args, context);
    case 'list_team_members':
      return executeListTeamMembers(context);
    case 'list_connectors':
      return executeListConnectors(context);
    case 'list_linear_issues':
    case 'create_linear_issue':
    case 'list_github_issues':
    case 'list_github_pull_requests':
    case 'create_github_issue':
    case 'list_stripe_invoices':
    case 'search_stripe_billing':
    case 'search_notion_pages': {
      const blocked = await requireActivatedConnector(resolved, context);
      if (blocked) return blocked;
      return executeConnectorTool(resolved, args, context);
    }
    case 'request_teammate':
      return executeRequestTeammate(args, context);
    case 'list_tasks':
      return executeListTasks(args, context);
    case 'create_task':
      return executeCreateTask(args, context);
    case 'create_task_from_mail_thread':
      return executeCreateTaskFromThread(args, context);
    case 'list_calendar_events':
      return executeListCalendar(args, context);
    case 'create_calendar_event':
      return executeCreateCalendar(args, context);
    default:
      return { ok: false, error: 'Unknown tool.' };
  }
}
