'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  ISSUER_DATA_HREF,
  missingIssuerLegalFields,
  type IssuerLegalProfile
} from '@/lib/inbox/issuer-legal-fields';
import { cn } from '@/lib/utils';

export function IssuerLegalMark({
  profile,
  purpose = 'issuer',
  includeLogo = true,
  showLabel = false,
  className
}: {
  profile: IssuerLegalProfile;
  purpose?: 'issuer' | 'billing';
  includeLogo?: boolean;
  showLabel?: boolean;
  className?: string;
}): React.JSX.Element | null {
  const missing = missingIssuerLegalFields(profile, { includeLogo });
  if (missing.length === 0) return null;
  const labels = missing.map((field) => field.label).join(', ');
  const title =
    purpose === 'billing'
      ? `Add your billing details: ${labels}`
      : `Add required issuer details: ${labels}`;
  const label =
    purpose === 'billing'
      ? 'Add your billing details'
      : 'Complete issuer details';
  return (
    <Link
      href={ISSUER_DATA_HREF}
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center',
        showLabel ? 'gap-1.5 text-xs text-amber-800 dark:text-amber-300' : null,
        className
      )}
    >
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold leading-none text-white">
        !
      </span>
      {showLabel ? label : null}
    </Link>
  );
}
