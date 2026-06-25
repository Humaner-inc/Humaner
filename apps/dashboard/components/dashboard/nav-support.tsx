'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MessageCircleIcon, PlusIcon } from 'lucide-react';

import { FeedbackModal } from '@/components/dashboard/feedback-modal';
import { InviteMemberModal } from '@/components/dashboard/settings/organization/members/invite-member-modal';
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
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Invite member"
            className="text-muted-foreground"
            onClick={handleShowInviteMemberModal}
          >
            <PlusIcon className="size-4 shrink-0" />
            <span>Invite member</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Feedback"
            className="text-muted-foreground"
            onClick={handleShowFeedbackModal}
          >
            <MessageCircleIcon className="size-4 shrink-0" />
            <span>Feedback</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
