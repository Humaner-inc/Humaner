import * as React from 'react';
import Image from 'next/image';

/** Landing hero photo on the auth split panel — no computer mockup. */
export function AuthHeroPanel(): React.JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden">
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
    </div>
  );
}
