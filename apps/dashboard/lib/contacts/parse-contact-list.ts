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

/** RFC 4180-style splitter: quoted fields, escaped quotes, embedded newlines. */
function splitCsvRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endRow = () => {
    row.push(field.trim());
    field = '';
    if (row.some((c) => c !== '')) records.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      endRow();
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  endRow();
  return records;
}

function detectDelimiter(headerLine: string): string {
  const count = (d: string) => headerLine.split(d).length - 1;
  return [';', '\t'].reduce(
    (best, d) => (count(d) > count(best) ? d : best),
    ','
  );
}

function parseCsv(text: string): ParsedContactRow[] {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? '');
  const records = splitCsvRecords(text, delimiter);
  if (records.length < 2 || records[0].length < 2) return [];

  const headers = records[0].map((h) => h.toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
  let emailIdx = idx([
    'email',
    'e-mail',
    'email_address',
    'public_email',
    'contact_email'
  ]);
  if (emailIdx < 0) {
    emailIdx = headers.findIndex(
      (h) => h.includes('mail') && !h.includes('source')
    );
  }
  if (emailIdx < 0) return [];

  const nameIdx = idx(['name', 'full_name', 'fullname', 'contact_name']);
  const companyIdx = idx([
    'company',
    'organization',
    'org',
    'store',
    'store_name',
    'brand'
  ]);
  const roleIdx = idx(['role', 'title', 'job_title', 'position']);
  const industryIdx = idx(['industry', 'sector']);

  const rows: ParsedContactRow[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < records.length; i++) {
    const cols = records[i];
    const email = cols[emailIdx]?.match(EMAIL_RE)?.[0]?.toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
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
