'use client';

import { useEffect, useRef, useState } from 'react';

const HIGHLIGHT_MS = 800;

type ActiveHighlight = {
  index: number;
  id: number;
};

export function useCharHighlights(value: string): Set<number> {
  const prevLengthRef = useRef(value.length);
  const skipMountRef = useRef(true);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const [highlights, setHighlights] = useState<ActiveHighlight[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const addHighlights = (from: number, to: number): void => {
    const count = to - from;
    const staggerMs = count > 1 ? 40 : 0;

    for (let index = from; index < to; index += 1) {
      const staggerDelay = (index - from) * staggerMs;

      const scheduleTimer = setTimeout(() => {
        const id = nextIdRef.current;
        nextIdRef.current += 1;

        setHighlights((current) => [...current, { index, id }]);

        const timer = setTimeout(() => {
          setHighlights((current) => current.filter((item) => item.id !== id));
          timersRef.current.delete(id);
        }, HIGHLIGHT_MS);

        timersRef.current.set(id, timer);
      }, staggerDelay);

      timersRef.current.set(-(index + 1), scheduleTimer);
    }
  };

  const clearHighlights = (): void => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setHighlights([]);
  };

  useEffect(() => {
    if (skipMountRef.current) {
      skipMountRef.current = false;
      prevLengthRef.current = value.length;
      return;
    }

    const prev = prevLengthRef.current;

    if (value.length > prev) {
      // Paste inserts many glyphs at once — skip the fill so the field
      // does not flash a full-width highlight.
      if (value.length - prev > 4) {
        prevLengthRef.current = value.length;
        return;
      }
      addHighlights(prev, value.length);
    } else if (value.length < prev) {
      clearHighlights();
    }

    prevLengthRef.current = value.length;
  }, [value]);

  return new Set(highlights.map((item) => item.index));
}
