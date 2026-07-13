"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SLOGAN_WORDS = ["human", "smarter", "efficient"] as const;

const TYPE_MS = 55;
const DELETE_MS = 35;
const PAUSE_MS = 2200;

export function HeroSlogan({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setInterval(() => {
        setWordIndex((current) => (current + 1) % SLOGAN_WORDS.length);
      }, PAUSE_MS);
      return () => window.clearInterval(timer);
    }

    const target = SLOGAN_WORDS[wordIndex];

    if (!isDeleting && displayed === target) {
      const pause = window.setTimeout(() => setIsDeleting(true), PAUSE_MS);
      return () => window.clearTimeout(pause);
    }

    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setWordIndex((current) => (current + 1) % SLOGAN_WORDS.length);
      return;
    }

    const timer = window.setTimeout(
      () => {
        setDisplayed((current) => {
          if (isDeleting) return target.slice(0, current.length - 1);
          return target.slice(0, current.length + 1);
        });
      },
      isDeleting ? DELETE_MS : TYPE_MS,
    );

    return () => window.clearTimeout(timer);
  }, [displayed, isDeleting, reduceMotion, wordIndex]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(SLOGAN_WORDS[wordIndex]);
      setIsDeleting(false);
    }
  }, [reduceMotion, wordIndex]);

  const activeWord = reduceMotion ? SLOGAN_WORDS[wordIndex] : displayed;
  const showCursor =
    !reduceMotion &&
    (isDeleting || activeWord.length < SLOGAN_WORDS[wordIndex].length);

  return (
    <h1
      className={cn(
        "font-display text-[2.65rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4rem]",
        className,
      )}
    >
      <span className="text-[#070607]">Customer support</span>
      <br />
      <span className="font-normal text-[#070607]">that feels </span>
      <span className="whitespace-nowrap font-mono font-normal">
        <span className="text-accent">{"{"}</span>
        <span
          className="inline-block min-w-[9.5ch] text-foreground/45"
          aria-live="polite"
          aria-atomic="true"
        >
          {activeWord}
          {showCursor ? (
            <span className="ml-px inline-block h-[0.9em] w-[0.12em] animate-pulse bg-foreground/35 align-middle" />
          ) : null}
        </span>
        <span className="text-accent">{"}"}</span>
      </span>
    </h1>
  );
}
