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

export type CompanionFigureState = "idle" | "enter" | "thinking" | "exit";

/** Paths from `/companion.svg` — Companion only (not the brand logo). */
const COMPANION_BODY_PATH =
  "M23.16 20.44 C23.02 20.02 22.83 19.41 22.22 19.03 C21.61 18.66 20.30 18.50 19.50 18.19 C18.70 17.88 18.11 17.69 17.44 17.16 C16.77 16.63 15.89 15.60 15.47 15.00 C15.05 14.40 15.00 14.06 14.91 13.59 C14.82 13.12 14.69 12.74 14.91 12.19 C15.13 11.64 15.94 10.84 16.22 10.31 C16.50 9.78 16.62 9.44 16.59 9.00 C16.56 8.56 16.30 8.02 16.03 7.69 C15.77 7.36 15.53 7.16 15.00 7.03 C14.47 6.91 14.65 6.57 12.84 6.94 C11.03 7.32 5.70 8.83 4.12 9.28 C2.54 9.73 3.63 9.43 3.38 9.66 C3.13 9.89 2.70 10.29 2.62 10.69 C2.54 11.09 2.68 11.73 2.91 12.09 C3.15 12.45 3.69 12.71 4.03 12.84 C4.37 12.96 3.91 13.07 4.97 12.84 C6.03 12.61 9.39 11.58 10.41 11.44 C11.43 11.30 10.95 11.75 11.06 12.00 C11.17 12.25 11.25 12.46 11.06 12.94 C10.87 13.42 10.49 14.27 9.94 14.91 C9.39 15.55 8.53 16.30 7.78 16.78 C7.03 17.26 6.32 17.53 5.44 17.81 C4.57 18.09 3.22 18.23 2.53 18.47 C1.84 18.70 1.61 18.89 1.31 19.22 C1.01 19.55 0.83 20.07 0.75 20.44 C0.67 20.82 0.59 21.06 0.84 21.47 C1.09 21.88 1.69 22.64 2.25 22.88 C2.81 23.11 3.17 23.44 4.22 22.88 C5.27 22.32 7.59 20.17 8.53 19.50 C9.47 18.83 9.28 19.03 9.84 18.84 C10.40 18.65 11.22 18.43 11.91 18.38 C12.60 18.33 13.38 18.42 13.97 18.56 C14.56 18.70 14.64 18.53 15.47 19.22 C16.30 19.91 18.19 22.03 18.94 22.69 C19.69 23.35 19.59 23.08 19.97 23.16 C20.34 23.24 20.78 23.27 21.19 23.16 C21.60 23.05 22.10 22.77 22.41 22.50 C22.72 22.23 22.93 21.90 23.06 21.56 C23.18 21.22 23.30 20.86 23.16 20.44 Z";

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
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      height={size}
      style={style}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="17.3" cy="3.85" r="3.05" />
      <path d={COMPANION_BODY_PATH} />
    </svg>
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
  return (
    <span className="block animate-spin" style={{ height: size, width: size }}>
      <svg
        aria-hidden
        fill="none"
        height={size}
        viewBox="0 0 24 24"
        width={size}
      >
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeDasharray="36 14"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      </svg>
    </span>
  );
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
        "inline-flex items-center justify-center overflow-visible",
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
      whileHover={
        reduceMotion || exiting || thinking
          ? undefined
          : {
              y: [0, -5, 0],
              scale: [1, 1.12, 1],
              transition: { duration: 0.42, ease: ENTER_EASE },
            }
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
