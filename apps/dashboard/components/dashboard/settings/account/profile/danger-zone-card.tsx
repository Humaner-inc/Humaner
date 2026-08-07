'use client';

import * as React from 'react';
import Link from 'next/link';
import NiceModal from '@ebay/nice-modal-react';

import { DeleteAccountModal } from '@/components/dashboard/settings/account/profile/delete-account-modal';
import { Button } from '@/components/ui/button';
import { DangerZonePanel } from '@/components/ui/danger-zone';
import { DeleteActionButton } from '@/components/ui/delete-action-button';
import { Routes } from '@/constants/routes';

export type DangerZoneCardProps = {
  email: string;
  isOwner: boolean;
  className?: string;
};

export function DangerZoneCard({
  email,
  isOwner,
  className
}: DangerZoneCardProps): React.JSX.Element {
  if (isOwner) {
    return (
      <DangerZonePanel
        className={className}
        title="Delete account"
        description="You must delete your organization first before your own account."
        action={
          <Button
            asChild
            variant="outline"
            size="default"
          >
            <Link href={Routes.OrganizationInformation}>
              Go to organization settings
            </Link>
          </Button>
        }
      />
    );
  }

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
      description="Deleting your account cannot be undone and will remove all your data."
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
