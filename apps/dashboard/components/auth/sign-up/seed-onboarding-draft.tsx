'use client';

import * as React from 'react';

/** Must match `ONBOARDING_CHECKOUT_STORAGE_KEY` in onboarding-wizard. */
const ONBOARDING_CHECKOUT_STORAGE_KEY = 'humaner:onboarding-checkout';

export type SeedOnboardingDraftProps = {
  organizationName?: string;
  website?: string;
  timeZone?: string;
};

export function SeedOnboardingDraft({
  organizationName,
  website,
  timeZone
}: SeedOnboardingDraftProps): null {
  React.useEffect(() => {
    const name = organizationName?.trim();
    const site = website?.trim();
    const zone = timeZone?.trim();
    if (!name && !site && !zone) {
      return;
    }

    try {
      let existing: Record<string, unknown> = {};
      const stored = sessionStorage.getItem(ONBOARDING_CHECKOUT_STORAGE_KEY);
      if (stored) {
        existing = JSON.parse(stored) as Record<string, unknown>;
      }
      const values =
        existing.values && typeof existing.values === 'object'
          ? { ...(existing.values as Record<string, unknown>) }
          : {};
      if (zone) {
        values.timeZone = zone;
      }
      sessionStorage.setItem(
        ONBOARDING_CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          ...existing,
          ...(name ? { organizationName: name } : {}),
          ...(site ? { website: site } : {}),
          values
        })
      );
    } catch {
      // private browsing / quota
    }
  }, [organizationName, website, timeZone]);

  return null;
}
