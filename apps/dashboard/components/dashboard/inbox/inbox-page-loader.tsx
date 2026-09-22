'use client';

import * as React from 'react';
import { BrandMark } from '@humaner/shared/brand-mark';
import { SquircleLoader } from '@humaner/shared/squircle-loader';

/** Inbox cobalt — same token as the inbox accent. */
export const INBOX_LOADER_COBALT = '#001afc';

/**
 * Main-inbox loading mark: the sidebar Humaner icon morphs into the
 * squircle spinner and back, looping, all cobalt.
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
          <SquircleLoader
            size={40}
            color={INBOX_LOADER_COBALT}
          />
        </span>
      </span>
    </div>
  );
}
