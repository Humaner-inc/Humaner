'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRight,
  ArrowUpRight,
  CheckIcon,
  CopyIcon,
  InfoIcon,
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
import { startGmailConnect } from '@/actions/inbox/start-gmail-connect';
import { FeatureIntroEmpty } from '@/components/dashboard/desk/feature-intro-empty';
import { AppPasswordTitleHint } from '@/components/dashboard/inbox/app-password-title-hint';
import { DetectedImapProviderBanner } from '@/components/dashboard/inbox/detected-imap-provider-banner';
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';
import { Routes } from '@/constants/routes';
import type { ConnectedMailboxItem } from '@/data/inbox/get-mail-threads';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  detectMailProviderFromEmail,
  getMailProviderById,
  mailProviderUsesAppPassword,
  resolveMailProviderPreset
} from '@/lib/inbox/mail-providers';
import { cn } from '@/lib/utils';
import type { DiscoverImapAliasesInput } from '@/schemas/inbox/connect-imap-schema';

type ConnectStep = 'credentials' | 'aliases';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const CONNECTION_STATUS_LABELS: Record<string, string> = {
  NEEDS_REAUTH: 'Reconnect',
  ERROR: 'Sync failed',
  DISCONNECTED: 'Disconnected'
};

/** Only rendered for a mailbox that stopped working — active ones stay quiet. */
function ConnectionStatusChip({
  status
}: {
  status: string;
}): React.JSX.Element | null {
  const label = CONNECTION_STATUS_LABELS[status];
  if (!label) {
    return null;
  }

  return (
    <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
      {label}
    </span>
  );
}

export function ConnectImapForm({
  inboxLimit,
  connectionCount,
  connectedProviderIds = [],
  connections = []
}: {
  inboxLimit: number;
  connectionCount: number;
  connectedProviderIds?: string[];
  connections?: ConnectedMailboxItem[];
}): React.JSX.Element {
  const router = useRouter();
  const remainingInboxes = Math.max(0, inboxLimit - connectionCount);
  const [step, setStep] = React.useState<ConnectStep>('credentials');
  const [providerId, setProviderId] = React.useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false);
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
  const customFlow = selectedProvider?.id === 'custom';
  const detection = React.useMemo(
    () => (customFlow ? detectMailProviderFromEmail(email) : null),
    [customFlow, email]
  );
  const detectedPresetProvider =
    detection?.kind === 'preset' ? detection.provider : null;
  const connectingProviderId = detectedPresetProvider?.id ?? providerId;
  const connectingProvider = connectingProviderId
    ? getMailProviderById(connectingProviderId)
    : null;
  const preset = connectingProviderId
    ? resolveMailProviderPreset(connectingProviderId)
    : null;
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

  const appliedDetectionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selectedProvider) return;

    if (detectedPresetProvider && preset) {
      if (appliedDetectionIdRef.current !== detectedPresetProvider.id) {
        appliedDetectionIdRef.current = detectedPresetProvider.id;
        setShowAdvanced(false);
        setImapHost(preset.imapHost);
        setImapPort(String(preset.imapPort));
        setSmtpHost(preset.smtpHost);
        setSmtpPort(String(preset.smtpPort));
      }
      return;
    }

    if (appliedDetectionIdRef.current) {
      appliedDetectionIdRef.current = null;
      if (selectedProvider.requiresCustomHosts) {
        setImapHost('');
        setImapPort('993');
        setSmtpHost('');
        setSmtpPort('465');
        setShowAdvanced(true);
      }
      return;
    }

    if (selectedProvider.requiresCustomHosts) {
      setShowAdvanced(true);
      return;
    }

    if (!preset) return;
    setImapHost(preset.imapHost);
    setImapPort(String(preset.imapPort));
    setSmtpHost(preset.smtpHost);
    setSmtpPort(String(preset.smtpPort));
  }, [selectedProvider, detectedPresetProvider, preset]);

  React.useEffect(() => {
    appliedDetectionIdRef.current = null;
  }, [providerId]);

  React.useEffect(() => {
    setStep('credentials');
    setDiscoveredAliases([]);
    setSelectedAliases([]);
    setManualAlias('');
  }, [providerId]);

  const buildCredentialsInput = (): DiscoverImapAliasesInput | null => {
    if (!connectingProviderId) return null;

    const needsHosts = Boolean(
      connectingProvider?.requiresCustomHosts && !detectedPresetProvider
    );

    return {
      providerId: connectingProviderId,
      email,
      password,
      smtpSameAsImap,
      showAdvanced: showAdvanced || needsHosts,
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
      router.push(Routes.InboxSettings);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not connect mailbox');
    }
  });

  const { execute: connectGmail, isExecuting: isConnectingGmail } = useAction(
    startGmailConnect,
    {
      onSuccess: ({ data }) => {
        if (data?.url) {
          window.location.assign(data.url);
          return;
        }
        toast.error('Google did not return an authorization URL.');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not start Google mail connect');
      }
    }
  );

  const beginGmailConnect = (nextProviderId: string): void => {
    if (remainingInboxes <= 0) {
      toast.error('This plan has no mailbox slots left.');
      return;
    }
    if (nextProviderId !== 'gmail' && nextProviderId !== 'google-workspace') {
      return;
    }
    connectGmail({ providerId: nextProviderId });
  };

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

  const startNewForProvider = (nextProviderId: string): void => {
    setProviderId(nextProviderId);
    setEmail('');
    setPassword('');
    setSmtpSameAsImap(true);
    setSmtpUser('');
    setSmtpPassword('');
    setStep('credentials');
    setDiscoveredAliases([]);
    setSelectedAliases([]);
    setManualAlias('');
    setMobileShowDetail(true);

    if (getMailProviderById(nextProviderId)?.oauthAvailable) {
      beginGmailConnect(nextProviderId);
    }
  };

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
    setMobileShowDetail(true);
  };

  const providerConnections = React.useMemo(
    () =>
      providerId
        ? connections.filter((item) => item.providerId === providerId)
        : [],
    [connections, providerId]
  );

  const toggleAlias = (address: string): void => {
    if (address === primaryEmail) return;

    setSelectedAliases((current) => {
      if (current.includes(address)) {
        return current.filter((item) => item !== address);
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
      return [...current, normalized];
    });
    setManualAlias('');
  };

  const onDiscover = (event: React.FormEvent): void => {
    event.preventDefault();

    if (detection?.kind === 'oauth') {
      return;
    }

    if (!connectingProviderId) {
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

  const listPanel = (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <MailProviderPicker
        value={providerId}
        onChange={startNewForProvider}
        connectedProviderIds={connectedProviderIds}
        onSelectConnected={startNewForProvider}
      />
    </div>
  );

  const oauthDetailPanel = selectedProvider?.oauthAvailable ? (
    <div className="flex min-h-full flex-col bg-background">
      <div className="sticky top-0 z-10 flex min-h-[3.75rem] shrink-0 items-center gap-2.5 border-b border-border/50 bg-background px-3 py-2 sm:px-4">
        {mobileShowDetail ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 md:hidden"
            onClick={() => setMobileShowDetail(false)}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Back to providers</span>
          </Button>
        ) : null}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border/60">
          <BrandLogo
            domain={selectedProvider.logoDomain}
            fallbackIcon={MailIcon}
            size={32}
            className="size-5"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {detectedPresetProvider
              ? `${detectedPresetProvider.name} via Custom IMAP`
              : selectedProvider.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Sign in with Google · send-as aliases import after authorization
          </p>
        </div>
      </div>
      <div className="flex-1 p-5 sm:p-6">
        {providerConnections.length > 0 ? (
          <div className="mb-5 space-y-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Active on {selectedProvider.name}
            </p>
            <ul className="space-y-1">
              {providerConnections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="min-w-0 truncate font-mono text-xs">
                    {connection.email}
                  </span>
                  <ConnectionStatusChip status={connection.status} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 font-mono text-[10px]"
                    onClick={() => setPendingRemove(connection)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mb-5 text-sm text-muted-foreground">
          Google opens in this window. Humaner stores encrypted tokens and
          imports verified send-as aliases.
        </p>
        <Button
          type="button"
          disabled={isConnectingGmail || remainingInboxes <= 0}
          className="font-mono"
          onClick={() => beginGmailConnect(selectedProvider.id)}
        >
          {isConnectingGmail ? 'Opening Google…' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  ) : null;

  const detailPanel = selectedProvider ? (
    (oauthDetailPanel ?? (
      <form
        onSubmit={step === 'credentials' ? onDiscover : onConnect}
        className="flex min-h-full flex-col bg-background"
      >
        <div className="sticky top-0 z-10 flex min-h-[3.75rem] shrink-0 items-center gap-2.5 border-b border-border/50 bg-background px-3 py-2 sm:px-4">
          {mobileShowDetail ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 md:hidden"
              onClick={() => setMobileShowDetail(false)}
            >
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Back to providers</span>
            </Button>
          ) : null}
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border/60">
            <BrandLogo
              domain={
                (detectedPresetProvider ?? selectedProvider).logoDomain ===
                'humaner.io'
                  ? undefined
                  : (detectedPresetProvider ?? selectedProvider).logoDomain
              }
              fallbackIcon={MailIcon}
              size={32}
              className="size-5"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {detectedPresetProvider
                ? detectedPresetProvider.name
                : selectedProvider.name}
            </p>
            {providerConnections.length > 0 ? (
              <p className="truncate text-xs text-muted-foreground">
                {providerConnections.length} mailbox
                {providerConnections.length === 1 ? '' : 'es'} connected — add
                another below.
              </p>
            ) : (detectedPresetProvider ?? selectedProvider).appPasswordUrl ? (
              <a
                href={
                  (detectedPresetProvider ?? selectedProvider).appPasswordUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-muted-foreground underline decoration-foreground/20 underline-offset-4 hover:text-foreground"
              >
                {(detectedPresetProvider ?? selectedProvider).setupNote ??
                  'Create an app password'}
              </a>
            ) : (detectedPresetProvider ?? selectedProvider).setupNote ? (
              <p className="truncate text-xs text-muted-foreground">
                {(detectedPresetProvider ?? selectedProvider).setupNote}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                Sign in with your mailbox credentials · {remainingInboxes}{' '}
                mailbox slot{remainingInboxes === 1 ? '' : 's'} left
              </p>
            )}
          </div>
          {connections.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden shrink-0 font-mono sm:inline-flex"
              asChild
            >
              <Link href={Routes.InboxSettings}>Manage aliases</Link>
            </Button>
          ) : null}
        </div>

        <div className="flex-1 p-5 sm:p-6">
          {providerConnections.length > 0 ? (
            <div className="mb-5 space-y-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Active on {selectedProvider.name}
              </p>
              <ul className="space-y-1">
                {providerConnections.map((connection) => (
                  <li
                    key={connection.id}
                    className="group flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0 truncate font-mono text-xs">
                      {connection.email}
                    </span>
                    <ConnectionStatusChip status={connection.status} />
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2 font-mono text-[10px]"
                        onClick={() => editConnection(connection)}
                      >
                        Edit
                      </Button>
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
                          <DropdownMenuItem asChild>
                            <Link href={Routes.InboxSettings}>
                              Manage aliases
                            </Link>
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
            </div>
          ) : null}

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

              {customFlow && detection ? (
                <DetectedImapProviderBanner
                  detection={detection}
                  onUseGoogle={
                    detection.kind === 'oauth'
                      ? () => beginGmailConnect(detection.provider.id)
                      : undefined
                  }
                />
              ) : null}

              {detection?.kind === 'oauth' ? null : (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="inbox-password"
                      className="inline-flex items-center gap-1.5"
                    >
                      Password
                      {mailProviderUsesAppPassword(
                        connectingProvider?.id ?? selectedProvider.id
                      ) ? (
                        <AppPasswordTitleHint />
                      ) : null}
                    </Label>
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
                          onChange={(event) => setSmtpUser(event.target.value)}
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
                          onChange={(event) => setImapHost(event.target.value)}
                          placeholder="imap.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imap-port">IMAP port</Label>
                        <Input
                          id="imap-port"
                          value={imapPort}
                          onChange={(event) => setImapPort(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP port</Label>
                        <Input
                          id="smtp-port"
                          value={smtpPort}
                          onChange={(event) => setSmtpPort(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="smtp-host">SMTP host</Label>
                        <Input
                          id="smtp-host"
                          value={smtpHost}
                          onChange={(event) => setSmtpHost(event.target.value)}
                          placeholder="smtp.example.com"
                        />
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  We scanned aliases on this mailbox. Select the ones you want
                  to uses within your inbox.
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {selectedAliases.length} alias
                  {selectedAliases.length === 1 ? '' : 'es'} selected · aliases
                  are free redirects
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
                <Label htmlFor="inbox-manual-alias">Add a missing alias</Label>
                <div className="flex gap-2">
                  <Input
                    id="inbox-manual-alias"
                    value={manualAlias}
                    onChange={(event) => setManualAlias(event.target.value)}
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
                <p className="flex items-start gap-2 border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Humaner does not create aliases. It connects them as
                    different sending addresses on this mailbox.
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            {step === 'credentials' &&
            detection?.kind === 'oauth' ? null : step === 'credentials' ? (
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
                  disabled={isDiscovering || remainingInboxes <= 0}
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
      </form>
    ))
  ) : (
    <FeatureIntroEmpty
      icon={<MailIcon strokeWidth={1.25} />}
      title="Connect mailbox"
      description="Simply sign in using your provider(s) to display your inbox(ex) within Humaner."
      example={`You can connect ${remainingInboxes} more mailbox${remainingInboxes === 1 ? '' : 'es'}. Redirect aliases on a connected mailbox are free.`}
      className="min-h-full border-0 bg-transparent"
    >
      <Button
        size="sm"
        variant="outline"
        asChild
      >
        <a
          href="https://humaner.io/security"
          target="_blank"
          rel="noopener noreferrer"
        >
          Security
        </a>
      </Button>
    </FeatureIntroEmpty>
  );

  const removeDialog = (
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
                This permanently deletes the mailbox connection from Humaner and
                cannot be undone.
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>All aliases on this mailbox</li>
                <li>All synced threads and messages</li>
                <li>Assignments, tags, and inbox history for this mailbox</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
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
                    window.setTimeout(() => setCopiedMailboxEmail(false), 1500);
                  })();
                }}
                aria-label="Copy mailbox email"
              >
                {copiedMailboxEmail ? (
                  <CheckIcon className="size-4 text-success" />
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
              className="rounded-lg font-mono text-sm"
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
  );

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        <div className="hidden min-h-0 w-full md:block">
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
          >
            <ResizablePanel
              defaultSize={24}
              minSize={18}
              maxSize={34}
            >
              <div className="h-full border-r border-border/50">
                {listPanel}
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border/50 transition-colors hover:bg-border" />
            <ResizablePanel defaultSize={76}>
              <div className="h-full min-h-0 overflow-y-auto bg-background">
                {detailPanel}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="w-full md:hidden">
          {mobileShowDetail && selectedProvider ? (
            <div className="h-full min-h-0 overflow-y-auto bg-background">
              {detailPanel}
            </div>
          ) : (
            <div className="h-full border-r border-border/50">{listPanel}</div>
          )}
        </div>
      </div>
      {removeDialog}
    </>
  );
}
