/**
 * Contact group palette — clear hue steps, still restrained (not neon).
 * Ids stay stable for stored group.color values.
 */
export const CONTACT_GROUP_COLORS = [
  {
    id: 'sky',
    label: 'Cobalt',
    card: 'border-[#001afc]/35 bg-[#001afc]/[0.10]',
    accent: 'bg-[#001afc]',
    soft: 'bg-[#001afc]/15',
    ring: 'ring-[#001afc]/40'
  },
  {
    id: 'violet',
    label: 'Indigo',
    card: 'border-indigo-500/30 bg-indigo-500/[0.10]',
    accent: 'bg-indigo-500',
    soft: 'bg-indigo-500/15',
    ring: 'ring-indigo-500/35'
  },
  {
    id: 'amber',
    label: 'Ember',
    card: 'border-[#f85919]/35 bg-[#f85919]/[0.10]',
    accent: 'bg-[#f85919]',
    soft: 'bg-[#f85919]/15',
    ring: 'ring-[#f85919]/40'
  },
  {
    id: 'teal',
    label: 'Teal',
    card: 'border-teal-600/30 bg-teal-600/[0.10]',
    accent: 'bg-teal-600',
    soft: 'bg-teal-600/15',
    ring: 'ring-teal-600/35'
  },
  {
    id: 'rose',
    label: 'Rose',
    card: 'border-rose-500/30 bg-rose-500/[0.10]',
    accent: 'bg-rose-500',
    soft: 'bg-rose-500/15',
    ring: 'ring-rose-500/35'
  },
  {
    id: 'lime',
    label: 'Sage',
    card: 'border-emerald-600/30 bg-emerald-600/[0.10]',
    accent: 'bg-emerald-600',
    soft: 'bg-emerald-600/15',
    ring: 'ring-emerald-600/35'
  }
] as const;

export type ContactGroupColorId = (typeof CONTACT_GROUP_COLORS)[number]['id'];

/** Selected color plus up to two neighbors for the stacked showcase. */
export function colorShowcaseStack(
  selectedId: string | null | undefined
): ContactGroupColorId[] {
  const idx = Math.max(
    0,
    CONTACT_GROUP_COLORS.findIndex((c) => c.id === selectedId)
  );
  const a = CONTACT_GROUP_COLORS[idx]?.id ?? 'sky';
  const b =
    CONTACT_GROUP_COLORS[(idx + 1) % CONTACT_GROUP_COLORS.length]?.id ?? a;
  const c =
    CONTACT_GROUP_COLORS[(idx + 2) % CONTACT_GROUP_COLORS.length]?.id ?? a;
  return [a, b, c];
}

export function contactGroupColor(
  id: string | null | undefined
): (typeof CONTACT_GROUP_COLORS)[number] {
  return (
    CONTACT_GROUP_COLORS.find((c) => c.id === id) ?? CONTACT_GROUP_COLORS[0]
  );
}

export function nextGroupColor(index: number): ContactGroupColorId {
  return CONTACT_GROUP_COLORS[index % CONTACT_GROUP_COLORS.length].id;
}
