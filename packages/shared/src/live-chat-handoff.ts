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

export function formatSlaCountdown(
  createdAtMs: number,
  slaMinutes: number | null | undefined,
): string | null {
  if (slaMinutes == null || slaMinutes <= 0) {
    return null;
  }
  const remainingMs = createdAtMs + slaMinutes * 60_000 - Date.now();
  if (remainingMs <= 0) {
    return "SLA overdue";
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
  return (
    record.status === "RESOLVED" ||
    record.status === "CLOSED" ||
    Boolean(record.liveChatTimedOut)
  );
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
