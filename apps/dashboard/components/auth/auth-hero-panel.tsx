'use client';

import * as React from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Brain } from '@phosphor-icons/react/dist/ssr/Brain';
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase';
import { ChatDotsIcon } from '@phosphor-icons/react/dist/ssr/ChatDots';
import { Code } from '@phosphor-icons/react/dist/ssr/Code';
import { Headset } from '@phosphor-icons/react/dist/ssr/Headset';
import { Plugs } from '@phosphor-icons/react/dist/ssr/Plugs';
import { Robot } from '@phosphor-icons/react/dist/ssr/Robot';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { TrayArrowDownIcon } from '@phosphor-icons/react/dist/ssr/TrayArrowDown';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { motion, useReducedMotion } from 'motion/react';

import { useOnboardingTheme } from '@/components/onboarding/onboarding-theme-context';

const TILE = {
  gray: '#e0e1df',
  cobalt: '#2252bc',
  green: '#226342',
  ink: '#0A0D0D',
  cream: '#fcf4ec'
} as const;

type FeatureGlyph = React.ComponentType<{
  className?: string;
  weight?: 'fill';
  'aria-hidden'?: boolean;
}>;

type FeatureTile = {
  id: string;
  label: string;
  icon: FeatureGlyph;
  tile: 'gray' | 'cobalt' | 'green' | 'contrast';
  ink: string;
};

const FEATURE_TILES: FeatureTile[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: TrayArrowDownIcon,
    tile: 'gray',
    ink: TILE.ink
  },
  {
    id: 'chatbot',
    label: 'Chatbot',
    icon: ChatDotsIcon,
    tile: 'cobalt',
    ink: TILE.cream
  },
  {
    id: 'helpdesk',
    label: 'Helpdesk',
    icon: Headset,
    tile: 'green',
    ink: TILE.cream
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: Brain,
    tile: 'contrast',
    ink: TILE.cream
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Briefcase,
    tile: 'gray',
    ink: TILE.ink
  },
  {
    id: 'loops',
    label: 'Loops',
    icon: ArrowsClockwise,
    tile: 'cobalt',
    ink: TILE.cream
  },
  {
    id: 'api',
    label: 'API',
    icon: Code,
    tile: 'green',
    ink: TILE.cream
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: BookOpen,
    tile: 'gray',
    ink: TILE.ink
  },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheck,
    tile: 'contrast',
    ink: TILE.cream
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: Robot,
    tile: 'green',
    ink: TILE.cream
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plugs,
    tile: 'cobalt',
    ink: TILE.cream
  },
  {
    id: 'team',
    label: 'Team',
    icon: UsersThree,
    tile: 'contrast',
    ink: TILE.cream
  }
];

const TILE_COUNT = FEATURE_TILES.length;
const STEP_ANGLE = 360 / TILE_COUNT;
const STEP_MS = 2200;

const LIGHT_EASE = [0.22, 1, 0.36, 1] as const;

/** Support-layer tiles plus product features, rotating one-by-one like a wheel. */
export function AuthHeroPanel(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const { isInverted } = useOnboardingTheme();
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
  const labelColor = isInverted ? TILE.ink : TILE.cream;
  const labelGlow = isInverted
    ? '0 0 28px rgb(10 13 13 / 0.28)'
    : '0 0 32px rgb(252 244 236 / 0.55)';

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
                <FeatureTileView
                  item={item}
                  isInverted={isInverted}
                />
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

function FeatureTileView({
  item,
  isInverted
}: {
  item: FeatureTile;
  isInverted: boolean;
}): React.JSX.Element {
  const Icon = item.icon;
  const backgroundColor =
    item.tile === 'contrast'
      ? isInverted
        ? TILE.ink
        : TILE.cream
      : TILE[item.tile];
  const color =
    item.tile === 'contrast' ? (isInverted ? TILE.cream : TILE.ink) : item.ink;

  return (
    <div
      className="flex size-20 items-center justify-center sm:size-24"
      style={{
        backgroundColor,
        color
      }}
    >
      <Icon
        weight="fill"
        className="size-10 sm:size-12"
        aria-hidden
      />
    </div>
  );
}
