import 'server-only';

import { randomUUID } from 'node:crypto';

import { prisma } from '@/lib/db/prisma';
import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { publishOrgEvent } from '@/lib/realtime/org-events';

export type ConnectorDirection = 'inbound' | 'outbound';
export type ConnectorEventStatus = 'processing' | 'ok' | 'error';

export type ConnectorEventRecord = {
  id: string;
  connector: CompanionIntegrationId;
  direction: ConnectorDirection;
  status: ConnectorEventStatus;
  kind: string;
  title: string;
  detail: string | null;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export type ConnectorSidebarSummary = {
  id: CompanionIntegrationId;
  processing: boolean;
  inbound: number;
  outbound: number;
  lastTitle: string | null;
};

type RecordEventInput = {
  organizationId: string;
  connector: CompanionIntegrationId;
  direction: ConnectorDirection;
  status?: ConnectorEventStatus;
  kind: string;
  title: string;
  detail?: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
};

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export async function recordConnectorEvent(
  input: RecordEventInput
): Promise<string> {
  const id = randomUUID();
  const status = input.status ?? 'ok';
  const finishedAt = status === 'processing' ? null : new Date();

  await prisma.$executeRaw`
    INSERT INTO "ConnectorEvent" (
      "id", "organizationId", "connector", "direction", "status",
      "kind", "title", "detail", "externalId", "externalUrl",
      "createdAt", "finishedAt"
    ) VALUES (
      ${id}::uuid, ${input.organizationId}::uuid, ${input.connector},
      ${input.direction}, ${status}, ${input.kind.slice(0, 64)},
      ${input.title.slice(0, 255)}, ${clip(input.detail, 1000)},
      ${clip(input.externalId, 255)}, ${clip(input.externalUrl, 2000)},
      NOW(), ${finishedAt}
    )
  `;

  void publishConnectorActivity(input.organizationId);
  return id;
}

async function publishConnectorActivity(organizationId: string): Promise<void> {
  await publishOrgEvent(organizationId, { type: 'connector.activity' });
}

export async function finishConnectorEvent(
  id: string,
  patch: {
    status: ConnectorEventStatus;
    title?: string;
    detail?: string | null;
    externalId?: string | null;
    externalUrl?: string | null;
  }
): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ organizationId: string }>>`
    UPDATE "ConnectorEvent"
    SET
      "status" = ${patch.status},
      "title" = COALESCE(${patch.title ? patch.title.slice(0, 255) : null}, "title"),
      "detail" = ${clip(patch.detail, 1000)},
      "externalId" = COALESCE(${clip(patch.externalId, 255)}, "externalId"),
      "externalUrl" = COALESCE(${clip(patch.externalUrl, 2000)}, "externalUrl"),
      "finishedAt" = NOW()
    WHERE "id" = ${id}::uuid
    RETURNING "organizationId"
  `;
  const organizationId = rows[0]?.organizationId;
  if (organizationId) void publishConnectorActivity(organizationId);
}

type EventRow = {
  id: string;
  connector: string;
  direction: string;
  status: string;
  kind: string;
  title: string;
  detail: string | null;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: Date;
  finishedAt: Date | null;
};

export async function listConnectorEvents(
  organizationId: string,
  connector: CompanionIntegrationId,
  limit = 40
): Promise<ConnectorEventRecord[]> {
  const take = Math.min(80, Math.max(1, limit));
  const rows = await prisma.$queryRaw<EventRow[]>`
    SELECT "id", "connector", "direction", "status", "kind", "title",
           "detail", "externalId", "externalUrl", "createdAt", "finishedAt"
    FROM "ConnectorEvent"
    WHERE "organizationId" = ${organizationId}::uuid
      AND "connector" = ${connector}
    ORDER BY "createdAt" DESC
    LIMIT ${take}
  `;

  return rows.map((row) => ({
    id: row.id,
    connector: row.connector as CompanionIntegrationId,
    direction: row.direction as ConnectorDirection,
    status: row.status as ConnectorEventStatus,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    externalId: row.externalId,
    externalUrl: row.externalUrl,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null
  }));
}

export async function listConnectorSummaries(
  organizationId: string,
  connectors: readonly CompanionIntegrationId[]
): Promise<ConnectorSidebarSummary[]> {
  if (connectors.length === 0) return [];

  const rows = await prisma.$queryRaw<
    Array<{
      connector: string;
      direction: string;
      status: string;
      title: string;
      createdAt: Date;
    }>
  >`
    SELECT "connector", "direction", "status", "title", "createdAt"
    FROM "ConnectorEvent"
    WHERE "organizationId" = ${organizationId}::uuid
      AND "createdAt" >= NOW() - INTERVAL '24 hours'
    ORDER BY "createdAt" DESC
    LIMIT 200
  `;

  return connectors.map((id) => {
    const events = rows.filter((row) => row.connector === id);
    const latest = events[0];
    return {
      id,
      processing: events.some(
        (row) =>
          row.status === 'processing' &&
          Date.now() - row.createdAt.getTime() < 2 * 60 * 1000
      ),
      inbound: events.filter((row) => row.direction === 'inbound').length,
      outbound: events.filter((row) => row.direction === 'outbound').length,
      lastTitle: latest?.title ?? null
    };
  });
}

export async function upsertThreadConnectorLink(input: {
  organizationId: string;
  threadId: string;
  connector: CompanionIntegrationId;
  externalId: string;
  identifier: string;
  title: string;
  url: string;
}): Promise<void> {
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "MailThreadConnectorLink" (
      "id", "organizationId", "threadId", "connector",
      "externalId", "identifier", "title", "url", "createdAt"
    ) VALUES (
      ${id}::uuid, ${input.organizationId}::uuid, ${input.threadId}::uuid,
      ${input.connector}, ${input.externalId.slice(0, 255)},
      ${input.identifier.slice(0, 64)}, ${input.title.slice(0, 255)},
      ${input.url.slice(0, 2000)}, NOW()
    )
    ON CONFLICT ("threadId", "connector", "externalId")
    DO UPDATE SET
      "identifier" = EXCLUDED."identifier",
      "title" = EXCLUDED."title",
      "url" = EXCLUDED."url"
  `;
}

export async function listThreadConnectorLinks(
  organizationId: string,
  threadId: string,
  connector: CompanionIntegrationId
): Promise<
  Array<{ id: string; identifier: string; title: string; url: string }>
> {
  const rows = await prisma.$queryRaw<
    Array<{
      externalId: string;
      identifier: string;
      title: string;
      url: string;
    }>
  >`
    SELECT "externalId", "identifier", "title", "url"
    FROM "MailThreadConnectorLink"
    WHERE "organizationId" = ${organizationId}::uuid
      AND "threadId" = ${threadId}::uuid
      AND "connector" = ${connector}
    ORDER BY "createdAt" DESC
  `;

  return rows.map((row) => ({
    id: row.externalId,
    identifier: row.identifier,
    title: row.title,
    url: row.url
  }));
}
