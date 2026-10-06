import { describe, expect, it } from 'vitest';

import {
  imapFallbackMessageId,
  imapFallbackUid,
  imapFolderUidPrefix,
  isLegacyUidFallback
} from '@/lib/inbox/imap-fallback-id';

const CONNECTION = '11111111-1111-4111-8111-111111111111';

describe('imap fallback ids', () => {
  it('includes folder and UIDVALIDITY so a validity change cannot reuse a UID', () => {
    const first = imapFallbackMessageId(CONNECTION, 'INBOX', 10, 5);
    const nextEpoch = imapFallbackMessageId(CONNECTION, 'INBOX', 11, 5);
    const otherFolder = imapFallbackMessageId(CONNECTION, 'Junk', 10, 5);

    expect(first).not.toBe(nextEpoch);
    expect(first).not.toBe(otherFolder);
    expect(imapFallbackUid(first, CONNECTION)).toBe(5);
    expect(imapFallbackUid(nextEpoch, CONNECTION)).toBe(5);
    expect(first.startsWith(imapFolderUidPrefix(CONNECTION, 'INBOX'))).toBe(
      true
    );
  });

  it('still reads the legacy connectionId:uid form', () => {
    const legacy = `${CONNECTION}:42`;
    expect(imapFallbackUid(legacy, CONNECTION)).toBe(42);
    expect(isLegacyUidFallback(legacy, CONNECTION)).toBe(true);
    expect(imapFallbackUid('<mail@example.com>', CONNECTION)).toBeNull();
  });
});
