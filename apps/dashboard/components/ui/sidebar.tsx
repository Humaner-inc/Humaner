'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon } from '@humaner/shared/icons';
import { Slot } from '@radix-ui/react-slot';
import { cva, VariantProps } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { ChevronsLeftRightIcon } from '@/components/ui/chevrons-left-right-icon';
import { ChevronsRightLeftIcon } from '@/components/ui/chevrons-right-left-icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

const sidebarNavLabelClassName = 'font-mono uppercase tracking-wide';

const SIDEBAR_COOKIE_NAME = 'sidebar:state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '15rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '4rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const MOBILE_BREAKPOINT = 1024;
export const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT = 1280;

type SidebarContext = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  desktopUp: boolean;
  isOverlayExpanded: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar(): SidebarContext {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

export type SidebarProviderElement = HTMLDivElement;
export type SidebarProviderProps = React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
const SidebarProvider = React.forwardRef<
  SidebarProviderElement,
  SidebarProviderProps
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`, {
      ssr: true,
      fallback: false
    });
    const desktopUp = useMediaQuery(
      `(min-width: ${SIDEBAR_AUTO_COLLAPSE_BREAKPOINT}px)`,
      { ssr: true, fallback: true }
    );
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      setOpen((value) => !value);
    }, [setOpen]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    // Auto expand/collapse when crossing breakpoints (docs-style).
    React.useEffect(() => {
      if (isMobile) {
        setOpen(false);
        return;
      }
      setOpen(desktopUp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desktopUp, isMobile]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';
    const isOverlayExpanded = open && (isMobile || !desktopUp);

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        desktopUp,
        isOverlayExpanded,
        openMobile,
        setOpenMobile,
        toggleSidebar
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        desktopUp,
        isOverlayExpanded,
        openMobile,
        setOpenMobile,
        toggleSidebar
      ]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style
              } as React.CSSProperties
            }
            className={cn(
              'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

export type SidebarElement = HTMLDivElement;
export type SidebarProps = React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};
const Sidebar = React.forwardRef<SidebarElement, SidebarProps>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();
    const { isMobile, state, openMobile, setOpenMobile, isOverlayExpanded } =
      useSidebar();
    const isIconCollapsible = collapsible === 'icon';
    const isExpanded = state === 'expanded';

    React.useEffect(() => {
      setOpenMobile(false);
    }, [pathname, setOpenMobile]);

    if (collapsible === 'none') {
      return (
        <div
          className={cn(
            'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isIconCollapsible) {
      const panelWidthClass = isExpanded
        ? 'w-[--sidebar-width]'
        : 'w-[--sidebar-width-icon]';
      const sideBorderClass =
        side === 'left'
          ? 'border-r border-sidebar-border'
          : 'border-l border-sidebar-border';

      if (isOverlayExpanded) {
        return (
          <div
            ref={ref}
            className="group peer block w-[--sidebar-width-icon] shrink-0 text-sidebar-foreground"
            data-state={state}
            data-collapsible=""
            data-variant={variant}
            data-side={side}
          >
            <div
              className={cn(
                'fixed inset-y-0 z-40 flex h-svh w-[--sidebar-width] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] transition-[left,right,width] duration-200 ease-linear',
                side === 'left' ? 'left-0' : 'right-0',
                className
              )}
              {...props}
            >
              <div
                data-sidebar="sidebar"
                className={cn(
                  'flex size-full flex-col bg-sidebar',
                  sideBorderClass
                )}
              >
                {children}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          ref={ref}
          className={cn(
            'group peer block h-svh shrink-0 overflow-hidden text-sidebar-foreground transition-[width] duration-200 ease-linear',
            panelWidthClass
          )}
          data-state={state}
          data-collapsible={state === 'collapsed' ? collapsible : ''}
          data-variant={variant}
          data-side={side}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              'flex h-full flex-col bg-sidebar',
              panelWidthClass,
              sideBorderClass,
              variant === 'floating' &&
                'rounded-lg border border-sidebar-border shadow',
              className
            )}
            {...props}
          >
            {children}
          </div>
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet
          open={openMobile}
          onOpenChange={setOpenMobile}
          {...props}
        >
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH_MOBILE
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Mobile menu</SheetDescription>
            <div className="flex size-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground lg:block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* Offcanvas / legacy fixed sidebar */}
        <div
          className={cn(
            'relative h-svh bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            'w-[--sidebar-width]',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
          )}
        />
        <div
          className={cn(
            'fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export type SidebarTriggerElement = React.ElementRef<typeof Button>;
export type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon?:
    | 'chevronsLeftRight'
    | 'chevronsRightLeft'
    | 'chevronRight'
    /** @deprecated Use `chevronsLeftRight` */
    | 'menu'
    /** @deprecated Use `chevronsRightLeft` */
    | 'chevronLeft';
};
const SidebarTrigger = React.forwardRef<
  SidebarTriggerElement,
  SidebarTriggerProps
>(({ className, onClick, icon = 'chevronsLeftRight', ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  const resolvedIcon =
    icon === 'menu'
      ? 'chevronsLeftRight'
      : icon === 'chevronLeft'
        ? 'chevronsRightLeft'
        : icon;

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn('size-9', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {resolvedIcon === 'chevronsRightLeft' ? (
        <ChevronsRightLeftIcon
          className="shrink-0 text-current"
          size={16}
        />
      ) : resolvedIcon === 'chevronRight' ? (
        <ChevronRightIcon
          className="size-4 shrink-0"
          animateOnHover={false}
        />
      ) : (
        <ChevronsLeftRightIcon
          className="shrink-0 text-current"
          size={16}
        />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export type SidebarRailElement = React.ElementRef<typeof Button>;
export type SidebarRailProps = React.ComponentProps<'button'>;
const SidebarRail = React.forwardRef<SidebarRailElement, SidebarRailProps>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
          '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
          '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
          'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
          '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
          '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = 'SidebarRail';

export type SidebarInsetElement = HTMLDivElement;
export type SidebarInsetProps = React.ComponentProps<'main'>;
const SidebarInset = React.forwardRef<SidebarInsetElement, SidebarInsetProps>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      className={cn(
        'relative flex min-h-svh flex-1 flex-col bg-background',
        'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
        className
      )}
      {...props}
    />
  )
);
SidebarInset.displayName = 'SidebarInset';

export type SidebarInputElement = React.ElementRef<typeof Input>;
export type SidebarInputProps = React.ComponentProps<typeof Input>;
const SidebarInput = React.forwardRef<SidebarInputElement, SidebarInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        'h-9 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        className
      )}
      {...props}
    />
  )
);
SidebarInput.displayName = 'SidebarInput';

export type SidebarHeaderElement = HTMLDivElement;
export type SidebarHeaderProps = React.ComponentProps<'div'>;
const SidebarHeader = React.forwardRef<
  SidebarHeaderElement,
  SidebarHeaderProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn('flex flex-col gap-2 p-3', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

export type SidebarFooterElement = HTMLDivElement;
export type SidebarFooterProps = React.ComponentProps<'div'>;
const SidebarFooter = React.forwardRef<
  SidebarFooterElement,
  SidebarFooterProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn('flex flex-col gap-2 p-3', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

export type SidebarSeparatorElement = React.ElementRef<typeof Separator>;
export type SidebarSeparatorProps = React.ComponentProps<typeof Separator>;
const SidebarSeparator = React.forwardRef<
  SidebarSeparatorElement,
  SidebarSeparatorProps
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    data-sidebar="separator"
    className={cn('mx-2 w-auto bg-sidebar-border', className)}
    {...props}
  />
));
SidebarSeparator.displayName = 'SidebarSeparator';

export type SidebarContentElement = HTMLDivElement;
export type SidebarContentProps = React.ComponentProps<'div'>;
const SidebarContent = React.forwardRef<
  SidebarContentElement,
  SidebarContentProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn(
      'flex min-h-0 flex-1 flex-col gap-3 overflow-auto group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden',
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export type SidebarGroupElement = HTMLDivElement;
export type SidebarGroupProps = React.ComponentProps<'div'>;
const SidebarGroup = React.forwardRef<SidebarGroupElement, SidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-3', className)}
      {...props}
    />
  )
);
SidebarGroup.displayName = 'SidebarGroup';

export type SidebarGroupLabelElement = HTMLDivElement;
export type SidebarGroupLabelProps = React.ComponentProps<'div'> & {
  asChild?: boolean;
};
const SidebarGroupLabel = React.forwardRef<
  SidebarGroupLabelElement,
  SidebarGroupLabelProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        'flex h-9 shrink-0 items-center rounded-md px-2.5 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export type SidebarGroupActionElement = HTMLButtonElement;
export type SidebarGroupActionProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
};
const SidebarGroupAction = React.forwardRef<
  SidebarGroupActionElement,
  SidebarGroupActionProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        'absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 after:md:hidden',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = 'SidebarGroupAction';

export type SidebarGroupContentElement = HTMLDivElement;
export type SidebarGroupContentProps = React.ComponentProps<'div'>;
const SidebarGroupContent = React.forwardRef<
  SidebarGroupContentElement,
  SidebarGroupContentProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn('w-full text-sm', className)}
    {...props}
  />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

export type SidebarMenuElement = HTMLUListElement;
export type SidebarMenuProps = React.ComponentProps<'ul'>;
const SidebarMenu = React.forwardRef<SidebarMenuElement, SidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
);
SidebarMenu.displayName = 'SidebarMenu';

export type SidebarMenuItemElement = HTMLLIElement;
export type SidebarMenuItemProps = React.ComponentProps<'li'>;
const SidebarMenuItem = React.forwardRef<
  SidebarMenuItemElement,
  SidebarMenuItemProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const sidebarMenuButtonVariants = cva(
  cn(
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden p-2.5 text-left text-[11px] outline-none ring-sidebar-ring transition-[width,height,padding,color,background-color] duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-1 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-2.5 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
    dashboardRadiusClassName,
    sidebarNavLabelClassName
  ),
  {
    variants: {
      variant: {
        default: [
          'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          'data-[active=true]:border-l-2 data-[active=true]:border-[var(--accent-color,hsl(var(--brand)))] data-[active=true]:bg-[color-mix(in_srgb,var(--accent-color,hsl(var(--brand)))_8%,transparent)] data-[active=true]:pl-[calc(0.625rem-2px)] data-[active=true]:font-medium data-[active=true]:text-foreground data-[active=true]:[&_svg]:text-foreground'
        ],
        section: [
          'text-muted-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
          'data-[active=true]:font-medium data-[active=true]:text-foreground',
          'data-[active=true]:[&_svg]:text-foreground',
          'group-data-[collapsible=icon]:data-[active=true]:bg-[color-mix(in_srgb,var(--accent-color,hsl(var(--brand)))_10%,transparent)]'
        ],
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]'
      },
      size: {
        default: 'h-9 text-xs',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-xs group-data-[collapsible=icon]:!p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type SidebarMenuButtonElement = HTMLButtonElement;
export type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;
const SidebarMenuButton = React.forwardRef<
  SidebarMenuButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = 'default',
      size = 'default',
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === 'string') {
      tooltip = {
        children: tooltip
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== 'collapsed' || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export type SidebarMenuActionElement = HTMLButtonElement;
export type SidebarMenuActionProps = React.ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
};
const SidebarMenuAction = React.forwardRef<
  SidebarMenuActionElement,
  SidebarMenuActionProps
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        'absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 after:md:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-active-foreground md:opacity-0',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = 'SidebarMenuAction';

export type SidebarMenuBadgeElement = HTMLDivElement;
export type SidebarMenuBadgeProps = React.ComponentProps<'div'>;
const SidebarMenuBadge = React.forwardRef<
  SidebarMenuBadgeElement,
  SidebarMenuBadgeProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      'pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-mono text-xs font-medium tabular-nums text-sidebar-foreground',
      'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-active-foreground',
      'peer-data-[size=sm]/menu-button:top-1',
      'peer-data-[size=default]/menu-button:top-1.5',
      'peer-data-[size=lg]/menu-button:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      className
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = 'SidebarMenuBadge';

export type SidebarMenuSkeletonElement = HTMLDivElement;
export type SidebarMenuSkeletonProps = React.ComponentProps<'div'> & {
  showIcon?: boolean;
};
const SidebarMenuSkeleton = React.forwardRef<
  SidebarMenuSkeletonElement,
  SidebarMenuSkeletonProps
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn('flex h-9 items-center gap-2 rounded-md px-2.5', className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-[--skeleton-width] flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton';

export type SidebarMenuSubElement = HTMLUListElement;
export type SidebarMenuSubProps = React.ComponentProps<'ul'>;
const SidebarMenuSub = React.forwardRef<
  SidebarMenuSubElement,
  SidebarMenuSubProps
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
      'group-data-[collapsible=icon]:hidden',
      className
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = 'SidebarMenuSub';

export type SidebarMenuSubItemElement = HTMLLIElement;
export type SidebarMenuSubItemProps = React.ComponentProps<'li'>;
const SidebarMenuSubItem = React.forwardRef<
  SidebarMenuSubItemElement,
  SidebarMenuSubItemProps
>(({ ...props }, ref) => (
  <li
    ref={ref}
    {...props}
  />
));
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

export type SidebarMenuSubButtonElement = HTMLAnchorElement;
export type SidebarMenuSubButtonProps = React.ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
  variant?: 'default' | 'branch';
};
const SidebarMenuSubButton = React.forwardRef<
  SidebarMenuSubButtonElement,
  SidebarMenuSubButtonProps
>(
  (
    {
      asChild = false,
      size = 'md',
      isActive,
      variant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        data-sidebar="menu-sub-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2.5 text-sidebar-foreground outline-none ring-sidebar-ring focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
          variant === 'default' && [
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground',
            'data-[active=true]:bg-sidebar-active data-[active=true]:font-medium data-[active=true]:text-sidebar-active-foreground data-[active=true]:shadow-sm data-[active=true]:[&_svg]:text-sidebar-active-foreground'
          ],
          variant === 'branch' && [
            'hover:bg-sidebar-accent/50 [&>svg]:text-muted-foreground hover:[&>svg]:text-foreground/80',
            'data-[active=true]:bg-transparent data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-none data-[active=true]:hover:bg-transparent data-[active=true]:[&_svg]:text-[var(--accent-color,hsl(var(--brand)))]'
          ],
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          'group-data-[collapsible=icon]:hidden',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
};
