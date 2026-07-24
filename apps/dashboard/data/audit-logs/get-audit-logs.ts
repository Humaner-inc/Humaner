import 'server-only';

import { redirect } from 'next/navigation';
import { AuditActorType } from '@prisma/client';

import { AUDIT_EVENT_LABELS, isAuditEvent } from '@/lib/audit/events';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';
import { prisma } from '@/lib/db/prisma';
import type { AuditLogDto } from '@/types/dtos/audit-log-dto';
import { SortDirection } from '@/types/sorty-direction';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export type GetAuditLogsOptions = {
  limit?: number;
  cursor?: string;
  eventType?: string;
};

export async function getAuditLogs(
  options: GetAuditLogsOptions = {}
): Promise<AuditLogDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  await requireWorkspaceOwner(session.user.id, session.user.organizationId);

  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  let cursorCreatedAt: Date | undefined;
  if (options.cursor) {
    const cursorRow = await prisma.auditLog.findFirst({
      where: {
        id: options.cursor,
        organizationId: session.user.organizationId
      },
      select: { createdAt: true }
    });
    cursorCreatedAt = cursorRow?.createdAt;
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(options.eventType ? { eventType: options.eventType } : {}),
      ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {})
    },
    orderBy: { createdAt: SortDirection.Desc },
    take: limit,
    select: {
      id: true,
      eventType: true,
      actorType: true,
      actorId: true,
      actorEmail: true,
      ipAddress: true,
      resourceType: true,
      resourceId: true,
      beforeState: true,
      afterState: true,
      metadata: true,
      createdAt: true
    }
  });

  return logs.map(toAuditLogDto);
}

/**
 * Fetch audit logs for an organization export.
 * Caller MUST enforce workspace-owner auth before invoking.
 */
export async function getAuditLogsForExport(
  organizationId: string
): Promise<AuditLogDto[]> {
  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: SortDirection.Desc },
    take: 10_000,
    select: {
      id: true,
      eventType: true,
      actorType: true,
      actorId: true,
      actorEmail: true,
      ipAddress: true,
      resourceType: true,
      resourceId: true,
      beforeState: true,
      afterState: true,
      metadata: true,
      createdAt: true
    }
  });

  return logs.map(toAuditLogDto);
}

function toAuditLogDto(log: {
  id: string;
  eventType: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  resourceType: string | null;
  resourceId: string | null;
  beforeState: unknown;
  afterState: unknown;
  metadata: unknown;
  createdAt: Date;
}): AuditLogDto {
  return {
    id: log.id,
    eventType: log.eventType,
    eventLabel: isAuditEvent(log.eventType)
      ? AUDIT_EVENT_LABELS[log.eventType]
      : log.eventType,
    actorType: log.actorType === AuditActorType.SYSTEM ? 'system' : 'user',
    actorId: log.actorId ?? undefined,
    actorEmail: log.actorEmail ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    resourceType: log.resourceType ?? undefined,
    resourceId: log.resourceId ?? undefined,
    beforeState: log.beforeState ?? undefined,
    afterState: log.afterState ?? undefined,
    metadata: log.metadata ?? undefined,
    createdAt: log.createdAt
  };
}
