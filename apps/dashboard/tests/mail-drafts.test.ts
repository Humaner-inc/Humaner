import { describe, expect, it } from 'vitest';

import {
  composeDraftFormSubject,
  composeDraftHasContent,
  composeDraftTitle,
  EMPTY_DRAFT_SUBJECT
} from '@/lib/inbox/compose-draft';
import { mailThreadListWhere } from '@/lib/inbox/mail-thread-folder-shared';
import { saveMailDraftSchema } from '@/schemas/inbox/save-mail-draft-schema';

describe('compose draft helpers', () => {
  it('titles empty subjects for storage', () => {
    expect(composeDraftTitle('')).toBe(EMPTY_DRAFT_SUBJECT);
    expect(composeDraftTitle('  Hello  ')).toBe('Hello');
    expect(composeDraftFormSubject(EMPTY_DRAFT_SUBJECT)).toBe('');
    expect(composeDraftFormSubject('Hello')).toBe('Hello');
  });

  it('requires at least one field before saving', () => {
    expect(composeDraftHasContent({ to: '', subject: '', body: '' })).toBe(
      false
    );
    expect(
      composeDraftHasContent({ to: 'a@b.com', subject: '', body: '' })
    ).toBe(true);
  });
});

describe('mailThreadListWhere', () => {
  it('lists only unarchived drafts', () => {
    expect(mailThreadListWhere('drafts')).toEqual({
      folder: 'DRAFT',
      archivedAt: null
    });
  });

  it('keeps drafts out of inbox and sent', () => {
    expect(mailThreadListWhere('inbox')).toEqual({
      folder: 'INBOX',
      archivedAt: null
    });
    expect(mailThreadListWhere('sent')).toEqual({
      folder: 'SENT',
      archivedAt: null
    });
  });
});

describe('saveMailDraftSchema', () => {
  it('accepts an incomplete recipient while drafting', () => {
    const parsed = saveMailDraftSchema.parse({
      aliasId: '11111111-1111-1111-1111-111111111111',
      to: 'alex',
      subject: 'Follow up',
      body: ''
    });
    expect(parsed.to).toBe('alex');
  });

  it('rejects an empty draft', () => {
    const result = saveMailDraftSchema.safeParse({
      aliasId: '11111111-1111-1111-1111-111111111111',
      to: '',
      subject: '',
      body: ''
    });
    expect(result.success).toBe(false);
  });
});
