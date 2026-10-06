// uid fallback id includes folder and uidvalidity
const SCOPED_FALLBACK_RE = /^imap:([0-9a-f-]{36}):([^:]+):(\d+):(\d+)$/i;

// older rows are `connectionId:uid`
const LEGACY_FALLBACK_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d+)$/i;

export function imapFolderUidPrefix(
  connectionId: string,
  folderPath: string
): string {
  return `imap:${connectionId}:${encodeURIComponent(folderPath)}:`;
}

export function imapFallbackMessageId(
  connectionId: string,
  folderPath: string,
  uidValidity: number,
  uid: number
): string {
  return `${imapFolderUidPrefix(connectionId, folderPath)}${uidValidity}:${uid}`.slice(
    0,
    512
  );
}

// uid when the id was minted from an imap uid
export function imapFallbackUid(
  providerMessageId: string,
  connectionId: string
): number | null {
  const scoped = SCOPED_FALLBACK_RE.exec(providerMessageId);
  if (scoped && scoped[1].toLowerCase() === connectionId.toLowerCase()) {
    return Number(scoped[4]);
  }

  const legacy = LEGACY_FALLBACK_RE.exec(providerMessageId);
  if (legacy && legacy[1].toLowerCase() === connectionId.toLowerCase()) {
    return Number(legacy[2]);
  }

  return null;
}

export function isLegacyUidFallback(
  providerMessageId: string,
  connectionId: string
): boolean {
  const legacy = LEGACY_FALLBACK_RE.exec(providerMessageId);
  return (
    legacy != null && legacy[1].toLowerCase() === connectionId.toLowerCase()
  );
}
