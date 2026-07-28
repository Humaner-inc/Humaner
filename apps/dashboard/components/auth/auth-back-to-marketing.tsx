import * as React from 'react';
import { ArrowLeftIcon } from '@humaner/shared/icons';
import { getLandingUrl } from '@humaner/shared/urls';

/**
 * Returns to the marketing site (humaner.io). Shown on login / signup only.
 * Positioned on the left edge of the auth panel, vertically centered.
 */
export function AuthBackToMarketing(): React.JSX.Element {
  return (
    <a
      href={getLandingUrl()}
      aria-label="Back to Humaner"
      className="absolute left-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:left-6"
    >
      <ArrowLeftIcon className="size-5 shrink-0" />
    </a>
  );
}
