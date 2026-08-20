export type LiveChatConfig = {
  enabled: boolean;
  timeoutMinutes?: number;
  timeoutMessage?: string;
  slaMinutes?: number | null;
};

export type SessionHandoffRecord = {
  ticketId: string;
  ticketNumber: number;
  createdAt: number;
  status?: string | null;
  liveChatTimedOut?: boolean;
  liveChat: LiveChatConfig | null;
};

const DEFAULT_LIVE_CHAT_TIMEOUT_MINUTES = 20;

/** Visitor-facing copy when the live-chat wait / SLA window elapses with no human reply. */
export const LIVE_CHAT_SLA_OVERDUE_VISITOR_MESSAGE =
  "No one from the team is actually available, we will get back to you shortly by email concerning your request.";

export function withLiveChatSlaOverdueMessage<T extends LiveChatLocalMessage>(
  prev: T[],
): T[] {
  if (
    prev.some(
      (message) =>
        message.role === "assistant" &&
        message.content === LIVE_CHAT_SLA_OVERDUE_VISITOR_MESSAGE,
    )
  ) {
    return prev;
  }
  return [
    ...prev,
    {
      role: "assistant",
      content: LIVE_CHAT_SLA_OVERDUE_VISITOR_MESSAGE,
    } as T,
  ];
}

export type LiveChatIncomingMessage = {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
};

export type LiveChatLocalMessage = {
  id?: string;
  role: "user" | "human" | "assistant";
  content: string;
  createdAt?: string;
};

function normalizeLiveChatContent(content: string): string {
  return content
    .replace(/##(?:FORK|HANDOFF)##[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Merge poll results into the local transcript without replaying the
 * pre-handoff conversation that the widget already shows.
 *
 * Live-chat polling is for team-member replies. Assistant turns already live
 * in the visitor transcript; appending them from the ticket conversation
 * duplicates the handoff history when the first poll has no `after` cursor.
 */
export function mergeLiveChatPollMessages<T extends LiveChatLocalMessage>(
  prev: T[],
  incoming: LiveChatIncomingMessage[],
): T[] {
  const seenIds = new Set(
    prev.map((message) => message.id).filter((id): id is string => Boolean(id)),
  );
  const seenContent = new Set(
    prev.map((message) => normalizeLiveChatContent(message.content)),
  );

  const extra: T[] = [];
  for (const message of incoming) {
    if (message.role !== "HUMAN") {
      continue;
    }
    const content = message.content.trim();
    if (!content) {
      continue;
    }
    if (seenIds.has(message.id)) {
      continue;
    }
    const key = normalizeLiveChatContent(content);
    if (!key || seenContent.has(key)) {
      continue;
    }
    seenIds.add(message.id);
    seenContent.add(key);
    extra.push({
      id: message.id,
      role: "human",
      content: message.content,
      ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    } as T);
  }

  return extra.length > 0 ? [...prev, ...extra] : prev;
}

export function isLiveChatWaitElapsed(
  createdAtMs: number,
  config: LiveChatConfig | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  const minutes = resolveLiveChatCountdownMinutes(config);
  if (minutes == null || minutes <= 0) {
    return false;
  }
  return nowMs >= createdAtMs + minutes * 60_000;
}

export function visitorTicketStatusLabel(
  status?: string | null,
  timedOut?: boolean,
): string {
  if (status === "RESOLVED") {
    return "Resolved";
  }
  if (status === "CLOSED") {
    return "Closed";
  }
  if (status === "IN_PROGRESS") {
    return "In progress";
  }
  if (timedOut) {
    return "Open";
  }
  return "Open";
}

export type VisitorHomeTicket = {
  sessionId: string;
  ticketRef: string;
  statusLabel: string;
  title: string;
  detail: string;
};

export function buildVisitorHomeTickets(
  conversations: Array<{ sessionId: string; title: string }>,
  loadHandoff: (sessionId: string) => SessionHandoffRecord | null,
): VisitorHomeTicket[] {
  const seen = new Set<string>();
  const tickets: VisitorHomeTicket[] = [];

  for (const conversation of conversations) {
    const record = loadHandoff(conversation.sessionId);
    if (!record || seen.has(record.ticketId)) {
      continue;
    }
    seen.add(record.ticketId);
    const resolved = record.status === "RESOLVED" || record.status === "CLOSED";
    const title = conversation.title.trim() || "Support request";
    tickets.push({
      sessionId: conversation.sessionId,
      ticketRef: `#${String(record.ticketNumber).padStart(5, "0")}`,
      statusLabel: visitorTicketStatusLabel(
        record.status,
        record.liveChatTimedOut,
      ),
      title,
      detail: resolved
        ? `The team marked this as resolved.\n\nRequest: ${title}`
        : title,
    });
  }

  return tickets;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLiveChatConfig(value: unknown): LiveChatConfig | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.enabled !== "boolean") {
    return null;
  }
  return {
    enabled: value.enabled,
    ...(typeof value.timeoutMinutes === "number"
      ? { timeoutMinutes: value.timeoutMinutes }
      : {}),
    ...(typeof value.timeoutMessage === "string"
      ? { timeoutMessage: value.timeoutMessage }
      : {}),
    ...(typeof value.slaMinutes === "number" || value.slaMinutes === null
      ? { slaMinutes: value.slaMinutes }
      : {}),
  };
}

function parseCreatedAt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

export function parseSessionHandoffRecord(
  value: unknown,
): SessionHandoffRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.ticketId !== "string" || value.ticketId.length === 0) {
    return null;
  }
  if (typeof value.ticketNumber !== "number" || value.ticketNumber < 1) {
    return null;
  }
  const createdAt = parseCreatedAt(value.createdAt);
  if (createdAt == null) {
    return null;
  }

  return {
    ticketId: value.ticketId,
    ticketNumber: value.ticketNumber,
    createdAt,
    status: typeof value.status === "string" ? value.status : null,
    liveChatTimedOut: value.liveChatTimedOut === true,
    liveChat: parseLiveChatConfig(value.liveChat),
  };
}

/** Minutes to wait for a live agent. SLA wins when it is tighter than the org timeout. */
export function resolveLiveChatWaitMinutes(config: LiveChatConfig): number {
  const fallback =
    config.timeoutMinutes != null && config.timeoutMinutes > 0
      ? config.timeoutMinutes
      : DEFAULT_LIVE_CHAT_TIMEOUT_MINUTES;
  if (!config.enabled) {
    return fallback;
  }
  if (config.slaMinutes != null && config.slaMinutes > 0) {
    return Math.min(config.slaMinutes, fallback);
  }
  return fallback;
}

/**
 * Visitor-facing countdown. Always uses the live-chat wait window from Desk
 * settings (min of org timeout and SLA) so the widget stays in sync with
 * the "20 min" timeout — not the longer escalation-policy SLA.
 */
export function resolveLiveChatCountdownMinutes(
  config: LiveChatConfig | null | undefined,
  _hasTeamMember?: boolean,
): number | null {
  if (!config?.enabled) {
    return null;
  }
  return resolveLiveChatWaitMinutes(config);
}

export function formatSlaCountdown(
  createdAtMs: number,
  slaMinutes: number | null | undefined,
): string | null {
  if (slaMinutes == null || slaMinutes <= 0) {
    return null;
  }
  const remainingMs = createdAtMs + slaMinutes * 60_000 - Date.now();
  if (remainingMs <= 0) {
    return null;
  }
  const mins = Math.max(1, Math.ceil(remainingMs / 60_000));
  if (mins < 60) {
    return `${mins}m left`;
  }
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) {
    return rem > 0 ? `${hours}h ${rem}m left` : `${hours}h left`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function isLiveChatHandoffActive(
  record: SessionHandoffRecord | null | undefined,
): boolean {
  if (!record?.ticketId || !record.liveChat?.enabled) {
    return false;
  }
  if (record.liveChatTimedOut) {
    return false;
  }
  return record.status !== "RESOLVED" && record.status !== "CLOSED";
}

export function isHandoffTicketClosed(
  record: SessionHandoffRecord | null | undefined,
): boolean {
  if (!record) {
    return false;
  }
  return record.status === "RESOLVED" || record.status === "CLOSED";
}

export function shouldReplaceVisitorTranscript(
  current: Array<{ role: string }>,
  incoming: Array<{ role: string }>,
): boolean {
  if (incoming.length === 0) {
    return false;
  }
  if (current.length === 0) {
    return true;
  }
  const currentHasHuman = current.some((message) => message.role === "human");
  const incomingHasHuman = incoming.some((message) => message.role === "human");
  if (currentHasHuman && !incomingHasHuman) {
    return false;
  }
  return incoming.length > current.length;
}

export function sessionHandoffIsSame(
  left: SessionHandoffRecord | null | undefined,
  right: SessionHandoffRecord | null | undefined,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.ticketId === right.ticketId &&
    left.ticketNumber === right.ticketNumber &&
    (left.status ?? null) === (right.status ?? null) &&
    Boolean(left.liveChatTimedOut) === Boolean(right.liveChatTimedOut) &&
    Boolean(left.liveChat?.enabled) === Boolean(right.liveChat?.enabled) &&
    (left.liveChat?.slaMinutes ?? null) ===
      (right.liveChat?.slaMinutes ?? null) &&
    (left.liveChat?.timeoutMinutes ?? null) ===
      (right.liveChat?.timeoutMinutes ?? null)
  );
}
