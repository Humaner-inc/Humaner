"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
} from "react";

import {
  resolveIconSize,
  type AnimatedIconHandle,
  type LucideIcon,
  type LucideIconProps,
} from "./icon-utils";
import { SquircleLoader } from "./squircle-loader";

export type CompanionFigureState = "idle" | "enter" | "thinking" | "exit";

/** Public path for the Companion mark (`Companion.svg` / `companion.svg`). */
export const COMPANION_MARK_SRC = "/companion.svg";

const EXIT_MS = 520;
const ENTER_EASE = [0.34, 1.56, 0.64, 1] as const;
const EXIT_EASE = [0.33, 1, 0.68, 1] as const;

function joinClassNames(
  ...classes: Array<string | undefined | false>
): string | undefined {
  const value = classes.filter(Boolean).join(" ");
  return value || undefined;
}

export function CompanionMark({
  size = 24,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}): JSX.Element {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- shared mark; apps serve /companion.svg
    <img
      aria-hidden
      alt=""
      className={joinClassNames("block object-contain", className)}
      height={size}
      src={COMPANION_MARK_SRC}
      style={style}
      width={size}
    />
  );
}

/** Lucide-shaped wrapper so Companion can replace robot icons in icon maps. */
export const Companion = forwardRef<AnimatedIconHandle, LucideIconProps>(
  function Companion(
    {
      className,
      size,
      width,
      height,
      style,
      strokeWidth: _strokeWidth,
      ...props
    },
    ref,
  ) {
    const resolvedSize = resolveIconSize(className, size, width, height, 16);

    useImperativeHandle(
      ref,
      () => ({
        startAnimation() {},
        stopAnimation() {},
      }),
      [],
    );

    return (
      <span
        className={joinClassNames(
          "inline-flex shrink-0 items-center justify-center",
          className,
        )}
        style={style}
        {...props}
      >
        <CompanionMark size={resolvedSize} />
      </span>
    );
  },
) as LucideIcon;

function CompanionLoader({ size }: { size: number }): JSX.Element {
  return <SquircleLoader size={size} color="currentColor" />;
}

export type CompanionFigureProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  | "style"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
> & {
  state?: CompanionFigureState;
  size?: number;
  style?: CSSProperties;
  onExitComplete?: () => void;
};

export function CompanionFigure({
  state = "idle",
  size = 24,
  className,
  style,
  onExitComplete,
  ...props
}: CompanionFigureProps): JSX.Element {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (state !== "exit" || !onExitComplete) return;
    const id = window.setTimeout(onExitComplete, reduceMotion ? 160 : EXIT_MS);
    return () => window.clearTimeout(id);
  }, [onExitComplete, reduceMotion, state]);

  const enter = state === "enter";
  const exiting = state === "exit";
  const thinking = state === "thinking";

  return (
    <motion.span
      aria-hidden
      className={joinClassNames(
        "inline-flex items-center justify-center overflow-visible leading-none",
        className,
      )}
      style={style}
      initial={
        reduceMotion || !enter ? false : { opacity: 0, scale: 0.4, y: 12 }
      }
      animate={
        exiting
          ? reduceMotion
            ? { opacity: 0, y: 10 }
            : {
                y: [0, -10, 6, 36],
                x: [0, -2, 3, 6],
                rotate: [0, -12, 18, 48],
                scale: [1, 1.08, 0.95, 0.72],
                opacity: [1, 1, 0.85, 0],
              }
          : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
      }
      transition={
        exiting
          ? { duration: 0.52, ease: EXIT_EASE, times: [0, 0.22, 0.48, 1] }
          : enter
            ? { duration: 0.55, ease: ENTER_EASE }
            : { duration: 0.2, ease: EXIT_EASE }
      }
      {...props}
    >
      <span className="t-icon-swap" data-state={thinking ? "b" : "a"}>
        <span className="t-icon" data-icon="a">
          <CompanionMark size={size} />
        </span>
        <span className="t-icon" data-icon="b">
          <CompanionLoader size={size} />
        </span>
      </span>
    </motion.span>
  );
}
