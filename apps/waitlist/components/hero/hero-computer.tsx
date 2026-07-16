"use client";

import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  HERO_COMPUTER_FRAME_LAYOUT,
  HERO_COMPUTER_SCREEN,
  HERO_COMPUTER_VIEWPORT_ASPECT,
} from "@/lib/hero-computer-screen";
import { cn } from "@/lib/utils";

const GLITCH_MS = { min: 500, max: 700 } as const;
const STATIC_MS = { min: 2400, max: 3400 } as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ScreenLogo({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      className={cn("relative h-[62%] w-[62%]", className)}
      style={{
        transform: `translate(${HERO_COMPUTER_SCREEN.logoOffsetX}, ${HERO_COMPUTER_SCREEN.logoOffsetY})`,
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

export function HeroComputer(): React.JSX.Element {
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
          if (cancelled) {
            return;
          }
          setGlitching(true);
          timeoutId = setTimeout(
            () => {
              if (cancelled) {
                return;
              }
              setGlitching(false);
              scheduleStatic();
            },
            randomBetween(GLITCH_MS.min, GLITCH_MS.max),
          );
        },
        randomBetween(STATIC_MS.min, STATIC_MS.max),
      );
    };

    timeoutId = setTimeout(scheduleStatic, 1800);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,15rem)] sm:max-w-[17rem] lg:w-auto lg:max-w-none">
      <div
        className="relative mx-auto w-full overflow-hidden lg:h-[min(78vh,780px)]"
        style={{ aspectRatio: HERO_COMPUTER_VIEWPORT_ASPECT }}
      >
        <div className="absolute" style={HERO_COMPUTER_FRAME_LAYOUT}>
          <Image
            src="/computer_frame.png"
            alt=""
            width={1536}
            height={589}
            unoptimized
            priority
            className="block h-full w-full"
            sizes="(max-width: 1024px) 90vw, 38vw"
          />

          <div
            className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden"
            style={{
              top: HERO_COMPUTER_SCREEN.top,
              left: HERO_COMPUTER_SCREEN.left,
              width: HERO_COMPUTER_SCREEN.width,
              height: HERO_COMPUTER_SCREEN.height,
              borderRadius: HERO_COMPUTER_SCREEN.borderRadius,
              transform: `perspective(900px) rotateY(${HERO_COMPUTER_SCREEN.rotateY}) rotateX(${HERO_COMPUTER_SCREEN.rotateX}) translate(${HERO_COMPUTER_SCREEN.screenOffsetX}, ${HERO_COMPUTER_SCREEN.screenOffsetY})`,
              transformOrigin: "center center",
            }}
          >
            <div
              className={cn(
                "hero-screen-logo relative flex h-full w-full items-center justify-center",
                glitching && "hero-screen-logo--glitch",
              )}
            >
              <div className="hero-screen-logo__layer hero-screen-logo__layer--base absolute inset-0 flex items-center justify-center">
                <ScreenLogo />
              </div>
              <div
                className="hero-screen-logo__layer hero-screen-logo__layer--red absolute inset-0 flex items-center justify-center"
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
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[4%] left-1/2 z-0 h-[10%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[#060707]/18 blur-2xl"
        aria-hidden
      />
    </div>
  );
}
