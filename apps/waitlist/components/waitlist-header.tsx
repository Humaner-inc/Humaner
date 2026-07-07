'use client';

import { BrandWordmark } from '@humaner/shared/brand-wordmark';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const HEADER_HEIGHT = 64;

export function WaitlistHeader(): React.JSX.Element {
  const [overHero, setOverHero] = useState(true);
  const [brandHovered, setBrandHovered] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) {
      setOverHero(false);
      return;
    }

    const update = (): void => {
      const { bottom } = hero.getBoundingClientRect();
      setOverHero(bottom > HEADER_HEIGHT);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const lightHero = overHero;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        lightHero
          ? 'border-b border-foreground/[0.06] bg-[#fff8f2]/90 backdrop-blur-md'
          : 'border-b border-white/10 bg-foreground shadow-[0_1px_0_0_rgb(255_255_255_/_0.06)]'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-6">
        <span
          className="inline-flex items-center"
          onMouseEnter={() => setBrandHovered(true)}
          onMouseLeave={() => setBrandHovered(false)}
        >
          <BrandWordmark
            active={brandHovered}
            className={cn(
              'font-display text-xl tracking-tight transition-colors duration-500 sm:text-[1.65rem]',
              lightHero ? 'text-foreground' : 'text-white'
            )}
          />
        </span>
      </div>
    </header>
  );
}
