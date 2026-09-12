import { resolveMentionedUserIds } from '@/lib/inbox/mentions';

const STORAGE_PREFIX = 'humaner-team-last-seen:v1:';

export type TeamUnreadItem = {
  authorId: string;
  createdAt: string;
};

export type TeamUnreadNote = TeamUnreadItem & {
  body: string;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readTeamLastSeenAt(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

export function writeTeamLastSeenAt(userId: string, iso: string): void {
  try {
    localStorage.setItem(storageKey(userId), iso);
  } catch {
    // quota / private mode
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function countUnreadTeamActivity(input: {
  userId: string;
  userName: string;
  lastSeenAt: string | null;
  messages: TeamUnreadItem[];
  notes: TeamUnreadNote[];
  now?: number;
}): number {
  const now = input.now ?? Date.now();
  const seenAt = input.lastSeenAt
    ? new Date(input.lastSeenAt).getTime()
    : Number.NaN;
  const messageFloor = Number.isNaN(seenAt) ? now - DAY_MS : seenAt;
  const noteFloor = Number.isNaN(seenAt) ? 0 : seenAt;

  const member = { id: input.userId, name: input.userName };
  let count = 0;

  for (const message of input.messages) {
    if (message.authorId === input.userId) continue;
    if (new Date(message.createdAt).getTime() > messageFloor) count += 1;
  }

  for (const note of input.notes) {
    if (note.authorId === input.userId) continue;
    if (new Date(note.createdAt).getTime() <= noteFloor) continue;
    if (resolveMentionedUserIds(note.body, [member]).includes(input.userId)) {
      count += 1;
    }
  }

  return count;
}
