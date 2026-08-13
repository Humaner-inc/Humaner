'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'motion/react';

import {
  HERO_COMPUTER_FRAME_LAYOUT,
  HERO_COMPUTER_SCREEN,
  HERO_COMPUTER_VIEWPORT_ASPECT
} from '@/lib/auth/hero-computer-screen';
import { cn } from '@/lib/utils';

const GLITCH_MS = { min: 500, max: 700 } as const;
const STATIC_MS = { min: 2400, max: 3400 } as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ScreenLogo({ className }: { className?: string }): React.JSX.Element {
  const logoSize = `${HERO_COMPUTER_SCREEN.logoScale * 100}%`;

  return (
    <div
      className={cn('relative', className)}
      style={{
        width: logoSize,
        height: logoSize,
        transform: `translate(${HERO_COMPUTER_SCREEN.logoOffsetX}, ${HERO_COMPUTER_SCREEN.logoOffsetY})`
      }}
    >
      <Image
        src="/humaner.svg"
        alt=""
        fill
        unoptimized
        className="object-contain object-center"
        sizes="200px"
      />
    </div>
  );
}

function useComputerGlitch(): boolean {
  const reduceMotion = useReducedMotion();
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setGlitching(false);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleStatic = (): void => {
      timeoutId = setTimeout(
        () => {
          if (cancelled) return;
          setGlitching(true);
          timeoutId = setTimeout(
            () => {
              if (cancelled) return;
              setGlitching(false);
              scheduleStatic();
            },
            randomBetween(GLITCH_MS.min, GLITCH_MS.max)
          );
        },
        randomBetween(STATIC_MS.min, STATIC_MS.max)
      );
    };

    timeoutId = setTimeout(scheduleStatic, 1800);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  return glitching && !reduceMotion;
}

function ComputerScreenOverlay({
  glitching
}: {
  glitching: boolean;
}): React.JSX.Element {
  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden"
      style={{
        top: HERO_COMPUTER_SCREEN.top,
        left: HERO_COMPUTER_SCREEN.left,
        width: HERO_COMPUTER_SCREEN.width,
        height: HERO_COMPUTER_SCREEN.height,
        borderRadius: HERO_COMPUTER_SCREEN.borderRadius,
        transform: `perspective(900px) rotateY(${HERO_COMPUTER_SCREEN.rotateY}) rotateX(${HERO_COMPUTER_SCREEN.rotateX}) translate(${HERO_COMPUTER_SCREEN.screenOffsetX}, ${HERO_COMPUTER_SCREEN.screenOffsetY})`,
        transformOrigin: 'center center'
      }}
    >
      <div
        className={cn(
          'hero-screen-logo relative flex h-full w-full items-center justify-center',
          glitching && 'hero-screen-logo--glitch'
        )}
      >
        <div className="hero-screen-logo__layer hero-screen-logo__layer--base absolute inset-0 flex items-center justify-center">
          <ScreenLogo />
        </div>
        <div
          className="hero-screen-logo__layer hero-screen-logo__layer--warm absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <ScreenLogo />
        </div>
        <div
          className="hero-screen-logo__layer hero-screen-logo__layer--cyan absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <ScreenLogo />
        </div>
        <div
          className="hero-screen-logo__scanlines absolute inset-0"
          aria-hidden
        />
      </div>
    </div>
  );
}

function AuthComputerFrame({
  className
}: {
  className?: string;
}): React.JSX.Element {
  const glitching = useComputerGlitch();

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-lg shrink-0 select-none',
        className
      )}
    >
      <div
        className="relative w-full min-h-[12rem] overflow-hidden sm:min-h-[14rem]"
        style={{ aspectRatio: HERO_COMPUTER_VIEWPORT_ASPECT }}
      >
        <div
          className="absolute"
          style={HERO_COMPUTER_FRAME_LAYOUT}
        >
          <Image
            src="/computer_frame.png"
            alt=""
            fill
            unoptimized
            priority
            className="object-fill"
            sizes="(max-width: 1024px) 90vw, 38vw"
          />
          <ComputerScreenOverlay glitching={glitching} />
        </div>
      </div>
      <div
        className="pointer-events-none absolute -bottom-1 left-1/2 z-0 h-6 w-[68%] -translate-x-1/2 rounded-[50%] bg-[#0A0D0D]/10 blur-xl"
        aria-hidden
      />
    </div>
  );
}

/** Landing Hero right frame — backdrop + computer — for the auth split panel. */
export function AuthHeroPanel(): React.JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-8 py-16">
      <div
        className="auth-hero-background"
        aria-hidden
      >
        <div className="auth-hero-background__image">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            quality={90}
            className="object-cover object-center"
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AuthComputerFrame />
      </div>
    </div>
  );
}
