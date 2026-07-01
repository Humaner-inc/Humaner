import type { RefObject } from 'react';

import { HeroComputer } from '@/components/hero/hero-computer';

type WaitlistHeroSectionProps = {
  trunkAnchorRef: RefObject<HTMLParagraphElement | null>;
};

export function WaitlistHeroSection({
  trunkAnchorRef
}: WaitlistHeroSectionProps): React.JSX.Element {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#f5f5f5]"
    >
      <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-28 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:pb-24 lg:pt-32">
        <div className="flex flex-col items-center text-center lg:justify-center lg:pr-8">
          <h1 className="font-display text-[2.65rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4rem]">
            <span className="text-foreground">Customer support</span>
            <br />
            <span className="font-normal text-foreground/45">that feels human.</span>
          </h1>

          <p
            ref={trunkAnchorRef}
            className="mx-auto mt-6 max-w-md text-base leading-relaxed text-foreground/55 sm:text-lg"
          >
            Built for developers. Designed for customers.
          </p>
        </div>

        <div className="relative flex justify-center overflow-visible lg:justify-end lg:justify-self-end lg:self-center">
          <HeroComputer />
        </div>
      </div>
    </section>
  );
}
