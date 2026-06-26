'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { PlusIcon } from '@humaner/shared/icons';

import { InviteTeammateModal } from '@/components/dashboard/settings/organization/members/invite-member-modal';
import {
  NavMenuIcon,
  useNavMenuIconAnimation
} from '@/components/ui/nav-menu-icon';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavSupportProps = SidebarGroupProps & {
  profile: ProfileDto;
};

export function NavSupport({
  profile,
  ...other
}: NavSupportProps): React.JSX.Element {
  const { iconRef, menuHoverHandlers } = useNavMenuIconAnimation();

  if (!isWorkspaceOwner(profile)) {
    return <></>;
  }

  const handleShowInviteTeammateModal = (): void => {
    NiceModal.show(InviteTeammateModal, { profile });
  };

  return (
    <SidebarGroup {...other}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Invite teammate"
            className="text-muted-foreground"
            onClick={handleShowInviteTeammateModal}
            {...menuHoverHandlers}
          >
            <NavMenuIcon
              icon={PlusIcon}
              iconRef={iconRef}
              className="size-4 shrink-0"
            />
            <span>Invite teammate</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
