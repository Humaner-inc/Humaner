'use client';

import type * as React from 'react';
import type { AddOnInterval, AddOnKind } from '@humaner/shared/addons';

export const ADD_ON_CONSENT_FOOTER_BUTTON_CLASS =
  'h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal';

export type AddOnConsentCopyContext = {
  usedSlots?: number;
  slotLimit?: number;
  providerName?: string;
};

/** Self-Host has no paid add-ons; the copy only exists to satisfy shared callers. */
export function addOnConsentCopy(
  kind: AddOnKind,
  _context?: AddOnConsentCopyContext
): {
  title: string;
  description: string;
  confirmApply: string;
  confirmCheckout: string;
} {
  const noun = kind === 'seat' ? 'teammate seats' : 'mailboxes';
  return {
    title: `Add ${noun}`,
    description: 'Self-Host has no seat or mailbox limits.',
    confirmApply: 'Continue',
    confirmCheckout: 'Continue'
  };
}

export function AddOnQuantitySelector(_props: {
  kind: AddOnKind;
  quantity: number;
  onQuantityChange?: (quantity: number) => void;
  readOnly?: boolean;
  id?: string;
}): React.JSX.Element | null {
  return null;
}

export function AddOnConsentFields(_props: {
  kind: AddOnKind;
  interval: AddOnInterval;
  onIntervalChange: (interval: AddOnInterval) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  canApplyToBill: boolean;
  usedSlots?: number;
  slotLimit?: number;
  providerName?: string;
}): React.JSX.Element | null {
  return null;
}

export function AddOnConsentFooterButtons(_props: {
  kind: AddOnKind;
  quantity: number;
  canApplyToBill: boolean;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}): React.JSX.Element | null {
  return null;
}
