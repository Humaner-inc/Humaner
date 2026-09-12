export type MentionMember = {
  id: string;
  name: string;
};

const MENTION_TOKEN = /@([^\s@][^@]*?)(?=\s|$)/g;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function mentionQueryAt(
  value: string,
  caret: number
): {
  start: number;
  query: string;
} | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? ' ')) return null;
  const query = before.slice(at + 1);
  if (query.includes('\n')) return null;
  return { start: at, query };
}

export function insertMention(
  value: string,
  caret: number,
  name: string
): { value: string; caret: number } {
  const mention = mentionQueryAt(value, caret);
  if (!mention) {
    const next = `${value}${value && !value.endsWith(' ') ? ' ' : ''}@${name} `;
    return { value: next, caret: next.length };
  }
  const next = `${value.slice(0, mention.start)}@${name} ${value.slice(caret)}`;
  const nextCaret = mention.start + name.length + 2;
  return { value: next, caret: nextCaret };
}

export function filterMentionMembers(
  members: MentionMember[],
  query: string
): MentionMember[] {
  const needle = normalize(query);
  return members.filter((member) => {
    const name = normalize(member.name);
    if (!needle) return true;
    if (name.includes(needle)) return true;
    return name.split(' ').some((part) => part.startsWith(needle));
  });
}

export function resolveMentionedUserIds(
  body: string,
  members: MentionMember[]
): string[] {
  const tokens = [...body.matchAll(MENTION_TOKEN)].map((match) =>
    normalize(match[1] ?? '')
  );
  if (tokens.length === 0) return [];

  const ids = new Set<string>();
  for (const member of members) {
    const name = normalize(member.name);
    const first = name.split(' ')[0] ?? name;
    if (tokens.some((token) => token === name || token === first)) {
      ids.add(member.id);
    }
  }
  return [...ids];
}
