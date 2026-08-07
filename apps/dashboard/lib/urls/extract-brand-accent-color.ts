export const HUMANER_DEFAULT_ACCENT = '#e1ccaf';

export function getDefaultWidgetAccent(_oss?: boolean): string {
  return HUMANER_DEFAULT_ACCENT;
}

/** Product accent is always Humaner cream. */
export function resolveWidgetAccentForDeployment(
  color: string,
  _oss?: boolean
): string {
  return color;
}

type Rgb = { r: number; g: number; b: number };

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function componentToHex(value: number): string {
  return clampByte(value).toString(16).padStart(2, '0');
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function parseHexColor(raw: string): string | null {
  const value = raw.trim();
  const short = value.match(/^#([0-9a-f]{3})$/i);
  if (short?.[1]) {
    const [r, g, b] = short[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const long = value.match(/^#([0-9a-f]{6})$/i);
  if (long?.[1]) {
    return `#${long[1].toLowerCase()}`;
  }

  return null;
}

function parseRgbColor(raw: string): string | null {
  const match = raw
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) {
    return null;
  }

  return rgbToHex({
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3])
  });
}

function parseHslColor(raw: string): string | null {
  const match = raw
    .trim()
    .match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (!match) {
    return null;
  }

  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  if (s === 0) {
    const gray = clampByte(l * 255);
    return rgbToHex({ r: gray, g: gray, b: gray });
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let channel = t;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return rgbToHex({
    r: clampByte(hueToRgb(p, q, h + 1 / 3) * 255),
    g: clampByte(hueToRgb(p, q, h) * 255),
    b: clampByte(hueToRgb(p, q, h - 1 / 3) * 255)
  });
}

export function normalizeColorToHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  return (
    parseHexColor(trimmed) ??
    parseRgbColor(trimmed) ??
    parseHslColor(trimmed) ??
    null
  );
}

function hexToRgb(hex: string): Rgb | null {
  const normalized = parseHexColor(hex);
  if (!normalized) {
    return null;
  }

  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

/** Accent must work as a widget button background with white label text. */
export function isUsableBrandAccent(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return false;
  }

  const luminance = relativeLuminance(rgb);
  const sat = saturation(rgb);

  if (luminance > 0.72 || luminance < 0.08) {
    return false;
  }

  if (sat < 0.12) {
    return false;
  }

  return true;
}

function readMetaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      'i'
    )
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function readMaskIconColor(html: string): string | null {
  const tags = html.match(/<link[^>]+>/gi) ?? [];
  for (const tag of tags) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
    if (!rel.includes('mask-icon')) {
      continue;
    }
    return tag.match(/color=["']([^"']+)["']/i)?.[1]?.trim() ?? null;
  }
  return null;
}

function readCssVariableCandidates(html: string): string[] {
  const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const variableNames = [
    '--accent',
    '--brand',
    '--primary',
    '--color-primary',
    '--color-accent',
    '--theme-color',
    '--brand-color',
    '--link-color'
  ];
  const candidates: string[] = [];

  for (const block of styleBlocks) {
    const content = block.replace(/<\/?style[^>]*>/gi, '');
    for (const name of variableNames) {
      const match = content.match(
        new RegExp(
          `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;}{]+)`,
          'i'
        )
      );
      if (match?.[1]) {
        candidates.push(match[1].trim());
      }
    }
  }

  return candidates;
}

export function extractBrandAccentColor(html: string): string | null {
  const candidates = [
    readMetaContent(html, 'theme-color'),
    readMetaContent(html, 'msapplication-TileColor'),
    readMaskIconColor(html),
    ...readCssVariableCandidates(html)
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const hex = normalizeColorToHex(raw);
    if (hex && isUsableBrandAccent(hex)) {
      return hex;
    }
  }

  return null;
}
