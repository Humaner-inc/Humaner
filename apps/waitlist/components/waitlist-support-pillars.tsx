'use client';

import { useId } from 'react';

import {
  Brain,
  Database,
  HeadsetIcon,
  Layers,
  UsersIcon,
  type LucideIcon
} from '@humaner/shared/icons';

import { cn } from '@/lib/utils';

type PillarId =
  | 'agent-characters'
  | 'live-knowledge'
  | 'cross-session-memory'
  | 'human-desk'
  | 'mult-org';

type PlatformPillar = {
  id: PillarId;
  title: string;
  tagline: string;
  icon: LucideIcon;
};

const pillarGradients: Record<
  PillarId,
  { from: string; to: string; glow: string }
> = {
  'agent-characters': {
    from: '#faf6f4',
    to: '#6b2d3a',
    glow: 'rgb(107 45 58 / 0.24)'
  },
  'live-knowledge': {
    from: '#faf6f4',
    to: '#dc143c',
    glow: 'rgb(220 20 60 / 0.22)'
  },
  'cross-session-memory': {
    from: '#f5f0f2',
    to: '#6b2d3a',
    glow: 'rgb(107 45 58 / 0.24)'
  },
  'human-desk': {
    from: '#f7f7f7',
    to: '#b83a4f',
    glow: 'rgb(184 58 79 / 0.2)'
  },
  'mult-org': {
    from: '#ece8e4',
    to: '#8b3a48',
    glow: 'rgb(139 58 72 / 0.2)'
  }
};

const platformPillars: PlatformPillar[] = [
  {
    id: 'agent-characters',
    title: 'Unique Agents',
    tagline: 'That genuinely feel humans.',
    icon: UsersIcon
  },
  {
    id: 'live-knowledge',
    title: 'Auto-train',
    tagline: "Train on human support to learn.",
    icon: Database
  },
  {
    id: 'cross-session-memory',
    title: 'Memory',
    tagline: 'Remember your customers.',
    icon: Brain
  },
  {
    id: 'human-desk',
    title: 'Human Desk',
    tagline: 'Escalation, tickets, and live support.',
    icon: HeadsetIcon
  },
  {
    id: 'mult-org',
    title: 'Multi-Org',
    tagline: 'Manage multiple businesses.',
    icon: Layers
  }
];

export function WaitlistFeaturePillars({
  active
}: {
  active: boolean;
}): React.JSX.Element {
  return (
    <div className="mt-12 grid grid-cols-1 gap-10 sm:mt-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-5 xl:gap-x-5">
      {platformPillars.map((pillar) => (
        <PlatformPillarCard key={pillar.id} pillar={pillar} dimmed={!active} />
      ))}
    </div>
  );
}

type WaitlistSupportPillarsProps = {
  active: boolean;
  visible: boolean;
};

export function WaitlistSupportPillars({
  active,
  visible
}: WaitlistSupportPillarsProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl px-2 text-center transition-all duration-700 ease-out sm:px-4',
        visible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-[6px]'
      )}
    >
      <h2
        className={cn(
          'section-headline',
          active ? 'story-sentence' : 'story-sentence--muted'
        )}
      >
        To be remembered.
      </h2>

      <WaitlistFeaturePillars active={active} />
    </div>
  );
}

function PlatformPillarCard({
  pillar,
  dimmed
}: {
  pillar: PlatformPillar;
  dimmed: boolean;
}): React.JSX.Element {
  return (
    <article
      className={cn(
        'flex flex-col items-center text-center transition-opacity duration-500',
        dimmed && 'opacity-55'
      )}
    >
      <PillarIcon id={pillar.id} icon={pillar.icon} />
      <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-[#fff8f2] sm:text-xl">
        {pillar.title}
      </h3>
      <p className="mt-2.5 max-w-[15rem] text-sm leading-relaxed text-white/55 sm:max-w-[11rem] sm:text-[0.9375rem]">
        {pillar.tagline}
      </p>
    </article>
  );
}

function PillarIcon({
  id,
  icon: Icon
}: {
  id: PillarId;
  icon: LucideIcon;
}): React.JSX.Element {
  const reactId = useId();
  const gradId = `waitlist-pillar-grad-${id}${reactId.replace(/:/g, '')}`;
  const tone = pillarGradients[id];

  return (
    <div className="relative inline-flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-[1.35rem] opacity-70 blur-2xl"
        style={{
          background: `radial-gradient(circle, ${tone.glow}, transparent 72%)`
        }}
      />

      <div
        className={cn(
          'relative flex size-12 items-center justify-center overflow-hidden rounded-2xl',
          'border border-white/[0.12] bg-[#101010]',
          'shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),0_22px_50px_-26px_rgb(0_0_0_/_0.85)]'
        )}
        aria-hidden
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.09),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[1px] rounded-[0.9rem] border border-white/[0.04]"
        />

        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={tone.from} />
              <stop offset="52%" stopColor={tone.from} stopOpacity="0.94" />
              <stop offset="100%" stopColor={tone.to} />
            </linearGradient>
          </defs>
        </svg>

        <Icon
          size={22}
          strokeWidth={1.25}
          color={`url(#${gradId})`}
          className="relative z-[1]"
        />
      </div>
    </div>
  );
}
