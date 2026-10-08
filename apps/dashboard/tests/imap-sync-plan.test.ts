import { describe, expect, it } from 'vitest';

import {
  selectAttachmentParts,
  selectTextParts,
  textPartsExceedCap,
  type ImapBodyNode
} from '@/lib/inbox/imap-body-parts';
import {
  bootstrapSequencePages,
  expungedUids,
  imapScopedThreadId,
  readModseq,
  storedUidsMatchServer
} from '@/lib/inbox/imap-sync-plan';

const mixed: ImapBodyNode = {
  type: 'multipart/mixed',
  childNodes: [
    {
      type: 'multipart/alternative',
      childNodes: [
        { part: '1.1', type: 'text/plain', size: 20 },
        { part: '1.2', type: 'text/html', size: 80 }
      ]
    },
    {
      part: '2',
      type: 'application/pdf',
      size: 9_000_000,
      disposition: 'attachment',
      dispositionParameters: { filename: 'invoice.pdf' }
    }
  ]
};

describe('imap body parts', () => {
  it('keeps text and html and records the attachment without its bytes', () => {
    expect(selectTextParts(mixed)).toEqual([
      {
        part: '1.1',
        type: 'text/plain',
        size: 20,
        encoding: undefined,
        charset: undefined
      },
      {
        part: '1.2',
        type: 'text/html',
        size: 80,
        encoding: undefined,
        charset: undefined
      }
    ]);
    expect(selectAttachmentParts(mixed)).toEqual([
      {
        part: '2',
        filename: 'invoice.pdf',
        mediaType: 'application/pdf',
        sizeBytes: 9_000_000
      }
    ]);
    expect(textPartsExceedCap(selectTextParts(mixed), 50)).toBe(true);
    expect(textPartsExceedCap(selectTextParts(mixed), 5_000_000)).toBe(false);
  });
});

describe('imap sync plan', () => {
  it('scopes a thread id by folder so Inbox and Sent stay separate', () => {
    const inbox = imapScopedThreadId('INBOX', '<Root@Example.com>');
    const sent = imapScopedThreadId('Sent', '<Root@Example.com>');
    expect(inbox).not.toBe(sent);
    expect(inbox).toContain('root@example.com');
  });

  it('pages a validity rebuild back through the stored history', () => {
    expect(bootstrapSequencePages(250, 150, 100)).toEqual([
      '101:150',
      '151:250'
    ]);
    expect(bootstrapSequencePages(40, 100, 100)).toEqual(['1:40']);
    expect(bootstrapSequencePages(0, 100, 100)).toEqual([]);
  });

  it('reports stored UIDs the server no longer lists', () => {
    expect(expungedUids([1, 2, 5], new Set([2, 5, 9]))).toEqual([1]);
  });

  it('reads a CONDSTORE modseq stored as a string', () => {
    expect(readModseq('42')).toBe(42n);
    expect(readModseq('')).toBeNull();
  });
});

describe('storedUidsMatchServer', () => {
  const base = { lastUid: 100, serverUids: [10, 20, 30, 40, 101] };

  it('matches when every stored uid is still on the server', () => {
    expect(
      storedUidsMatchServer({
        ...base,
        storedCount: 4,
        storedSum: 100,
        storedMin: 10
      })
    ).toBe(true);
  });

  it('ignores server uids above the last synced uid', () => {
    expect(
      storedUidsMatchServer({
        ...base,
        storedCount: 4,
        storedSum: 100,
        storedMin: 10
      })
    ).toBe(true);
  });

  it('detects a deleted message (server has fewer than stored)', () => {
    expect(
      storedUidsMatchServer({
        lastUid: 100,
        serverUids: [10, 20, 40],
        storedCount: 4,
        storedSum: 100,
        storedMin: 10
      })
    ).toBe(false);
  });

  it('falls back to the exact diff when the server holds unstored uids', () => {
    expect(
      storedUidsMatchServer({
        lastUid: 100,
        serverUids: [10, 20, 30, 40, 50],
        storedCount: 4,
        storedSum: 100,
        storedMin: 10
      })
    ).toBe(false);
  });

  it('treats an empty store as matching', () => {
    expect(
      storedUidsMatchServer({
        ...base,
        storedCount: 0,
        storedSum: 0,
        storedMin: null
      })
    ).toBe(true);
  });
});
