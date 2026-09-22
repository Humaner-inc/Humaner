'use client';

import * as React from 'react';
import { BrandMark } from '@humaner/shared/brand-mark';

/** Inbox cobalt — same token as the inbox accent. */
export const INBOX_LOADER_COBALT = '#001afc';
const LOADER_SIZE = 40;

/**
 * Same 40×40 box as the Humaner mark: a ring that occupies the icon bounds
 * so the mark can dissolve into this spinner without shrinking.
 */
function InboxMorphSpinner(): React.JSX.Element {
  return (
    <svg
      width={LOADER_SIZE}
      height={LOADER_SIZE}
      viewBox="0 0 40 40"
      className="humaner-morph-loader__ring"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="3"
      />
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="22 79"
      />
    </svg>
  );
}

/**
 * Main-inbox loading mark: the sidebar Humaner icon morphs into a
 * same-size cobalt spinner and back, looping.
 */
export function InboxPageLoader({
  fill = 'slot'
}: {
  /** `screen` covers the first paint before dashboard chrome mounts. */
  fill?: 'slot' | 'screen';
} = {}): React.JSX.Element {
  return (
    <div
      className={
        fill === 'screen'
          ? 'flex h-screen w-full items-center justify-center bg-background'
          : 'flex h-full min-h-0 flex-1 items-center justify-center'
      }
      data-dashboard-page-shell="inbox"
      role="status"
      aria-label="Loading inbox"
    >
      <span className="humaner-morph-loader">
        <span className="humaner-morph-loader__layer humaner-morph-loader__icon">
          <span className="humaner-morph-loader__mark">
            <BrandMark
              invert
              alt=""
              className="size-full"
            />
          </span>
        </span>
        <span className="humaner-morph-loader__layer humaner-morph-loader__spinner">
          <InboxMorphSpinner />
        </span>
      </span>
    </div>
  );
}
