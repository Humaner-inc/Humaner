export const EMPTY_DRAFT_SUBJECT = '(no subject)';

export function composeDraftTitle(subject: string): string {
  const trimmed = subject.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_DRAFT_SUBJECT;
}

export function composeDraftFormSubject(subject: string): string {
  return subject === EMPTY_DRAFT_SUBJECT ? '' : subject;
}

export function composeDraftHasContent(draft: {
  to: string;
  subject: string;
  body: string;
}): boolean {
  return (
    draft.to.trim().length > 0 ||
    draft.subject.trim().length > 0 ||
    draft.body.trim().length > 0
  );
}
