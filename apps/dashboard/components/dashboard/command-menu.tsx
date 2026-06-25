'use client';

import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  accountNavItems,
  mainNavItems,
  organizationNavItems
} from '@/constants/nav-items';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';

const navigationGroups = [
  {
    heading: 'Main Navigation',
    items: mainNavItems
  },
  {
    heading: 'Account',
    items: accountNavItems
  },
  {
    heading: 'Organization',
    items: organizationNavItems
  }
];

export const CommandMenu = NiceModal.create(() => {
  const modal = useEnhancedModal();
  const router = useRouter();
  return (
    <CommandDialog
      open={modal.visible}
      onOpenChange={modal.handleOpenChange}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navigationGroups.map((group) => (
          <CommandGroup
            key={group.heading}
            heading={group.heading}
          >
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  modal.handleClose();
                }}
              >
                <item.icon className="mr-2 !h-4 !w-4 shrink-0 text-muted-foreground" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
});
