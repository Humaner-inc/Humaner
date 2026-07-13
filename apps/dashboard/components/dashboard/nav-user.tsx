'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { toast } from 'sonner';

import { logOut } from '@/actions/auth/log-out';
import { CommandMenu } from '@/components/dashboard/command-menu';
import { InviteTeammateModal } from '@/components/dashboard/settings/organization/members/invite-member-modal';
import { UserTicketsSheet } from '@/components/support/user-tickets-sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import { Routes } from '@/constants/routes';
import { isWorkspaceOwner } from '@/lib/auth/workspace-access';
import { isDialogOpen } from '@/lib/browser/is-dialog-open';
import { isInputFocused } from '@/lib/browser/is-input-focused';
import { isMac } from '@/lib/browser/is-mac';
import { getDocsUrl } from '@/lib/urls/get-docs-url';
import { cn, getInitials } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavUserProps = SidebarGroupProps & {
  profile: ProfileDto;
  variant?: 'sidebar' | 'navbar';
};

function ProfileMenuContent({
  profile,
  onNavigateToProfilePage,
  onNavigateToBillingPage,
  onShowInviteTeammateModal,
  onShowSupportTickets,
  onShowCommandMenu,
  onLogOut
}: {
  profile: ProfileDto;
  onNavigateToProfilePage: () => void;
  onNavigateToBillingPage: () => void;
  onShowInviteTeammateModal: () => void;
  onShowSupportTickets: () => void;
  onShowCommandMenu: () => void;
  onLogOut: () => void;
}): React.JSX.Element {
  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="truncate text-sm font-medium leading-none">
            {profile.name}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {profile.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={onNavigateToProfilePage}>
          Profile
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        {isWorkspaceOwner(profile) ? (
          <>
            <DropdownMenuItem onClick={onNavigateToBillingPage}>
              Billing
              <DropdownMenuShortcut>⇧⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowInviteTeammateModal}>
              Invite team member
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem onClick={onShowSupportTickets}>
          Account issues
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={getDocsUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowCommandMenu}>
          Command Menu
          <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogOut}>
        Log out
        <DropdownMenuShortcut>⇧⌘L</DropdownMenuShortcut>
      </DropdownMenuItem>
    </>
  );
}

export function NavUser({
  profile,
  variant = 'sidebar',
  className,
  ...other
}: NavUserProps): React.JSX.Element {
  const router = useRouter();

  const handleNavigateToProfilePage = (): void => {
    router.push(Routes.Profile);
  };
  const handleNavigateToBillingPage = (): void => {
    router.push(Routes.Billing);
  };
  const handleShowCommandMenu = (): void => {
    NiceModal.show(CommandMenu, { profile });
  };
  const handleShowSupportTickets = (): void => {
    NiceModal.show(UserTicketsSheet);
  };
  const handleShowInviteTeammateModal = (): void => {
    NiceModal.show(InviteTeammateModal, { profile });
  };
  const handleLogOut = async (): Promise<void> => {
    const result = await logOut({ redirect: true });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't log out");
    }
  };

  React.useEffect(() => {
    const mac = isMac();
    const hotkeys: Record<string, { action: () => void; shift: boolean }> = {
      p: { action: handleNavigateToProfilePage, shift: true },
      b: { action: handleNavigateToBillingPage, shift: true },
      k: { action: handleShowCommandMenu, shift: false },
      l: { action: handleLogOut, shift: true }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDialogOpen() || isInputFocused()) return;

      const modifierKey = mac ? e.metaKey : e.ctrlKey;
      if (!modifierKey) return;

      const hotkey = hotkeys[e.key];
      if (!hotkey) return;
      if (hotkey.shift && !e.shiftKey) return;

      e.preventDefault();
      hotkey.action();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuContent = (
    <ProfileMenuContent
      profile={profile}
      onNavigateToProfilePage={handleNavigateToProfilePage}
      onNavigateToBillingPage={handleNavigateToBillingPage}
      onShowInviteTeammateModal={handleShowInviteTeammateModal}
      onShowSupportTickets={handleShowSupportTickets}
      onShowCommandMenu={handleShowCommandMenu}
      onLogOut={() => void handleLogOut()}
    />
  );

  if (variant === 'navbar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'size-9 shrink-0 rounded-full p-0 hover:bg-accent/60',
              className
            )}
            aria-label="Open profile menu"
          >
            <Avatar className="size-8 rounded-full ring-1 ring-border/60">
              <AvatarImage
                src={profile.image}
                alt={profile.name}
              />
              <AvatarFallback className="rounded-full text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="end"
          forceMount
        >
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarGroup
      className={className}
      {...other}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="-ml-1.5 transition-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:!p-1">
                <Avatar className="size-7 rounded-full">
                  <AvatarImage
                    src={profile.image}
                    alt={profile.name}
                  />
                  <AvatarFallback className="rounded-full">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium leading-none">
                  {profile.name}
                </span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="start"
              forceMount
            >
              {menuContent}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
