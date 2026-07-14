'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import { DeleteAccountModal } from '@/components/dashboard/settings/account/profile/delete-account-modal';
import { DangerZonePanel } from '@/components/ui/danger-zone';
import { DeleteActionButton } from '@/components/ui/delete-action-button';

export type DangerZoneCardProps = {
  email: string;
  className?: string;
};

export function DangerZoneCard({
  email,
  className
}: DangerZoneCardProps): React.JSX.Element {
  const handleShowDeleteAccountModal = (): void => {
    if (!email) {
      return;
    }
    NiceModal.show(DeleteAccountModal, { email });
  };

  return (
    <DangerZonePanel
      className={className}
      title="Delete account"
      description="Deleting your account is irreversible. All your data will be permanently removed from our servers."
      action={
        <DeleteActionButton
          size="default"
          disabled={!email}
          onClick={handleShowDeleteAccountModal}
        >
          Delete account
        </DeleteActionButton>
      }
    />
  );
}
