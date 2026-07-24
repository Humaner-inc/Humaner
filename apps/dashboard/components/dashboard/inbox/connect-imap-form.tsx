'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  CheckIcon,
  CopyIcon,
  MailIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { connectImap } from '@/actions/inbox/connect-imap';
import { deleteMailboxConnection } from '@/actions/inbox/delete-mailbox-connection';
import { discoverImapAliases } from '@/actions/inbox/discover-imap-aliases';
import { InboxOptionalNotice } from '@/components/dashboard/inbox/inbox-optional-notice';
import { MailProviderPicker } from '@/components/dashboard/inbox/mail-provider-picker';
import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Routes } from '@/constants/routes';
import type { ConnectedMailboxItem } from '@/data/inbox/get-mail-threads';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  getMailProviderById,
  resolveMailProviderPreset
} from '@/lib/inbox/mail-providers';
import { cn } from '@/lib/utils';
import type { DiscoverImapAliasesInput } from '@/schemas/inbox/connect-imap-schema';

type ConnectStep = 'credentials' | 'aliases';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function InboxLoadingDots(): React.JSX.Element {
  return (
    <span
      className="inline-flex gap-px text-muted-foreground/55"
      aria-hidden
    >
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="inbox-loading-dot inline-block"
          style={{ animationDelay: `${delay}ms` }}
        >
          .
        </span>
      ))}
    </span>
  );
}

export function ConnectImapForm({
  aliasLimit,
  aliasCount,
  connectedProviderIds = [],
  connections = []
}: {
  aliasLimit: number;
  aliasCount: number;
  connectedProviderIds?: string[];
  connections?: ConnectedMailboxItem[];
}): React.JSX.Element {
  const router = useRouter();
  const remaining = Math.max(0, aliasLimit - aliasCount);
  const [step, setStep] = React.useState<ConnectStep>('credentials');
  const [providerId, setProviderId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [smtpSameAsImap, setSmtpSameAsImap] = React.useState(true);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [discoveredAliases, setDiscoveredAliases] = React.useState<string[]>(
    []
  );
  const [selectedAliases, setSelectedAliases] = React.useState<string[]>([]);
  const [manualAlias, setManualAlias] = React.useState('');
  const [imapHost, setImapHost] = React.useState('');
  const [imapPort, setImapPort] = React.useState('993');
  const [smtpHost, setSmtpHost] = React.useState('');
  const [smtpPort, setSmtpPort] = React.useState('465');
  const [smtpUser, setSmtpUser] = React.useState('');
  const [smtpPassword, setSmtpPassword] = React.useState('');
  const [pendingRemove, setPendingRemove] =
    React.useState<ConnectedMailboxItem | null>(null);
  const [removeConfirmEmail, setRemoveConfirmEmail] = React.useState('');
  const [copiedMailboxEmail, setCopiedMailboxEmail] = React.useState(false);
  const copyToClipboard = useCopyToClipboard();

  React.useEffect(() => {
    setRemoveConfirmEmail('');
    setCopiedMailboxEmail(false);
  }, [pendingRemove?.id]);

  const selectedProvider = providerId ? getMailProviderById(providerId) : null;
  const preset = providerId ? resolveMailProviderPreset(providerId) : null;
  const primaryEmail = normalizeEmail(email);

  const aliasOptions = React.useMemo(() => {
    const options = new Set(discoveredAliases);
    if (primaryEmail.includes('@')) {
      options.add(primaryEmail);
    }
    for (const address of selectedAliases) {
      options.add(address);
    }
    return [...options].sort((left, right) => left.localeCompare(right));
  }, [discoveredAliases, primaryEmail, selectedAliases]);

  React.useEffect(() => {
    if (!selectedProvider) return;

    if (selectedProvider.requiresCustomHosts) {
      setShowAdvanced(true);
      return;
    }

    if (!preset || showAdvanced) return;

    setImapHost(preset.imapHost);
    setImapPort(String(preset.imapPort));
    setSmtpHost(preset.smtpHost);
    setSmtpPort(String(preset.smtpPort));
  }, [selectedProvider, preset, showAdvanced]);

  React.useEffect(() => {
    setStep('credentials');
    setDiscoveredAliases([]);
    setSelectedAliases([]);
    setManualAlias('');
  }, [providerId]);

  const buildCredentialsInput = (): DiscoverImapAliasesInput | null => {
    if (!providerId) return null;

    return {
      providerId,
      email,
      password,
      smtpSameAsImap,
      showAdvanced:
        showAdvanced || Boolean(selectedProvider?.requiresCustomHosts),
      imapHost: imapHost || undefined,
      imapPort: imapPort ? Number(imapPort) : undefined,
      imapTls: true,
      smtpHost: smtpHost || undefined,
      smtpPort: smtpPort ? Number(smtpPort) : undefined,
      smtpTls: true,
      smtpUser: smtpSameAsImap ? undefined : smtpUser,
      smtpPassword: smtpSameAsImap ? undefined : smtpPassword
    };
  };

  const { execute: discoverAliases, isExecuting: isDiscovering } = useAction(
    discoverImapAliases,
    {
      onSuccess: ({ data }) => {
        const aliases = data?.aliases ?? [];
        const primary = data?.primary ?? primaryEmail;
        setDiscoveredAliases(aliases);
        setSelectedAliases([primary]);
        setStep('aliases');

        if (aliases.length <= 1) {
          toast.message(
            'No extra aliases found in recent mail. Add any addresses manually below.'
          );
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not scan mailbox aliases');
      }
    }
  );

  const { execute, isExecuting } = useAction(connectImap, {
    onSuccess: ({ data }) => {
      toast.success(
        `Connected — ${data?.aliasCount ?? 1} alias${(data?.aliasCount ?? 1) === 1 ? '' : 'es'} ready`
      );
      router.push(Routes.InboxAliases);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not connect mailbox');
    }
  });

  const { execute: removeConnection, isExecuting: isRemoving } = useAction(
    deleteMailboxConnection,
    {
      onSuccess: ({ data }) => {
        setPendingRemove(null);
        setRemoveConfirmEmail('');
        toast.success(
          `Removed ${data?.email ?? 'mailbox'} and related inbox data`
        );
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not remove mailbox');
      }
    }
  );

  const editConnection = (connection: ConnectedMailboxItem): void => {
    if (connection.providerId) {
      setProviderId(connection.providerId);
    }
    setEmail(connection.email);
    setPassword('');
    setStep('credentials');
    setDiscoveredAliases([]);
    setSelectedAliases([]);
    setManualAlias('');
  };

  const toggleAlias = (address: string): void => {
    if (address === primaryEmail) return;

    setSelectedAliases((current) => {
      if (current.includes(address)) {
        return current.filter((item) => item !== address);
      }

      if (current.length >= remaining) {
        toast.error(
          `You can add up to ${remaining} more alias${remaining === 1 ? '' : 'es'} on your plan.`
        );
        return current;
      }

      return [...current, address];
    });
  };

  const addManualAlias = (): void => {
    const normalized = normalizeEmail(manualAlias);
    if (!normalized) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error('Enter a valid email address.');
      return;
    }

    const domain = primaryEmail.slice(primaryEmail.lastIndexOf('@') + 1);
    if (
      primaryEmail.includes('@') &&
      normalized.slice(normalized.lastIndexOf('@') + 1) !== domain
    ) {
      toast.error('Aliases must use the same domain as the login email.');
      return;
    }

    setDiscoveredAliases((current) =>
      current.includes(normalized) ? current : [...current, normalized].sort()
    );

    setSelectedAliases((current) => {
      if (current.includes(normalized)) return current;
      if (current.length >= remaining) {
        toast.error(
          `You can add up to ${remaining} more alias${remaining === 1 ? '' : 'es'} on your plan.`
        );
        return current;
      }
      return [...current, normalized];
    });
    setManualAlias('');
  };

  const onDiscover = (event: React.FormEvent): void => {
    event.preventDefault();

    if (!providerId) {
      toast.error('Choose your mail provider first.');
      return;
    }

    const payload = buildCredentialsInput();
    if (!payload) return;

    discoverAliases(payload);
  };

  const onConnect = (event: React.FormEvent): void => {
    event.preventDefault();

    const payload = buildCredentialsInput();
    if (!payload) return;

    if (!selectedAliases.includes(primaryEmail)) {
      toast.error('Keep the login email selected as an alias.');
      return;
    }

    execute({
      ...payload,
      aliases: selectedAliases
    });
  };

  return (
    <form
      onSubmit={step === 'credentials' ? onDiscover : onConnect}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Connect mailbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose your mail host, then sign in with IMAP. You can add up to{' '}
            {remaining} more alias{remaining === 1 ? '' : 'es'} on your plan.
          </p>
        </div>

        <InboxOptionalNotice>
          Inbox is optional. Connect only when you want shared support across
          Humaner.
        </InboxOptionalNotice>
      </div>

      <div
        className={cn(
          'flex min-h-[28rem] flex-col overflow-hidden rounded-lg border bg-background',
          'lg:min-h-[32rem] lg:flex-row'
        )}
      >
        <aside className="flex min-h-64 w-full shrink-0 flex-col border-b bg-muted/20 lg:min-h-0 lg:w-72 lg:border-b-0 lg:border-r xl:w-80">
          <MailProviderPicker
            value={providerId}
            onChange={setProviderId}
            connectedProviderIds={connectedProviderIds}
            onSelectConnected={(connectedId) => {
              const connection = connections.find(
                (item) => item.providerId === connectedId
              );
              if (connection) {
                editConnection(connection);
              }
            }}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {selectedProvider ? (
            <>
              <div className="flex min-h-[3.75rem] shrink-0 items-center gap-2.5 border-b px-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border/60">
                  <BrandLogo
                    domain={selectedProvider.logoDomain}
                    fallbackIcon={MailIcon}
                    size={32}
                    className="size-5"
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">
                    {selectedProvider.name}
                  </p>
                  {selectedProvider.setupNote ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedProvider.setupNote}
                    </p>
                  ) : (
                    <p className="truncate text-xs text-muted-foreground">
                      Sign in with your mailbox credentials.
                    </p>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                {!selectedProvider.setupNote ? (
                  <div className="mb-5 text-sm text-muted-foreground">
                    Credentials are fully encrypted at rest.{' '}
                    <a
                      href="https://humaner.io/security"
                      target="_blank"
                      rel="noreferrer"
                      className="group/security inline-flex items-center gap-0.5 text-foreground underline underline-offset-4"
                    >
                      Security
                      <ArrowUpRight
                        className="size-3 opacity-0 transition-all duration-200 group-hover/security:-translate-y-0.5 group-hover/security:translate-x-0.5 group-hover/security:opacity-100"
                        aria-hidden
                      />
                    </a>
                  </div>
                ) : null}

                {step === 'credentials' ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="inbox-email">Email</Label>
                      <Input
                        id="inbox-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="support@company.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inbox-password">Password</Label>
                      <Input
                        id="inbox-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          SMTP same as IMAP login
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Turn off only if send uses different credentials.
                        </p>
                      </div>
                      <Switch
                        checked={smtpSameAsImap}
                        onCheckedChange={setSmtpSameAsImap}
                      />
                    </div>

                    {!smtpSameAsImap ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-user">SMTP username</Label>
                          <Input
                            id="smtp-user"
                            autoComplete="username"
                            value={smtpUser}
                            onChange={(event) =>
                              setSmtpUser(event.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-password">SMTP password</Label>
                          <Input
                            id="smtp-password"
                            type="password"
                            autoComplete="current-password"
                            value={smtpPassword}
                            onChange={(event) =>
                              setSmtpPassword(event.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    ) : null}

                    {showAdvanced ? (
                      <div className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="imap-host">IMAP host</Label>
                          <Input
                            id="imap-host"
                            value={imapHost}
                            onChange={(event) =>
                              setImapHost(event.target.value)
                            }
                            placeholder="imap.example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-port">IMAP port</Label>
                          <Input
                            id="imap-port"
                            value={imapPort}
                            onChange={(event) =>
                              setImapPort(event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">SMTP port</Label>
                          <Input
                            id="smtp-port"
                            value={smtpPort}
                            onChange={(event) =>
                              setSmtpPort(event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="smtp-host">SMTP host</Label>
                          <Input
                            id="smtp-host"
                            value={smtpHost}
                            onChange={(event) =>
                              setSmtpHost(event.target.value)
                            }
                            placeholder="smtp.example.com"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        We scanned mail addresses on this mailbox. Select the
                        ones you want this workspace to handle.
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {selectedAliases.length} of {remaining} alias slot
                        {remaining === 1 ? '' : 's'} selected
                      </p>
                    </div>

                    <ul className="divide-y rounded-md border">
                      {aliasOptions.map((address) => {
                        const isPrimary = address === primaryEmail;
                        const checked = selectedAliases.includes(address);

                        return (
                          <li key={address}>
                            <label
                              className={cn(
                                'flex cursor-pointer items-start gap-3 px-4 py-3',
                                isPrimary && 'bg-muted/30'
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                disabled={isPrimary}
                                onCheckedChange={() => toggleAlias(address)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-sm">
                                  {address}
                                </span>
                                {!isPrimary ? (
                                  <span className="text-xs text-muted-foreground">
                                    Found in recent mailbox
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="space-y-2">
                      <Label htmlFor="inbox-manual-alias">
                        Add another alias
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="inbox-manual-alias"
                          value={manualAlias}
                          onChange={(event) =>
                            setManualAlias(event.target.value)
                          }
                          placeholder="hello@company.com"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addManualAlias();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={addManualAlias}
                        >
                          <PlusIcon className="size-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  {step === 'credentials' ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="font-mono"
                        onClick={() => setShowAdvanced((value) => !value)}
                      >
                        {showAdvanced
                          ? 'Hide advanced'
                          : 'Advanced IMAP / SMTP hosts'}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isDiscovering || remaining <= 0}
                        className="font-mono"
                      >
                        {isDiscovering ? (
                          'Linking mailbox…'
                        ) : (
                          <>
                            Link mailbox
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="font-mono"
                        onClick={() => setStep('credentials')}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isExecuting || selectedAliases.length === 0}
                        className="font-mono"
                      >
                        {isExecuting ? 'Connecting…' : 'Connect mailbox'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : connections.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <ul className="space-y-0.5">
                {connections.map((connection) => (
                  <li
                    key={connection.id}
                    className="group flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-muted/60"
                  >
                    <span className="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border/60">
                      <BrandLogo
                        domain={connection.logoDomain}
                        fallbackIcon={MailIcon}
                        size={28}
                        className="size-5"
                      />
                      <span className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                        <CheckIcon
                          className="size-2.5 text-emerald-600"
                          aria-hidden
                        />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {connection.providerName}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {connection.email}
                      </p>
                    </div>

                    <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={isRemoving}
                          >
                            <MoreHorizontalIcon className="size-3.5" />
                            <span className="sr-only">Mailbox actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => editConnection(connection)}
                          >
                            Edit credentials
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setPendingRemove(connection)}
                          >
                            <Trash2Icon className="mr-2 size-4" />
                            Remove mailbox
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t px-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Select a provider on the left to add another mailbox.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 font-mono"
                  asChild
                >
                  <Link href={Routes.InboxAliases}>Manage aliases</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 p-5 sm:p-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <MailIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium">
                Select a mail provider
                <InboxLoadingDots />
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingRemove != null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) {
            setPendingRemove(null);
            setRemoveConfirmEmail('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingRemove?.email ?? 'this mailbox'}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This permanently deletes the mailbox connection from Humaner
                  and cannot be undone.
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>All aliases on this mailbox</li>
                  <li>All synced threads and messages</li>
                  <li>Assignments, tags, and inbox history for this mailbox</li>
                </ul>
                <p>
                  Your provider account itself is not deleted — only Humaner
                  data for this mailbox.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="rounded-none border border-border/60 bg-muted/20 px-3 py-2.5">
              <p className="font-fellix text-xs font-medium text-muted-foreground">
                Mailbox email
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                  {pendingRemove?.email}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  disabled={!pendingRemove?.email}
                  onClick={() => {
                    if (!pendingRemove?.email) return;
                    void (async () => {
                      await copyToClipboard(pendingRemove.email);
                      setCopiedMailboxEmail(true);
                      toast.success('Email copied');
                      window.setTimeout(
                        () => setCopiedMailboxEmail(false),
                        1500
                      );
                    })();
                  }}
                  aria-label="Copy mailbox email"
                >
                  {copiedMailboxEmail ? (
                    <CheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="remove-mailbox-confirm-email"
                className="font-fellix"
              >
                Type the mailbox email to confirm
              </Label>
              <Input
                id="remove-mailbox-confirm-email"
                type="email"
                autoComplete="off"
                spellCheck={false}
                placeholder={pendingRemove?.email}
                value={removeConfirmEmail}
                disabled={isRemoving || !pendingRemove}
                onChange={(event) => setRemoveConfirmEmail(event.target.value)}
                className="rounded-none font-mono text-sm"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                isRemoving ||
                !pendingRemove ||
                normalizeEmail(removeConfirmEmail) !==
                  normalizeEmail(pendingRemove.email)
              }
              onClick={(event) => {
                event.preventDefault();
                if (!pendingRemove) return;
                if (
                  normalizeEmail(removeConfirmEmail) !==
                  normalizeEmail(pendingRemove.email)
                ) {
                  return;
                }
                removeConnection({ connectionId: pendingRemove.id });
              }}
            >
              {isRemoving ? 'Removing…' : 'Remove mailbox'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
