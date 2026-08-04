'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { switchWorkspace } from '@/actions/workspaces/switch-workspace';
import { CreateWorkspaceModal } from '@/components/dashboard/workspace/create-workspace-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import type { UserWorkspaceSummary } from '@/lib/auth/workspace-membership';
import { getLogoUrl, toHostname } from '@/lib/logo';
import { cn } from '@/lib/utils';

export type WorkspaceSwitcherProps = {
  workspaces: UserWorkspaceSummary[];
  variant?: 'navbar' | 'sidebar';
  className?: string;
};

function resolveWorkspaceLogo(workspace: UserWorkspaceSummary): string | null {
  if (workspace.logoUrl) {
    return workspace.logoUrl;
  }
  if (!workspace.website) {
    return null;
  }
  const domain = toHostname(workspace.website);
  if (!domain) {
    return null;
  }
  return getLogoUrl(domain, 64, true);
}

export function WorkspaceAvatar({
  workspace,
  className,
  rounded = 'none'
}: {
  workspace: UserWorkspaceSummary;
  className?: string;
  rounded?: 'none' | 'full';
}): React.JSX.Element {
  const logoUrl = resolveWorkspaceLogo(workspace);
  const initial = workspace.name.trim().charAt(0).toUpperCase() || 'W';
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-none';

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={cn(
          'size-8 object-cover ring-1 ring-border/50',
          radius,
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex size-8 items-center justify-center bg-gradient-to-br from-violet-500 to-rose-500 text-xs font-semibold text-white ring-1 ring-border/40',
        radius,
        className
      )}
    >
      {initial}
    </span>
  );
}

export function WorkspaceSwitcher({
  workspaces,
  variant = 'navbar',
  className
}: WorkspaceSwitcherProps): React.JSX.Element | null {
  const router = useRouter();
  const active =
    workspaces.find((workspace) => workspace.isActive) ?? workspaces[0];

  if (!active) {
    return null;
  }

  const handleSwitch = async (organizationId: string): Promise<void> => {
    if (organizationId === active.id) {
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

  const handleCreateWorkspace = (): void => {
    NiceModal.show(CreateWorkspaceModal);
  };

  const menuContent = (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Workspaces
      </DropdownMenuLabel>
      {workspaces.map((workspace) => (
        <DropdownMenuItem
          key={workspace.id}
          className="gap-2"
          onClick={() => void handleSwitch(workspace.id)}
        >
          <WorkspaceAvatar workspace={workspace} />
          <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
          {workspace.isActive ? (
            <CheckIcon className="size-4 shrink-0 text-primary" />
          ) : null}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="gap-2"
        onClick={handleCreateWorkspace}
      >
        <span className="flex size-8 items-center justify-center rounded-none border border-dashed border-border/80">
          <PlusIcon className="size-4" />
        </span>
        Create workspace
      </DropdownMenuItem>
    </>
  );

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <SidebarGroup
          className={cn(
            'p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center',
            className
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={active.name}
                  className="h-auto min-w-0 gap-3 rounded-none border border-sidebar-border/70 bg-sidebar-accent/25 p-2.5 transition-none hover:bg-sidebar-accent/45 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:hover:bg-sidebar-accent/50"
                >
                  <WorkspaceAvatar workspace={active} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
                    {active.name}
                  </span>
                  <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={8}
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none"
        >
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'h-auto gap-2 rounded-none border border-border/60 bg-card/40 px-2.5 py-1.5 hover:bg-accent/50',
            'w-auto max-w-[min(100vw-12rem,16rem)] justify-center',
            className
          )}
        >
          <WorkspaceAvatar workspace={active} />
          <span className="min-w-0 truncate text-sm font-medium">
            {active.name}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="top"
        sideOffset={8}
        className="w-72 rounded-none"
      >
        {menuContent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
