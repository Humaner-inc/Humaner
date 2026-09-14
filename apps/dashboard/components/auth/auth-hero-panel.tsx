'use client';

import * as React from 'react';
import { Books } from '@phosphor-icons/react/dist/ssr/Books';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Tray } from '@phosphor-icons/react/dist/ssr/Tray';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { motion, useReducedMotion } from 'motion/react';

import { useAuthTheme } from '@/components/auth/auth-theme-context';

const TILE = {
  fg: '#F2F2F2',
  cobalt: '#001afc',
  orange: '#f85919',
  ink: '#0A0D0D',
  surface: 'rgb(242 242 242 / 0.08)'
} as const;

type FeatureGlyph = React.ComponentType<{
  className?: string;
  weight?: 'fill';
  'aria-hidden'?: boolean;
}>;

type FeatureTile = {
  id: string;
  label: string;
  icon?: FeatureGlyph;
  /** Solid fill for the brand-angle tile. */
  fill: string;
  ink: string;
};

const FEATURE_TILES: FeatureTile[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: Tray,
    fill: TILE.fg,
    ink: TILE.ink
  },
  {
    id: 'companion',
    label: 'Companion',
    fill: TILE.cobalt,
    ink: TILE.fg
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarBlank,
    fill: TILE.ink,
    ink: TILE.fg
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Books,
    fill: TILE.fg,
    ink: TILE.ink
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    fill: TILE.orange,
    ink: TILE.fg
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: Plugs,
    fill: TILE.cobalt,
    ink: TILE.fg
  }
];

const TILE_COUNT = FEATURE_TILES.length;
const STEP_ANGLE = 360 / TILE_COUNT;
const STEP_MS = 2200;

const LIGHT_EASE = [0.22, 1, 0.36, 1] as const;

/** Mailbox features, rotating one-by-one like a wheel. */
export function AuthHeroPanel(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { isInverted } = useAuthTheme();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, STEP_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const activeIndex = ((index % TILE_COUNT) + TILE_COUNT) % TILE_COUNT;
  const rotation = reducedMotion ? 0 : index * STEP_ANGLE;
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
          <div
            className="auth-hero-wheel__drum"
            style={{ transform: `rotateX(${-rotation}deg)` }}
          >
            {FEATURE_TILES.map((item, itemIndex) => (
              <div
                key={item.id}
                className={
                  itemIndex === activeIndex
                    ? 'auth-hero-wheel__slot is-front'
                    : 'auth-hero-wheel__slot'
                }
                style={{
                  transform: `rotateX(${itemIndex * STEP_ANGLE}deg) translateZ(var(--auth-wheel-radius))`
                }}
              >
                <FeatureTileView item={item} />
              </div>
            ))}
          </div>
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

function FeatureTileView({ item }: { item: FeatureTile }): React.JSX.Element {
  const Icon = item.icon;

  return (
    <div
      className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] sm:size-24"
      style={{
        backgroundColor: item.fill,
        color: item.ink
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.14),transparent)]"
      />
      {item.id === 'companion' ? (
        // eslint-disable-next-line @next/next/no-img-element -- public companion mark
        <img
          src="/companion.svg"
          alt=""
          width={48}
          height={48}
          className="relative z-10 size-10 brightness-0 invert sm:size-12"
        />
      ) : Icon ? (
        <Icon
          weight="fill"
          className="relative z-10 size-10 sm:size-12"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
