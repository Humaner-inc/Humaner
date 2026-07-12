'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import { DeleteAccountModal } from '@/components/dashboard/settings/account/profile/delete-account-modal';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import { DeleteActionButton } from '@/components/ui/delete-action-button';
import { Separator } from '@/components/ui/separator';

export type DangerZoneCardProps = CardProps & {
  email: string;
};

export function DangerZoneCard({
  email,
  ...props
}: DangerZoneCardProps): React.JSX.Element {
  const handleShowDeleteAccountModal = (): void => {
    if (!email) {
      return;
    }
    NiceModal.show(DeleteAccountModal, { email });
  };
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <p className="text-sm font-normal text-muted-foreground">
          Deleting your account is irreversible. All your data will be
          permanently removed from our servers.
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <DeleteActionButton
          size="default"
          disabled={!email}
          onClick={handleShowDeleteAccountModal}
        >
          Delete account
        </DeleteActionButton>
      </CardFooter>
    </Card>
  );
}
