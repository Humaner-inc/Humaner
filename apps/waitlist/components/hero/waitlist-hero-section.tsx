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
      className="relative overflow-hidden bg-[#fff8f2]"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-6 pb-8 pt-32 sm:gap-2 sm:pt-36 lg:min-h-[100svh] lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:pb-24 lg:pt-32">
        <div className="flex shrink-0 flex-col items-center text-center lg:justify-center">
          <h1 className="font-display text-[2.65rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4rem]">
            <span className="text-foreground">Customer support</span>
            <br />
            <span className="font-normal text-foreground/45">that feels human.</span>
          </h1>

          <p
            ref={trunkAnchorRef}
            className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/55 sm:mt-6 sm:text-lg"
          >
             The support your customers love, 
             <br/>the experience developers wanted.  
          </p>
        </div>

        <div className="relative flex w-full shrink-0 justify-center overflow-visible lg:w-auto lg:self-center">
          <HeroComputer />
        </div>
      </div>
    </section>
  );
}
