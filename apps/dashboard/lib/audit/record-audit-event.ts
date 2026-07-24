import 'server-only';

import { headers } from 'next/headers';
import { AuditActorType, type Prisma } from '@prisma/client';

import type { AuditEvent } from '@/lib/audit/events';
import { prisma } from '@/lib/db/prisma';
import { getClientIpFromHeaders } from '@/lib/security/client-ip';

export type RecordAuditEventInput = {
  organizationId: string;
  eventType: AuditEvent;
  actorType?: AuditActorType;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  /** When true, resolve IP from the current request headers if ipAddress is omitted. */
  captureIp?: boolean;
};

/**
 * Append-only audit writer. Failures are logged and never thrown so primary
 * business actions are not blocked by audit persistence issues.
 */
export async function recordAuditEvent(
  input: RecordAuditEventInput
): Promise<void> {
  try {
    let ipAddress = input.ipAddress ?? null;
    if (input.captureIp !== false && ipAddress == null) {
      ipAddress = await resolveRequestIp();
    }

    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        eventType: input.eventType,
        actorType: input.actorType ?? AuditActorType.USER,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        ipAddress,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        beforeState: input.before ?? undefined,
        afterState: input.after ?? undefined,
        metadata: input.metadata ?? undefined
      },
      select: { id: true }
    });
  } catch (error) {
    console.error('[audit] failed to record event', input.eventType, error);
  }
}

async function resolveRequestIp(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const ip = getClientIpFromHeaders(headerStore);
    return ip === 'unknown' ? null : ip;
  } catch {
    return null;
  }
}
