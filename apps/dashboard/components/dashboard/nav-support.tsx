'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MessageCircleIcon, PlusIcon, type LucideIcon } from '@humaner/shared/icons';

import { FeedbackModal } from '@/components/dashboard/feedback-modal';
import { InviteMemberModal } from '@/components/dashboard/settings/organization/members/invite-member-modal';
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
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavSupportProps = SidebarGroupProps & {
  profile: ProfileDto;
};

function NavSupportItem({
  label,
  icon,
  onClick
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}): React.JSX.Element {
  const { iconRef, menuHoverHandlers } = useNavMenuIconAnimation();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={label}
        className="text-muted-foreground"
        onClick={onClick}
        {...menuHoverHandlers}
      >
        <NavMenuIcon
          icon={icon}
          iconRef={iconRef}
          className="size-4 shrink-0"
        />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavSupport({
  profile,
  ...other
}: NavSupportProps): React.JSX.Element {
  const handleShowInviteMemberModal = (): void => {
    NiceModal.show(InviteMemberModal, { profile });
  };
  const handleShowFeedbackModal = (): void => {
    NiceModal.show(FeedbackModal);
  };

  return (
    <SidebarGroup {...other}>
      <SidebarMenu>
        <NavSupportItem
          label="Invite member"
          icon={PlusIcon}
          onClick={handleShowInviteMemberModal}
        />
        <NavSupportItem
          label="Feedback"
          icon={MessageCircleIcon}
          onClick={handleShowFeedbackModal}
        />
      </SidebarMenu>
    </SidebarGroup>
  );
}
