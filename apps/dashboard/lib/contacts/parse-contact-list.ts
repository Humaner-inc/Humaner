export type ParsedContactRow = {
  email: string;
  name?: string;
  company?: string;
  role?: string;
  industry?: string;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/**
 * Parse CSV, markdown tables/lists, or plain email lines into contact rows.
 */
export function parseContactListText(raw: string): ParsedContactRow[] {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) return [];

  const mdTable = parseMarkdownTable(text);
  if (mdTable.length > 0) return mdTable;

  const csv = parseCsv(text);
  if (csv.length > 0) return csv;

  return parseLooseLines(text);
}

function parseMarkdownTable(text: string): ParsedContactRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (lines.length < 2) return [];

  const splitRow = (line: string) =>
    line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
  const isSep = (line: string) => /^\|[\s:|-]+\|$/.test(line);
  const start = isSep(lines[1]) ? 2 : 1;
  if (start >= lines.length) return [];

  const emailIdx = headers.findIndex(
    (h) => h === 'email' || h === 'e-mail' || h.includes('mail')
  );
  const nameIdx = headers.findIndex(
    (h) => h === 'name' || h === 'full_name' || h === 'fullname'
  );
  const companyIdx = headers.findIndex(
    (h) => h === 'company' || h === 'organization' || h === 'org'
  );
  const roleIdx = headers.findIndex(
    (h) =>
      h === 'role' || h === 'title' || h === 'position' || h === 'job_title'
  );
  const industryIdx = headers.findIndex(
    (h) => h === 'industry' || h === 'sector'
  );

  const rows: ParsedContactRow[] = [];
  for (let i = start; i < lines.length; i++) {
    if (isSep(lines[i])) continue;
    const cols = splitRow(lines[i]);
    const emailCell =
      emailIdx >= 0 ? cols[emailIdx] : cols.find((c) => EMAIL_RE.test(c));
    const email = emailCell?.match(EMAIL_RE)?.[0]?.toLowerCase();
    if (!email) continue;
    rows.push({
      email,
      name: nameIdx >= 0 ? cols[nameIdx] || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx] || undefined : undefined,
      role: roleIdx >= 0 ? cols[roleIdx] || undefined : undefined,
      industry: industryIdx >= 0 ? cols[industryIdx] || undefined : undefined
    });
  }
  return rows;
}

function parseCsv(text: string): ParsedContactRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines[0].includes(',')) return [];

  const headers = lines[0]
    .toLowerCase()
    .split(',')
    .map((h) => h.trim());
  const emailIdx = headers.findIndex(
    (h) => h === 'email' || h === 'e-mail' || h.includes('mail')
  );
  if (emailIdx < 0) return [];

  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
  const nameIdx = idx(['name', 'full_name', 'fullname']);
  const companyIdx = idx(['company', 'organization', 'org']);
  const roleIdx = idx(['role', 'title', 'job_title', 'position']);
  const industryIdx = idx(['industry', 'sector']);

  const rows: ParsedContactRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const email = cols[emailIdx]?.match(EMAIL_RE)?.[0]?.toLowerCase();
    if (!email) continue;
    rows.push({
      email,
      name: nameIdx >= 0 ? cols[nameIdx] || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx] || undefined : undefined,
      role: roleIdx >= 0 ? cols[roleIdx] || undefined : undefined,
      industry: industryIdx >= 0 ? cols[industryIdx] || undefined : undefined
    });
  }
  return rows;
}

function parseLooseLines(text: string): ParsedContactRow[] {
  const rows: ParsedContactRow[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
    if (angle) {
      const email = angle[2].match(EMAIL_RE)?.[0]?.toLowerCase();
      if (email && !seen.has(email)) {
        seen.add(email);
        rows.push({ email, name: angle[1].replace(/[*_`]/g, '').trim() });
      }
      continue;
    }

    const email = trimmed.match(EMAIL_RE)?.[0]?.toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const before = trimmed
      .slice(0, trimmed.indexOf(email))
      .replace(/[<(,\-–—|]+$/g, '')
      .trim();
    rows.push({
      email,
      name: before.replace(/[*_`]/g, '').trim() || undefined
    });
  }
  return rows;
}
