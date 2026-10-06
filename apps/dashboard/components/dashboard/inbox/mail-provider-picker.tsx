'use client';

import * as React from 'react';
import { MailIcon, SearchIcon } from '@humaner/shared/icons';
import {
  certificationHoldProviders,
  mailProviderAwaitingCertification
} from '@humaner/shared/mail-providers';

import { CertificationHoldNote } from '@/components/dashboard/inbox/certification-hold-note';
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
  /**
   * Connected row click — open that provider to edit or remove mailboxes.
   * Falls back to `onChange` when omitted.
   */
  onSelectConnected?: (providerId: string) => void;
};

const CUSTOM_IMAP_ID = 'custom';

function logoDomainOf(provider: MailProviderDefinition): string | undefined {
  return provider.logoDomain === 'humaner.io' ? undefined : provider.logoDomain;
}

function isConnectable(provider: MailProviderDefinition): boolean {
  return provider.imapAvailable || provider.oauthAvailable;
}

export function MailProviderPicker({
  value,
  onChange,
  connectedProviderIds = [],
  onSelectConnected
}: MailProviderPickerProps): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const connectedSet = React.useMemo(
    () => new Set(connectedProviderIds),
    [connectedProviderIds]
  );

  const available = React.useMemo(() => {
    const groups = getMailProvidersGrouped({ featuredOnly: true });
    const availableProviders: MailProviderDefinition[] = [];
    for (const group of groups) {
      for (const provider of group.providers) {
        if (mailProviderAwaitingCertification(provider)) continue;
        if (isConnectable(provider)) availableProviders.push(provider);
      }
    }
    return availableProviders;
  }, []);

  const matches = React.useCallback(
    (provider: MailProviderDefinition) =>
      !normalizedQuery || provider.name.toLowerCase().includes(normalizedQuery),
    [normalizedQuery]
  );

  const connected = React.useMemo(
    () =>
      MAIL_PROVIDERS.filter(
        (provider) => connectedSet.has(provider.id) && matches(provider)
      ),
    [connectedSet, matches]
  );

  const addable = React.useMemo(
    () =>
      available.filter(
        (provider) => !connectedSet.has(provider.id) && matches(provider)
      ),
    [available, connectedSet, matches]
  );

  const customImap = React.useMemo(
    () => MAIL_PROVIDERS.find((provider) => provider.id === CUSTOM_IMAP_ID),
    []
  );

  const held = React.useMemo(
    () =>
      certificationHoldProviders(MAIL_PROVIDERS).filter(
        (provider) => !connectedSet.has(provider.id) && matches(provider)
      ),
    [connectedSet, matches]
  );

  const nothingFound =
    connected.length === 0 && addable.length === 0 && held.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search providers"
            className="h-9 pl-9 font-mono text-sm"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-3">
          {connected.length > 0 ? (
            <section className="space-y-2">
              <SectionLabel>Connected</SectionLabel>
              <ul className="flex flex-wrap gap-1.5">
                {connected.map((provider) => (
                  <li key={provider.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isConnectable(provider)) return;
                        if (onSelectConnected) {
                          onSelectConnected(provider.id);
                          return;
                        }
                        onChange(provider.id);
                      }}
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-md border border-border/60 pl-1.5 pr-2 text-xs transition-colors',
                        value === provider.id
                          ? 'bg-muted ring-1 ring-foreground/10'
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <BrandLogo
                        domain={logoDomainOf(provider)}
                        fallbackIcon={MailIcon}
                        size={16}
                        className="size-4"
                      />
                      <span className="max-w-[9rem] truncate">
                        {provider.name}
                      </span>
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                        aria-label="Connected"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {addable.length > 0 ? (
            <section className="space-y-2">
              <SectionLabel>Add a provider</SectionLabel>
              <ul className="grid grid-cols-3 gap-1.5">
                {addable.map((provider) => (
                  <li key={provider.id}>
                    <ProviderTile
                      provider={provider}
                      selected={value === provider.id}
                      onSelect={() => onChange(provider.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {nothingFound ? (
            <div className="space-y-3 px-1 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                No provider matches “{query.trim()}”.
              </p>
              {customImap ? (
                <button
                  type="button"
                  onClick={() => onChange(customImap.id)}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground underline-offset-4 hover:underline"
                >
                  Use Custom IMAP
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {held.length > 0 ? (
        <CertificationHoldNote
          providers={held}
          className="shrink-0 border-t px-3 py-2.5"
        />
      ) : null}
    </div>
  );
}

function SectionLabel({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <p className="shrink-0 px-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function ProviderTile({
  provider,
  selected,
  onSelect
}: {
  provider: MailProviderDefinition;
  selected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={provider.name}
      className={cn(
        'flex h-[4.5rem] w-full flex-col items-center justify-center gap-2 rounded-md border px-1.5 text-center transition-colors',
        selected
          ? 'border-foreground/20 bg-muted'
          : 'border-border/50 hover:border-border hover:bg-muted/50'
      )}
    >
      <BrandLogo
        domain={logoDomainOf(provider)}
        fallbackIcon={MailIcon}
        size={24}
        className="size-6"
      />
      <span className="line-clamp-1 w-full text-[11px] leading-tight">
        {provider.name}
      </span>
    </button>
  );
}
