import 'server-only';

import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from 'node:http';

import {
  isHubPublishAuthorized,
  verifyHubToken
} from '@/lib/realtime/hub-token';
import { registerLocalOrgEventSink } from '@/lib/realtime/org-events';
import { emitMailboxRosterChangedLocal } from '@/lib/realtime/roster-signal';
import type { OrgRealtimeEvent, ResourcePresence } from '@/lib/realtime/types';

/**
 * Realtime hub — runs inside the long-lived Railway worker.
 *
 * Producers push events in (Vercel via POST /publish, the IDLE sessions in
 * process). Browsers hold one SSE stream each. No Redis polling and no
 * serverless function held open. State is in memory, so run a single replica
 * (same constraint as IMAP IDLE).
 */
const BUFFER_SIZE = 100;
const BUFFER_TTL_MS = 5 * 60_000;
const KEEPALIVE_MS = 25_000;
const MAX_BODY_BYTES = 8_192;

type Client = { res: ServerResponse };

const clientsByOrg = new Map<string, Set<Client>>();

// Presence lives only here: no HTTP-to-Vercel, DB, or Redis per heartbeat.
// Key: org:type:resourceId -> userId -> viewer. Rebuilds within one heartbeat
// after a restart.
const PRESENCE_TTL_MS = 45_000;
const presenceByResource = new Map<string, Map<string, ResourcePresence>>();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function presenceList(key: string): ResourcePresence[] {
  const cutoff = Date.now() - PRESENCE_TTL_MS;
  return [...(presenceByResource.get(key)?.values() ?? [])].filter(
    (viewer) => viewer.at >= cutoff
  );
}

function broadcastPresence(
  organizationId: string,
  resourceId: string,
  key: string
): void {
  publishToHub(organizationId, {
    id: crypto.randomUUID(),
    type: 'presence.changed',
    resourceId,
    at: Date.now(),
    presence: presenceList(key)
  });
}
const bufferByOrg = new Map<string, OrgRealtimeEvent[]>();

function allowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  const configured = (process.env.REALTIME_HUB_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length === 0) {
    const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (app) configured.push(app.replace(/\/$/, ''));
  }
  return configured.includes(origin) ? origin : null;
}

function corsHeaders(req: IncomingMessage): Record<string, string> {
  const origin = allowedOrigin(req.headers.origin);
  return origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin'
      }
    : {};
}

function frame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function publishToHub(
  organizationId: string,
  event: OrgRealtimeEvent
): void {
  const cutoff = Date.now() - BUFFER_TTL_MS;
  const buffer = (bufferByOrg.get(organizationId) ?? []).filter(
    (item) => item.at >= cutoff
  );
  buffer.push(event);
  bufferByOrg.set(organizationId, buffer.slice(-BUFFER_SIZE));

  const clients = clientsByOrg.get(organizationId);
  if (!clients) return;
  const data = frame({ type: 'event', event });
  for (const client of clients) {
    client.res.write(data);
  }
}

function handleStream(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : (url.searchParams.get('token') ?? '');
  const claims = verifyHubToken(token);
  if (!claims) {
    res.writeHead(401, corsHeaders(req)).end();
    return;
  }

  res.writeHead(200, {
    ...corsHeaders(req),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sinceParam = Number(url.searchParams.get('since'));
  const since =
    Number.isFinite(sinceParam) && sinceParam > 0
      ? sinceParam
      : Date.now() - 5_000;

  res.write(frame({ type: 'connected', at: Date.now() }));
  for (const event of bufferByOrg.get(claims.org) ?? []) {
    if (event.at > since) res.write(frame({ type: 'event', event }));
  }

  const client: Client = { res };
  const set = clientsByOrg.get(claims.org) ?? new Set<Client>();
  set.add(client);
  clientsByOrg.set(claims.org, set);

  const keepalive = setInterval(() => {
    res.write(frame({ type: 'heartbeat', at: Date.now() }));
  }, KEEPALIVE_MS);

  req.on('close', () => {
    clearInterval(keepalive);
    set.delete(client);
    if (set.size === 0) clientsByOrg.delete(claims.org);
  });
}

function handlePresence(req: IncomingMessage, res: ServerResponse): void {
  const header = req.headers.authorization;
  const claims = header?.startsWith('Bearer ')
    ? verifyHubToken(header.slice(7))
    : null;
  if (!claims?.userId) {
    res.writeHead(401, corsHeaders(req)).end();
    return;
  }

  let size = 0;
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      res.writeHead(413, corsHeaders(req)).end();
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
        resourceType?: string;
        resourceId?: string;
      };
      if (
        (body.resourceType !== 'ticket' && body.resourceType !== 'thread') ||
        !body.resourceId ||
        !UUID.test(body.resourceId)
      ) {
        res.writeHead(400, corsHeaders(req)).end();
        return;
      }

      const key = `${claims.org}:${body.resourceType}:${body.resourceId}`;
      const viewers =
        presenceByResource.get(key) ?? new Map<string, ResourcePresence>();
      const isNew = !presenceList(key).some(
        (viewer) => viewer.userId === claims.userId
      );
      viewers.set(claims.userId!, {
        userId: claims.userId!,
        userName: claims.userName ?? '',
        at: Date.now()
      });
      presenceByResource.set(key, viewers);
      // Only a join changes what others see; plain heartbeats stay silent.
      if (isNew) broadcastPresence(claims.org, body.resourceId, key);

      res
        .writeHead(200, {
          ...corsHeaders(req),
          'Content-Type': 'application/json'
        })
        .end(JSON.stringify({ presence: presenceList(key) }));
    } catch {
      res.writeHead(400, corsHeaders(req)).end();
    }
  });
}

function sweepPresence(): void {
  const cutoff = Date.now() - PRESENCE_TTL_MS;
  for (const [key, viewers] of presenceByResource) {
    let removed = false;
    for (const [userId, viewer] of viewers) {
      if (viewer.at < cutoff) {
        viewers.delete(userId);
        removed = true;
      }
    }
    const [organizationId, , resourceId] = key.split(':');
    if (viewers.size === 0) presenceByResource.delete(key);
    if (removed && organizationId && resourceId) {
      broadcastPresence(organizationId, resourceId, key);
    }
  }
}

function handlePublish(req: IncomingMessage, res: ServerResponse): void {
  if (!isHubPublishAuthorized(req.headers.authorization)) {
    res.writeHead(401).end();
    return;
  }

  let size = 0;
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      res.writeHead(413).end();
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
        organizationId?: string;
        event?: OrgRealtimeEvent;
      };
      if (!body.organizationId || !body.event?.type) {
        res.writeHead(400).end();
        return;
      }
      publishToHub(body.organizationId, body.event);
      res.writeHead(204).end();
    } catch {
      res.writeHead(400).end();
    }
  });
}

export function startRealtimeHub(port: number): Server {
  registerLocalOrgEventSink(publishToHub);

  if (
    !process.env.REALTIME_HUB_ALLOWED_ORIGINS?.trim() &&
    !process.env.NEXT_PUBLIC_APP_URL?.trim()
  ) {
    console.warn(
      '[realtime-hub] REALTIME_HUB_ALLOWED_ORIGINS is not set; browsers will be blocked by CORS. Set it to the dashboard origin.'
    );
  }

  setInterval(sweepPresence, 15_000).unref();

  // Drop buffers for orgs with nobody connected and nothing recent.
  setInterval(() => {
    const cutoff = Date.now() - BUFFER_TTL_MS;
    for (const [org, events] of bufferByOrg) {
      if (!clientsByOrg.has(org) && (events.at(-1)?.at ?? 0) < cutoff) {
        bufferByOrg.delete(org);
      }
    }
  }, BUFFER_TTL_MS).unref();

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://hub.local');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders(req)).end();
      return;
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200).end('ok');
      return;
    }
    if (req.method === 'GET' && url.pathname === '/stream') {
      handleStream(req, res, url);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/presence') {
      handlePresence(req, res);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/roster') {
      if (!isHubPublishAuthorized(req.headers.authorization)) {
        res.writeHead(401).end();
        return;
      }
      emitMailboxRosterChangedLocal();
      res.writeHead(204).end();
      return;
    }
    if (req.method === 'POST' && url.pathname === '/publish') {
      handlePublish(req, res);
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(port, () => {
    console.log(`[realtime-hub] listening on :${port}`);
  });
  return server;
}
