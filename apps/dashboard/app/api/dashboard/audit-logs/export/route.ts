import { NextResponse, type NextRequest } from 'next/server';

import { getAuditLogsForExport } from '@/data/audit-logs/get-audit-logs';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { requireWorkspaceOwner } from '@/lib/auth/workspace-permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Owner-only audit log export (GDPR access). POST avoids CSRF via top-level GET.
 * Body (optional JSON): `{ "format": "json" | "csv" }` — default json.
 * Query `?format=` is also accepted for the settings UI fetch helper.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireWorkspaceOwner(session.user.id, session.user.organizationId);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const format = await resolveFormat(request);
  const logs = await getAuditLogsForExport(session.user.organizationId);

  await recordAuditEvent({
    organizationId: session.user.organizationId,
    eventType: 'audit.exported',
    actorId: session.user.id,
    actorEmail: session.user.email,
    resourceType: 'audit_log',
    resourceId: session.user.organizationId,
    metadata: { format, count: logs.length },
    captureIp: true
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `humaner-audit-logs-${stamp}.${format}`;

  if (format === 'csv') {
    return new NextResponse(toCsv(logs), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  return new NextResponse(JSON.stringify(logs, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

async function resolveFormat(request: NextRequest): Promise<'json' | 'csv'> {
  const fromQuery = request.nextUrl.searchParams.get('format');
  if (fromQuery === 'csv' || fromQuery === 'json') {
    return fromQuery;
  }

  try {
    const body = (await request.json()) as { format?: string };
    if (body.format === 'csv') {
      return 'csv';
    }
  } catch {
    // empty / non-JSON body — default json
  }

  return 'json';
}

function toCsv(
  logs: Awaited<ReturnType<typeof getAuditLogsForExport>>
): string {
  const header = [
    'id',
    'createdAt',
    'eventType',
    'eventLabel',
    'actorType',
    'actorId',
    'actorEmail',
    'ipAddress',
    'resourceType',
    'resourceId',
    'beforeState',
    'afterState',
    'metadata'
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.createdAt.toISOString(),
      log.eventType,
      log.eventLabel,
      log.actorType,
      log.actorId ?? '',
      log.actorEmail ?? '',
      log.ipAddress ?? '',
      log.resourceType ?? '',
      log.resourceId ?? '',
      jsonCell(log.beforeState),
      jsonCell(log.afterState),
      jsonCell(log.metadata)
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [header.join(','), ...rows].join('\n');
}

function jsonCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return JSON.stringify(value);
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
