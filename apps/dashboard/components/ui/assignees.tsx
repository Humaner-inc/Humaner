import * as React from 'react';
import { UserIcon } from '@humaner/shared/icons';

import { cn, getInitials } from '@/lib/utils';

const FACE = 26;
const CORNER_MIN = 0;
const CORNER_MAX = 26;
const OVERLAP_MIN = 0;
const OVERLAP_MAX = 22;

/** Wall placeholders when `people` is omitted. */
const WALL_PEOPLE: AssigneePerson[] = [
  { id: 'wall-a', name: 'Astral' },
  { id: 'wall-b', name: 'Taleb' },
  { id: 'wall-c', name: 'Unique' },
  { id: 'wall-d', name: 'Vidi' }
];

const WALL_FACE_TONE = [
  'bg-[#c4b8a8] text-[#2a241c]',
  'bg-[#8a9aa3] text-[#14181a]',
  'bg-[#b7a08e] text-[#2a221c]',
  'bg-[#6f7d72] text-[#f4f1ea]'
] as const;

export type AssigneePerson = {
  id: string;
  name: string;
  image?: string | null;
  fallback?: React.ReactNode;
};

export function toAssigneePerson(member: {
  id: string;
  name: string;
  image?: string | null;
}): AssigneePerson {
  return {
    id: member.id,
    name: member.name,
    image: member.image ?? null
  };
}

export type AssigneesProps = {
  /* corner — 0 to 26px */
  corner?: number;
  /* a growing row, or four packed into the width of one */
  stack?: 'Row' | 'Grid';
  /* how far the faces stack over each other — 0 to 22px */
  overlap?: number;
  people?: AssigneePerson[];
  className?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function faceTone(index: number): string {
  return WALL_FACE_TONE[index % WALL_FACE_TONE.length];
}

function Face({
  person,
  size,
  corner,
  className,
  style,
  tone
}: {
  person: AssigneePerson | null;
  size: number;
  corner: number;
  className?: string;
  style?: React.CSSProperties;
  tone?: string;
}): React.JSX.Element {
  const radius = clamp(corner, CORNER_MIN, Math.min(CORNER_MAX, size / 2));
  const initials = person ? getInitials(person.name) : '';
  const fontSize = size >= 20 ? 9 : 7;

  return (
    <div
      title={person?.name}
      className={cn(
        'relative shrink-0 overflow-hidden bg-muted text-muted-foreground ring-1 ring-background',
        !person?.image && (tone ?? ''),
        className
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        ...style
      }}
    >
      {person?.image ? (
        <img
          src={person.image}
          alt=""
          className="size-full object-cover"
        />
      ) : person?.fallback ? (
        <span className="flex size-full items-center justify-center">
          {person.fallback}
        </span>
      ) : person ? (
        <span
          className="flex size-full items-center justify-center font-mono font-medium leading-none"
          style={{ fontSize }}
        >
          {initials || person.name.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <span className="flex size-full items-center justify-center">
          <UserIcon className="size-3.5" />
        </span>
      )}
    </div>
  );
}

/**
 * Stacked assignee faces. Panel settings in the app:
 * `corner={12} stack="Row" overlap={10}`.
 * Picture tiles use the 12px surface radius.
 * Omit props to get the wall defaults.
 */
export function Assignees({
  corner = 12,
  stack = 'Row',
  overlap = 8,
  people,
  className
}: AssigneesProps): React.JSX.Element {
  const radius = clamp(corner, CORNER_MIN, CORNER_MAX);
  const inset = clamp(overlap, OVERLAP_MIN, OVERLAP_MAX);
  const source = people ?? WALL_PEOPLE;
  const isGrid = stack === 'Grid';
  const shown = isGrid ? source.slice(0, 4) : source;
  const faceSize = isGrid ? (FACE + inset) / 2 : FACE;
  const step = faceSize - inset;
  const useWallTone = people === undefined;

  if (isGrid) {
    return (
      <div
        className={cn('relative isolate', className)}
        style={{ width: FACE, height: FACE }}
      >
        {shown.map((person, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          return (
            <Face
              key={person.id}
              person={person}
              size={faceSize}
              corner={radius}
              tone={useWallTone ? faceTone(index) : undefined}
              className="absolute transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-px"
              style={{
                left: col * step,
                top: row * step,
                zIndex: index + 1
              }}
            />
          );
        })}
      </div>
    );
  }

  const width =
    shown.length === 0
      ? FACE
      : FACE + Math.max(0, shown.length - 1) * (FACE - inset);

  return (
    <div
      className={cn('relative isolate', className)}
      style={{ width, height: FACE }}
    >
      {(shown.length > 0 ? shown : [null]).map((person, index) => (
        <Face
          key={person?.id ?? 'empty'}
          person={person}
          size={FACE}
          corner={radius}
          tone={person && useWallTone ? faceTone(index) : undefined}
          className="absolute top-0 transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-px"
          style={{
            left: index * (FACE - inset),
            zIndex: index + 1
          }}
        />
      ))}
    </div>
  );
}

/** Single picture-tile face — 12px radius; do not nest this inside a pill. */
export function AssigneeFace({
  person,
  size = 22,
  className
}: {
  person: AssigneePerson | null;
  size?: number;
  className?: string;
}): React.JSX.Element {
  return (
    <Face
      person={person}
      size={size}
      corner={12}
      className={cn('ring-0', className)}
    />
  );
}

/** Panel values used for assignee options in mail and tasks. */
export const ASSIGNEE_PANEL_PROPS = {
  corner: 12,
  stack: 'Row' as const,
  overlap: 10
};
