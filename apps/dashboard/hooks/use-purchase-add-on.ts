'use client';

import * as React from 'react';
import type { AddOnInterval, AddOnKind } from '@humaner/shared/addons';

import type { AddOnGrant } from '@/components/billing/add-on-granted-dialog';

export type PurchaseAddOnResult =
  | { outcome: 'applied'; grantedQuantity: number }
  | { outcome: 'checkout' }
  | { outcome: 'error' };

export function usePurchaseAddOn(): {
  pending: AddOnKind | null;
  grant: AddOnGrant | null;
  clearGrant: () => void;
  purchase: (input: {
    kind: AddOnKind;
    interval: AddOnInterval;
    quantity?: number;
    successPath: string;
  }) => Promise<PurchaseAddOnResult>;
} {
  const clearGrant = React.useCallback(() => {}, []);

  const purchase = React.useCallback(async (): Promise<PurchaseAddOnResult> => {
    return { outcome: 'error' };
  }, []);

  return {
    pending: null,
    grant: null,
    clearGrant,
    purchase
  };
}
