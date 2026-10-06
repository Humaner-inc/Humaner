import 'server-only';

import {
  buildTextOnlySource,
  headerField,
  IMAP_BODY_TOO_LARGE_TEXT,
  selectAttachmentParts,
  selectTextParts,
  textPartsExceedCap,
  type ImapAttachmentMeta,
  type ImapBodyNode,
  type ImapEnvelopeLike
} from '@/lib/inbox/imap-body-parts';
import { IMAP_SYNC_TEXT_BYTES } from '@/lib/inbox/imap-sync-plan';

type ImapClient = import('imapflow').ImapFlow;

export type FetchedImapMessage = {
  uid: number;
  flags: string[] | undefined;
  // header plus text and html only
  source: Buffer;
  bodyOmitted: boolean;
  attachments: ImapAttachmentMeta[];
};

const STRUCTURE_QUERY = {
  uid: true,
  flags: true,
  envelope: true,
  bodyStructure: true,
  size: true,
  headers: ['references']
};

function flagList(flags: Iterable<string> | undefined): string[] | undefined {
  if (!flags) return undefined;
  return [...flags];
}

// text and html for one range, maxUid includes omitted bodies
export async function fetchImapTextMessages(
  client: ImapClient,
  range: string,
  options: { uid: boolean; skipUidAtOrBelow?: number; cap?: number }
): Promise<{ messages: FetchedImapMessage[]; maxUid: number }> {
  type Pending = {
    uid: number;
    flags: string[] | undefined;
    envelope: ImapEnvelopeLike;
    references?: string;
    parts: ReturnType<typeof selectTextParts>;
    attachments: ImapAttachmentMeta[];
    bodyOmitted: boolean;
  };

  const pending: Pending[] = [];
  let maxUid = 0;
  const cap = options.cap ?? IMAP_SYNC_TEXT_BYTES;

  const iterator = options.uid
    ? client.fetch(range, STRUCTURE_QUERY, { uid: true })
    : client.fetch(range, STRUCTURE_QUERY);

  for await (const item of iterator) {
    if (typeof item.uid !== 'number') continue;
    if (item.uid > maxUid) maxUid = item.uid;
    if (
      options.skipUidAtOrBelow != null &&
      item.uid <= options.skipUidAtOrBelow
    ) {
      continue;
    }

    const structure = item.bodyStructure as ImapBodyNode | undefined;
    const attachments = selectAttachmentParts(structure);
    let parts = selectTextParts(structure);
    if (parts.length === 0 && !structure && (item.size ?? 0) <= cap) {
      parts = [{ part: '1', type: 'text/plain', size: item.size ?? 0 }];
    }

    const bodyOmitted =
      textPartsExceedCap(parts, cap) ||
      (parts.length === 0 && !structure && (item.size ?? 0) > cap);

    if (!item.envelope) {
      console.warn(
        `[imap] uid ${item.uid} has no envelope; cursor advanced without a row`
      );
      continue;
    }

    pending.push({
      uid: item.uid,
      flags: flagList(item.flags),
      envelope: item.envelope,
      references: headerField(item.headers, 'references'),
      parts: bodyOmitted ? [] : parts,
      attachments,
      bodyOmitted
    });
  }

  const bodies = new Map<number, Map<string, Buffer>>();
  const groups = new Map<string, { parts: string[]; uids: number[] }>();
  for (const message of pending) {
    if (message.bodyOmitted || message.parts.length === 0) continue;
    const parts = [...new Set(message.parts.map((part) => part.part))].sort();
    const key = parts.join('\n');
    const group = groups.get(key);
    if (group) group.uids.push(message.uid);
    else groups.set(key, { parts, uids: [message.uid] });
  }

  for (const group of groups.values()) {
    for await (const item of client.fetch(
      group.uids.join(','),
      { uid: true, bodyParts: group.parts },
      { uid: true }
    )) {
      if (typeof item.uid !== 'number' || !item.bodyParts) continue;
      const buffers = new Map<string, Buffer>();
      for (const part of group.parts) {
        const value = item.bodyParts.get(part);
        if (value?.length) buffers.set(part, value);
      }
      bodies.set(item.uid, buffers);
    }
  }

  const messages: FetchedImapMessage[] = [];
  for (const message of pending) {
    const buffers = bodies.get(message.uid);
    const text = message.parts.find((part) => part.type === 'text/plain');
    const html = message.parts.find((part) => part.type === 'text/html');
    const textRaw = text ? buffers?.get(text.part) : undefined;
    const htmlRaw = html ? buffers?.get(html.part) : undefined;
    const downloaded = (textRaw?.length ?? 0) + (htmlRaw?.length ?? 0);
    const bodyOmitted = message.bodyOmitted || downloaded > cap;

    if (bodyOmitted && !message.bodyOmitted) {
      console.warn(
        `[imap] envelope only for uid ${message.uid}: text is ${downloaded} bytes`
      );
    }

    const source = buildTextOnlySource({
      envelope: message.envelope,
      references: message.references,
      text: bodyOmitted
        ? {
            raw: Buffer.from(IMAP_BODY_TOO_LARGE_TEXT),
            charset: 'utf-8',
            encoding: '8bit'
          }
        : textRaw
          ? { raw: textRaw, charset: text?.charset, encoding: text?.encoding }
          : undefined,
      html:
        !bodyOmitted && htmlRaw
          ? { raw: htmlRaw, charset: html?.charset, encoding: html?.encoding }
          : undefined
    });

    messages.push({
      uid: message.uid,
      flags: message.flags,
      source,
      bodyOmitted,
      attachments: message.attachments
    });
  }

  return { messages, maxUid };
}

export async function listServerUids(
  client: ImapClient
): Promise<number[] | null> {
  const found = await client.search({ all: true }, { uid: true });
  if (!found) return null;
  return found;
}

export async function listFlagChanges(
  client: ImapClient,
  changedSince?: bigint
): Promise<Array<{ uid: number; unread: boolean }>> {
  const changes: Array<{ uid: number; unread: boolean }> = [];
  const options =
    changedSince != null
      ? { uid: true as const, changedSince }
      : { uid: true as const };

  for await (const item of client.fetch(
    '1:*',
    { uid: true, flags: true },
    options
  )) {
    if (typeof item.uid !== 'number') continue;
    const unread = !flagList(item.flags)?.some(
      (flag) => flag.toLowerCase() === '\\seen'
    );
    changes.push({ uid: item.uid, unread });
  }

  return changes;
}

export async function listEnvelopeMessageIds(
  client: ImapClient,
  range: string
): Promise<Array<{ uid: number; messageId: string | undefined }>> {
  const rows: Array<{ uid: number; messageId: string | undefined }> = [];
  for await (const item of client.fetch(range, {
    uid: true,
    envelope: true
  })) {
    if (typeof item.uid !== 'number') continue;
    rows.push({ uid: item.uid, messageId: item.envelope?.messageId });
  }
  return rows;
}

// one uid for the open-thread body load
export async function fetchTextSourceForUid(
  client: ImapClient,
  uid: number,
  cap: number
): Promise<FetchedImapMessage | null> {
  const fetched = await fetchImapTextMessages(client, String(uid), {
    uid: true,
    cap
  });
  return fetched.messages.find((entry) => entry.uid === uid) ?? null;
}
