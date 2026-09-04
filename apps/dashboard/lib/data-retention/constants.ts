import 'server-only';

//Self-Host (OSS) twin of `lib/data-retention/constants.ts`.

export const DEFAULT_MESSAGE_RETENTION_DAYS = 90;

//Standalone default
export const DEFAULT_MESSAGE_EMBEDDING_RETENTION_DAYS = 35;

export function getMessageRetentionDays(): number {
  const parsed = Number(process.env.MESSAGE_RETENTION_DAYS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MESSAGE_RETENTION_DAYS;
}

export function getMessageEmbeddingRetentionDays(): number {
  const parsed = Number(process.env.MESSAGE_EMBEDDING_RETENTION_DAYS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_MESSAGE_EMBEDDING_RETENTION_DAYS;
}
