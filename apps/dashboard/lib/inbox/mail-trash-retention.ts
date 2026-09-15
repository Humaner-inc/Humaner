export const MAIL_TRASH_RETENTIONS = ['WEEK', 'MONTH', 'THREE_MONTHS'] as const;

export type MailTrashRetentionValue = (typeof MAIL_TRASH_RETENTIONS)[number];

export const DEFAULT_MAIL_TRASH_RETENTION: MailTrashRetentionValue =
  'THREE_MONTHS';

export const MAIL_TRASH_RETENTION_DAYS: Record<
  MailTrashRetentionValue,
  number
> = {
  WEEK: 7,
  MONTH: 30,
  THREE_MONTHS: 90
};

export const MAIL_TRASH_RETENTION_OPTIONS: Array<{
  value: MailTrashRetentionValue;
  label: string;
}> = [
  { value: 'WEEK', label: '1 week' },
  { value: 'MONTH', label: '1 month' },
  { value: 'THREE_MONTHS', label: '3 months' }
];

export function isMailTrashRetention(
  value: string | null | undefined
): value is MailTrashRetentionValue {
  return value === 'WEEK' || value === 'MONTH' || value === 'THREE_MONTHS';
}

export function mailTrashRetentionDays(
  retention: MailTrashRetentionValue
): number {
  return MAIL_TRASH_RETENTION_DAYS[retention];
}

export function parseMailTrashRetention(
  value: string | null | undefined
): MailTrashRetentionValue {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_');
  return isMailTrashRetention(normalized)
    ? normalized
    : DEFAULT_MAIL_TRASH_RETENTION;
}
