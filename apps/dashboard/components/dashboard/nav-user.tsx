'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { CreditCardIcon, StoreIcon, UserIcon } from '@humaner/shared/icons';
import type { LucideIcon } from '@humaner/shared/icons';
import { WorkspaceRole } from '@prisma/client';
import { ExitIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import { logOut } from '@/actions/auth/log-out';
import { CommandMenu } from '@/components/dashboard/command-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Routes } from '@/constants/routes';
import { isWorkspaceAdmin } from '@/lib/auth/workspace-access';
import { isDialogOpen } from '@/lib/browser/is-dialog-open';
import { isInputFocused } from '@/lib/browser/is-input-focused';
import { isMac } from '@/lib/browser/is-mac';
import {
  dashboardItemRadiusClassName,
  dashboardRadiusClassName
} from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn, getInitials } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavUserProps = {
  profile: ProfileDto;
  planName: string;
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
  href,
  icon: Icon
}: {
  label: string;
  href: string;
  icon: LucideIcon;
}): React.JSX.Element {
  return (
    <DropdownMenuItem
      asChild
      className={cn(dashboardItemRadiusClassName, 'px-2.5 py-2')}
    >
      <Link
        href={href}
        className="flex items-center gap-2"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}

export function NavUser({
  profile,
  planName,
  audienceLabel,
  className
}: NavUserProps): React.JSX.Element {
  const router = useRouter();
  const showBilling = isWorkspaceAdmin(profile) && !isOssDeployment();

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

  const metaParts = [audienceLabel].filter(Boolean);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'size-7 shrink-0 rounded-lg p-0 hover:bg-accent/60',
            className
          )}
          aria-label="Open profile menu"
        >
          <Avatar className="size-7 ring-1 ring-border/60">
            <AvatarImage
              src={profile.image}
              alt={profile.name}
            />
            <AvatarFallback className="text-[10px]">
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
      >
        <div
          className={cn(
            dashboardItemRadiusClassName,
            'relative mb-1 overflow-hidden border border-border/50 bg-muted/30 p-3 pr-16'
          )}
        >
          {!isOssDeployment() ? (
            <span
              className={cn(
                dashboardItemRadiusClassName,
                'absolute right-2.5 top-2.5 inline-flex px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide'
              )}
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
            label="Account"
            href={Routes.Profile}
            icon={UserIcon}
          />
          <MenuRow
            label="Workspace"
            href={Routes.InboxSettings}
            icon={StoreIcon}
          />
          {showBilling ? (
            <MenuRow
              label="Billing"
              href={Routes.Billing}
              icon={CreditCardIcon}
            />
          ) : null}
        </div>

        <DropdownMenuSeparator className="my-1" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            dashboardItemRadiusClassName,
            'mt-1 h-9 w-full justify-center gap-1.5 bg-destructive/10 px-2 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive'
          )}
          onClick={() => void handleLogOut()}
        >
          Log out
          <ExitIcon className="size-3.5 shrink-0" />
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
