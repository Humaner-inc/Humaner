'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { WorkspaceRole } from '@prisma/client';

import { DeleteOrganizationModal } from '@/components/dashboard/settings/organization/information/delete-organization-modal';
import { LeaveOrganizationModal } from '@/components/dashboard/settings/organization/information/leave-organization-modal';
import { DangerZonePanel } from '@/components/ui/danger-zone';
import { DeleteActionButton } from '@/components/ui/delete-action-button';

export type OrganizationDangerZoneCardProps = {
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  className?: string;
};

export function OrganizationDangerZoneCard({
  workspaceName,
  workspaceRole,
  className
}: OrganizationDangerZoneCardProps): React.JSX.Element {
  const isOwner = workspaceRole === WorkspaceRole.OWNER;

  if (isOwner) {
    return (
      <DangerZonePanel
        className={className}
        title="Delete workspace"
        description="Permanently delete this workspace and all of its data. Your account is not deleted."
        action={
          <DeleteActionButton
            size="default"
            onClick={() => {
              NiceModal.show(DeleteOrganizationModal, { workspaceName });
            }}
          >
            Delete workspace
          </DeleteActionButton>
        }
      />
    );
  }

  return (
    <DangerZonePanel
      className={className}
      title="Leave workspace"
      description="Remove yourself from this workspace. Your account stays; you can join again if invited."
      action={
        <DeleteActionButton
          size="default"
          onClick={() => {
            NiceModal.show(LeaveOrganizationModal, { workspaceName });
          }}
        >
          Leave workspace
        </DeleteActionButton>
      }
    />
  );
}
