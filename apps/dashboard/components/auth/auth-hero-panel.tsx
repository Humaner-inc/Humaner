'use client';

import * as React from 'react';
import { CompanionMark } from '@humaner/shared/companion-icon';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { motion, useReducedMotion } from 'motion/react';

import { useAuthTheme } from '@/components/auth/auth-theme-context';
import { cn } from '@/lib/utils';

const TILE = {
  fg: '#F2F2F2',
  cobalt: '#001afc',
  orange: '#f85919',
  ink: '#0A0D0D',
  frame: '#18181b'
} as const;

type FeatureGlyph = React.ComponentType<{
  className?: string;
  weight?: 'regular' | 'fill';
  'aria-hidden'?: boolean;
}>;

type TileTone = 'cream' | 'ink' | 'cobalt' | 'orange';

type FeatureTile = {
  id: string;
  label: string;
  icon?: FeatureGlyph;
  companion?: boolean;
  tone: TileTone;
};

const FEATURE_TILES: FeatureTile[] = [
  { id: 'inbox', label: 'Inbox', icon: Tray, tone: 'cream' },
  { id: 'companion', label: 'Companion', companion: true, tone: 'cobalt' },
  { id: 'calendar', label: 'Calendar', icon: CalendarBlank, tone: 'ink' },
  { id: 'resources', label: 'Resources', icon: Books, tone: 'cream' },
  { id: 'team', label: 'Team', icon: Users, tone: 'orange' },
  { id: 'connect', label: 'Connect', icon: Plugs, tone: 'ink' }
];

const TILE_COUNT = FEATURE_TILES.length;
const STEP_MS = 2400;
const LIGHT_EASE = [0.22, 1, 0.36, 1] as const;

type WheelPos =
  | 'front'
  | 'above'
  | 'below'
  | 'far-above'
  | 'far-below'
  | 'hidden';

function wheelPos(itemIndex: number, activeIndex: number): WheelPos {
  const delta = (itemIndex - activeIndex + TILE_COUNT) % TILE_COUNT;
  if (delta === 0) return 'front';
  if (delta === 1) return 'below';
  if (delta === 2 || delta === 3) return 'far-below';
  if (delta === TILE_COUNT - 1) return 'above';
  if (delta === TILE_COUNT - 2) return 'far-above';
  return 'hidden';
}

function toneColors(
  tone: TileTone,
  inverted: boolean
): { fill: string; ink: string } {
  const cream = inverted
    ? { fill: TILE.ink, ink: TILE.fg }
    : { fill: TILE.fg, ink: TILE.ink };
  const ink = inverted
    ? { fill: TILE.fg, ink: TILE.ink }
    : { fill: TILE.frame, ink: TILE.fg };

  if (tone === 'cream') return cream;
  if (tone === 'ink') return ink;
  if (tone === 'cobalt') return { fill: TILE.cobalt, ink: TILE.fg };
  return { fill: TILE.orange, ink: TILE.fg };
}

export function AuthHeroPanel(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { isInverted } = useAuthTheme();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, STEP_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const activeIndex = ((index % TILE_COUNT) + TILE_COUNT) % TILE_COUNT;
  const labelColor = isInverted ? TILE.ink : TILE.fg;
  const labelGlow = isInverted
    ? '0 0 28px rgb(10 13 13 / 0.28)'
    : '0 0 32px rgb(242 242 242 / 0.35)';

  return (
    <div
      className="auth-hero-panel"
      aria-hidden
    >
      <div className="auth-hero-cluster">
        <div className="auth-hero-wheel">
          {FEATURE_TILES.map((item, itemIndex) => {
            const pos = reducedMotion
              ? itemIndex === activeIndex
                ? 'front'
                : 'hidden'
              : wheelPos(itemIndex, activeIndex);

            return (
              <div
                key={item.id}
                className="auth-hero-wheel__slot"
                data-pos={pos}
              >
                <FeatureTileView
                  item={item}
                  inverted={isInverted}
                  front={pos === 'front'}
                />
              </div>
            );
          })}
        </div>

        <div className="auth-hero-feature">
          {FEATURE_TILES.map((item, itemIndex) => {
            const isFront = itemIndex === activeIndex;

            return (
              <motion.p
                key={item.id}
                className="auth-hero-feature__label font-display text-2xl font-normal tracking-tight sm:text-3xl"
                initial={false}
                animate={
                  reducedMotion
                    ? { opacity: isFront ? 1 : 0 }
                    : isFront
                      ? {
                          opacity: 1,
                          filter: 'blur(0px) brightness(1)',
                          textShadow: '0 0 0px transparent'
                        }
                      : {
                          opacity: 0,
                          filter: 'blur(8px) brightness(1.8)',
                          textShadow: labelGlow
                        }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.48,
                  ease: LIGHT_EASE
                }}
                style={{ color: labelColor }}
              >
                {item.label}
              </motion.p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureTileView({
  item,
  inverted,
  front
}: {
  item: FeatureTile;
  inverted: boolean;
  front: boolean;
}): React.JSX.Element {
  const Icon = item.icon;
  const colors = toneColors(item.tone, inverted);

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center overflow-hidden rounded-[12px] border',
        colors.fill === TILE.fg
          ? front
            ? 'border-[#0A0D0D]/15'
            : 'border-[#0A0D0D]/10'
          : front
            ? 'border-white/15'
            : 'border-white/10'
      )}
      style={{
        backgroundColor: colors.fill,
        color: colors.ink
      }}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.16),transparent)] transition-opacity duration-500',
          front ? 'opacity-100' : 'opacity-40'
        )}
      />
      {item.companion ? (
        <CompanionMark className="relative z-10 size-9 sm:size-10" />
      ) : Icon ? (
        <Icon
          className="relative z-10 size-9 sm:size-10"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
