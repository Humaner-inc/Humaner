'use client';

import * as React from 'react';
import { CheckIcon, MailIcon, SearchIcon } from '@humaner/shared/icons';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getMailProvidersGrouped,
  MAIL_PROVIDERS,
  type MailProviderDefinition
} from '@/lib/inbox/mail-providers';
import { cn } from '@/lib/utils';

export type MailProviderPickerProps = {
  value: string | null;
  onChange: (providerId: string) => void;
  connectedProviderIds?: string[];
  /** Connected row click — edit existing mailbox instead of starting a new connect. */
  onSelectConnected?: (providerId: string) => void;
};

export function MailProviderPicker({
  value,
  onChange,
  connectedProviderIds = [],
  onSelectConnected
}: MailProviderPickerProps): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const groups = React.useMemo(() => getMailProvidersGrouped(), []);
  const normalizedQuery = query.trim().toLowerCase();
  const connectedSet = React.useMemo(
    () => new Set(connectedProviderIds),
    [connectedProviderIds]
  );

  const connectedProviders = React.useMemo(() => {
    return MAIL_PROVIDERS.filter((provider) => connectedSet.has(provider.id));
  }, [connectedSet]);

  const filteredGroups = React.useMemo(() => {
    const filterProviders = (providers: MailProviderDefinition[]) => {
      if (!normalizedQuery) return providers;
      return providers.filter((provider) =>
        provider.name.toLowerCase().includes(normalizedQuery)
      );
    };

    return groups
      .map((group) => ({
        ...group,
        providers: filterProviders(
          group.providers.filter((provider) => !connectedSet.has(provider.id))
        )
      }))
      .filter((group) => group.providers.length > 0);
  }, [groups, normalizedQuery, connectedSet]);

  const filteredConnected = React.useMemo(() => {
    if (!normalizedQuery) return connectedProviders;
    return connectedProviders.filter((provider) =>
      provider.name.toLowerCase().includes(normalizedQuery)
    );
  }, [connectedProviders, normalizedQuery]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search providers…"
            className="h-9 pl-9 font-mono text-sm"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-2">
          {filteredConnected.length > 0 ? (
            <section className="space-y-1">
              <p className="px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Connected
              </p>
              <ul className="space-y-0.5">
                {filteredConnected.map((provider) => (
                  <ProviderListItem
                    key={provider.id}
                    provider={provider}
                    selected={value === provider.id}
                    connected
                    onSelect={() => {
                      if (onSelectConnected) {
                        onSelectConnected(provider.id);
                        return;
                      }
                      if (provider.imapAvailable) onChange(provider.id);
                    }}
                  />
                ))}
              </ul>
              {filteredGroups.length > 0 ? (
                <div
                  className="mx-2 my-3 border-t border-border/70"
                  role="separator"
                />
              ) : null}
            </section>
          ) : null}

          {filteredGroups.map((group) => (
            <section
              key={group.category}
              className="space-y-1"
            >
              <p className="px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.providers.map((provider) => (
                  <ProviderListItem
                    key={provider.id}
                    provider={provider}
                    selected={value === provider.id}
                    onSelect={() => {
                      if (provider.imapAvailable) onChange(provider.id);
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ProviderListItem({
  provider,
  selected,
  connected,
  onSelect
}: {
  provider: MailProviderDefinition;
  selected: boolean;
  connected?: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const disabled = !provider.imapAvailable;

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors',
          selected
            ? 'bg-muted font-medium ring-1 ring-foreground/10'
            : 'hover:bg-muted/60',
          disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent'
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border/60">
          <BrandLogo
            domain={provider.logoDomain}
            fallbackIcon={MailIcon}
            size={28}
            className="size-5"
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm leading-tight">
          {provider.name}
        </span>
        {connected ? (
          <CheckIcon
            className="size-3.5 shrink-0 text-emerald-600"
            aria-label="Connected"
          />
        ) : null}
        {disabled && provider.unavailableLabel ? (
          <span className="shrink-0 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
            {provider.unavailableLabel}
          </span>
        ) : null}
      </button>
    </li>
  );
}
