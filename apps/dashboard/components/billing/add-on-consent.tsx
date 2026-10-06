'use client';

import type * as React from 'react';
import type { AddOnInterval, AddOnKind } from '@humaner/shared/addons';

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
