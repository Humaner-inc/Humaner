// text part cap during background sync
export const IMAP_SYNC_TEXT_BYTES = 5 * 1024 * 1024;

// one bodystructure page
export const IMAP_FETCH_PAGE = 100;

export function imapScopedThreadId(
  folderPath: string,
  rootMessageId: string
): string {
  const root = rootMessageId.trim().replace(/^<|>$/g, '').toLowerCase();
  return `imap:${encodeURIComponent(folderPath)}:${root}`.slice(0, 512);
}

// newest `depth` messages, oldest page first
export function bootstrapSequencePages(
  messageCount: number,
  depth: number,
  pageSize: number
): string[] {
  if (messageCount <= 0 || depth <= 0 || pageSize <= 0) return [];

  const pages: string[] = [];
  let end = messageCount;
  let remaining = Math.min(depth, messageCount);

  while (remaining > 0 && end >= 1) {
    const count = Math.min(pageSize, remaining, end);
    const start = end - count + 1;
    pages.push(`${start}:${end}`);
    remaining -= count;
    end = start - 1;
  }

  return pages.reverse();
}

// stored uids missing from uid search all
export function expungedUids(
  stored: readonly number[],
  present: ReadonlySet<number>
): number[] {
  const gone: number[] = [];
  for (const uid of stored) {
    if (!present.has(uid)) gone.push(uid);
  }
  return gone;
}

export function readModseq(value: unknown): bigint | null {
  if (typeof value === 'bigint' && value >= 0n) return value;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  return null;
}
