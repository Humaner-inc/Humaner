'use client';

import { useEffect, useState, type RefObject } from 'react';

type UseInViewOptions = {
  threshold?: number;
  rootMargin?: string;
};

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { threshold = 0.35, rootMargin = '0px' }: UseInViewOptions = {}
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return inView;
}
