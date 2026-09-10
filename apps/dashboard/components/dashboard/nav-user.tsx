'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { CheckIcon, PlusIcon } from '@humaner/shared/icons';
import { WorkspaceRole } from '@prisma/client';
import { ExitIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import { logOut } from '@/actions/auth/log-out';
import { switchWorkspace } from '@/actions/workspaces/switch-workspace';
import { CommandMenu } from '@/components/dashboard/command-menu';
import { CreateWorkspaceModal } from '@/components/dashboard/workspace/create-workspace-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { adminProfileItems } from '@/constants/nav-items';
import { Routes } from '@/constants/routes';
import { isPlatformAdmin, isWorkspaceOwner } from '@/lib/auth/workspace-access';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { isDialogOpen } from '@/lib/browser/is-dialog-open';
import { isInputFocused } from '@/lib/browser/is-input-focused';
import { isMac } from '@/lib/browser/is-mac';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn, getInitials } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavUserProps = {
  profile: ProfileDto;
  workspaces: UserWorkspaceSummary[];
  planName: string;
  industryLabel: string | null;
  audienceLabel: string | null;
  className?: string;
};

function workspaceRoleLabel(role: WorkspaceRole): string {
  if (role === WorkspaceRole.OWNER) {
    return 'Workspace Owner';
  }
  return 'Teammate';
}

function MenuRow({
  label,
  href
}: {
  label: string;
  href: string;
}): React.JSX.Element {
  return (
    <DropdownMenuItem
      asChild
      className="rounded-none px-2.5 py-2"
    >
      <Link href={href}>
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}

export function NavUser({
  profile,
  workspaces,
  planName,
  industryLabel,
  audienceLabel,
  className
}: NavUserProps): React.JSX.Element {
  const router = useRouter();
  const canManageWorkspaces =
    isWorkspaceOwner(profile) || isPlatformAdmin(profile);
  const showAdminTools = isPlatformAdmin(profile);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.isActive) ?? workspaces[0];

  const handleNavigateToProfilePage = (): void => {
    router.push(Routes.Profile);
  };
  const handleNavigateToBillingPage = (): void => {
    if (
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE?.trim().toLowerCase() === 'oss'
    ) {
      return;
    }
    router.push(Routes.Billing);
  };
  const handleShowCommandMenu = (): void => {
    NiceModal.show(CommandMenu, { profile });
  };
  const handleCreateWorkspace = (): void => {
    NiceModal.show(CreateWorkspaceModal);
  };
  const handleLogOut = async (): Promise<void> => {
    const result = await logOut({ redirect: true });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't log out");
    }
  };
  const handleSwitchWorkspace = async (
    organizationId: string
  ): Promise<void> => {
    if (organizationId === activeWorkspace?.id) {
      return;
    }

    const result = await switchWorkspace({ organizationId });
    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }
    if (result?.validationErrors) {
      toast.error("Couldn't switch workspace");
      return;
    }

    toast.success('Workspace switched');
    if (result?.data?.redirectTo) {
      router.push(result.data.redirectTo);
    } else {
      router.refresh();
    }
  };

  React.useEffect(() => {
    const mac = isMac();
    const hotkeys: Record<string, { action: () => void; shift: boolean }> = {
      p: { action: handleNavigateToProfilePage, shift: true },
      b: { action: handleNavigateToBillingPage, shift: true },
      k: { action: handleShowCommandMenu, shift: false },
      l: { action: () => void handleLogOut(), shift: true }
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

  const metaParts = [audienceLabel, industryLabel].filter(Boolean);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'size-7 shrink-0 p-0 hover:bg-accent/60',
            dashboardRadiusClassName,
            className
          )}
          aria-label="Open profile menu"
        >
          <Avatar
            className={cn(
              'size-7 ring-1 ring-border/60',
              dashboardRadiusClassName
            )}
          >
            <AvatarImage
              src={profile.image}
              alt={profile.name}
              className={dashboardRadiusClassName}
            />
            <AvatarFallback
              className={cn(dashboardRadiusClassName, 'text-[10px]')}
            >
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          dashboardRadiusClassName,
          'w-72 origin-top-right overflow-hidden border border-foreground/15 bg-[#fcf4ec]/55 p-2 text-foreground shadow-[0_24px_80px_-24px_rgb(10_13_13_/_0.45)] backdrop-blur-xl',
          'dark:border-white/[0.12] dark:bg-[#0A0D0D]/55 dark:text-[#fcf4ec]'
        )}
        align="end"
        forceMount
        style={{
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.125rem) 100%, 0 100%)'
        }}
      >
        <div className="relative mb-1 overflow-hidden rounded-none border border-border/50 bg-muted/30 p-3 pr-16">
          {!isOssDeployment() ? (
            <span
              className="absolute right-2.5 top-2.5 inline-flex rounded-none px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent-color, hsl(var(--brand))) 20%, transparent)',
                color: 'var(--accent-color, hsl(var(--brand)))'
              }}
            >
              {planName}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {profile.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {workspaceRoleLabel(profile.workspaceRole)}
            </p>
            {metaParts.length > 0 ? (
              <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {metaParts.join(' · ')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="py-1">
          <MenuRow
            label="Account Settings"
            href={Routes.Profile}
          />
          {canManageWorkspaces ? (
            <MenuRow
              label="Inbox Settings"
              href={Routes.InboxSettings}
            />
          ) : null}
          {showAdminTools
            ? adminProfileItems.map((item) => (
                <MenuRow
                  key={item.href}
                  label={item.title}
                  href={item.href}
                />
              ))
            : null}
        </div>

        {canManageWorkspaces && workspaces.length > 0 ? (
          <>
            <DropdownMenuSeparator className="my-1" />
            <div className="py-1">
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  className="rounded-none px-2.5 py-2"
                  onClick={() => void handleSwitchWorkspace(workspace.id)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {workspace.name}
                  </span>
                  {workspace.isActive ? (
                    <CheckIcon
                      className="size-4 shrink-0"
                      style={{
                        color: 'var(--accent-color, hsl(var(--brand)))'
                      }}
                    />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="justify-between gap-2 rounded-none px-2.5 py-2"
                onClick={handleCreateWorkspace}
              >
                <span>New Workspace</span>
                <PlusIcon
                  className="size-4 shrink-0"
                  style={{
                    color: 'var(--accent-color, hsl(var(--brand)))'
                  }}
                />
              </DropdownMenuItem>
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator className="my-1" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-1 h-9 w-full justify-center gap-1.5 rounded-none bg-destructive/10 px-2 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
          onClick={() => void handleLogOut()}
        >
          Log out
          <ExitIcon className="size-3.5 shrink-0" />
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
