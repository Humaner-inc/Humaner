'use client';

import type * as React from 'react';
import type { AddOnKind } from '@humaner/shared/addons';

export type AddOnGrant = {
  kind: AddOnKind;
  quantity: number;
};

export function persistAddOnGrant(_grant: AddOnGrant): void {}

export function consumeAddOnGrant(): AddOnGrant | null {
  return null;
}

export function AddOnGrantedDialog(_props: {
  grant: AddOnGrant | null;
  onClose: () => void;
}): React.JSX.Element | null {
  return null;
}
