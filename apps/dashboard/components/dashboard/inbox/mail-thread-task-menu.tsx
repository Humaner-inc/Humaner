'use client';

import * as React from 'react';
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckSquare2Icon,
  ChevronRightIcon,
  EllipsisIcon,
  FileTextIcon,
  Link2Icon,
  Loader2Icon,
  PinIcon,
  PlusIcon,
  ReceiptIcon,
  ScrollTextIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { toast } from 'sonner';

import {
  createGithubFromThread,
  createLinearFromThread,
  getMailThreadTaskMenu,
  linkLinearToThread,
  listLinearIssuesForInbox
} from '@/actions/inbox/manage-linear-thread';
import { AssigneeMenuItems } from '@/components/dashboard/assignee-options';
import { MailThreadAttachmentsControl } from '@/components/dashboard/inbox/mail-attachments-control';
import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import { AssigneeFace, type AssigneePerson } from '@/components/ui/assignees';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { MailTagItem } from '@/data/inbox/get-mail-threads';
import { getConnectApp } from '@/lib/connect-apps';
import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import type { MailListFolder } from '@/lib/inbox/mail-thread-folder-shared';
import { getSafeActionErrorMessage } from '@/lib/safe-action-error';
import { cn } from '@/lib/utils';

type LinearLink = {
  id: string;
  identifier: string;
  title: string;
  url: string;
};

type LinearIssue = LinearLink & {
  state?: string | null;
};

type LinearTeam = { id: string; name: string; key: string };
type GithubRepo = { owner: string; repo: string; fullName: string };

function toolPayload(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object' || !('data' in result)) {
    return null;
  }
  const outer = (result as { data?: unknown }).data;
  if (!outer || typeof outer !== 'object' || !('ok' in outer)) {
    return null;
  }
  const payload = outer as { ok?: boolean; data?: unknown; error?: string };
  if (!payload.ok) {
    return null;
  }
  return payload.data && typeof payload.data === 'object'
    ? (payload.data as Record<string, unknown>)
    : {};
}

function toolError(result: unknown, fallback: string): string {
  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as { data?: { error?: unknown } }).data;
    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }
  }
  return getSafeActionErrorMessage(
    result as Parameters<typeof getSafeActionErrorMessage>[0],
    fallback
  );
}

function documentKindLabel(
  kind: 'invoice' | 'quote',
  generating: boolean
): string {
  if (kind === 'quote') {
    return generating ? 'Generating quote…' : 'Generate quote';
  }
  return generating ? 'Generating invoice…' : 'Generate invoice';
}

function DocumentKindIcon({
  kind,
  generating = false,
  className
}: {
  kind: 'invoice' | 'quote';
  generating?: boolean;
  className?: string;
}): React.JSX.Element {
  const iconClass = cn('size-3.5', className);
  if (generating) {
    return <Loader2Icon className={cn(iconClass, 'animate-spin')} />;
  }
  if (kind === 'quote') {
    return <ScrollTextIcon className={iconClass} />;
  }
  return <ReceiptIcon className={iconClass} />;
}

function MenuRowIcon({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

function ForwardGlyph({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'relative flex size-4 items-center justify-center',
        className
      )}
      aria-hidden
    >
      <ChevronRightIcon className="absolute size-3.5 -translate-x-1" />
      <ChevronRightIcon className="absolute size-3.5 translate-x-0.5" />
    </span>
  );
}

export function MailThreadHeaderMenu({
  threadId,
  subject,
  ticketNumber,
  creatingTask,
  onCreateTask,
  assignValue,
  assignPerson,
  members,
  onAssign,
  tags,
  currentTag,
  onTag,
  isPinned,
  onPin,
  notesOpen,
  noteCount,
  onNotes,
  onReply,
  onForward,
  folder,
  inTrash,
  inSpam,
  isArchived,
  onArchive,
  onMoveFolder,
  onBlock,
  onDelete,
  onAddContact,
  contactSaved = false,
  attachments = [],
  hasAttachments = false,
  suggestedDocument = null,
  generatingDocument = false,
  onGenerateDocument
}: {
  threadId: string;
  subject: string;
  ticketNumber: number | null;
  creatingTask: boolean;
  onCreateTask: () => void;
  assignValue: string | null;
  assignPerson: AssigneePerson | null;
  members: AssigneePerson[];
  onAssign: (assigneeId: string | null) => void;
  tags: MailTagItem[];
  currentTag: MailTagItem | null;
  onTag: (tagId: string | null) => void;
  isPinned: boolean;
  onPin: () => void;
  notesOpen: boolean;
  noteCount: number;
  onNotes: () => void;
  onReply: () => void;
  onForward: () => void;
  folder: MailListFolder | string;
  inTrash: boolean;
  inSpam: boolean;
  isArchived: boolean;
  onArchive: (archive: boolean) => void;
  onMoveFolder: (folder: 'INBOX' | 'SPAM') => void;
  onBlock: () => void;
  onDelete: () => void;
  onAddContact?: () => void;
  contactSaved?: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    mediaType: string;
    sizeBytes: number;
  }>;
  hasAttachments?: boolean;
  suggestedDocument?: 'invoice' | 'quote' | null;
  generatingDocument?: boolean;
  onGenerateDocument?: (kind: 'invoice' | 'quote') => void;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [integrations, setIntegrations] = React.useState<
    CompanionIntegrationId[]
  >([]);
  const [linearLinks, setLinearLinks] = React.useState<LinearLink[]>([]);
  const [issues, setIssues] = React.useState<LinearIssue[]>([]);
  const [linearTeams, setLinearTeams] = React.useState<LinearTeam[] | null>(
    null
  );
  const [githubRepos, setGithubRepos] = React.useState<GithubRepo[] | null>(
    null
  );
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [loadingIssues, setLoadingIssues] = React.useState(false);

  const linearOn = integrations.includes('linear');
  const githubOn = integrations.includes('github');
  const linkedLinear = linearLinks[0] ?? null;

  const refreshMenu = React.useCallback(async (): Promise<void> => {
    const result = await getMailThreadTaskMenu({ threadId });
    setIntegrations(result?.data?.integrations ?? []);
    setLinearLinks(result?.data?.linearLinks ?? []);
  }, [threadId]);

  React.useEffect(() => {
    if (!open) return;
    void refreshMenu();
  }, [open, refreshMenu]);

  const loadIssues = React.useCallback(async (term: string): Promise<void> => {
    setLoadingIssues(true);
    try {
      const result = await listLinearIssuesForInbox({
        query: term.trim() || undefined
      });
      if (result?.data && 'ok' in result.data && result.data.ok) {
        setIssues(
          result.data.issues.map((issue) => ({
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            url: issue.url ?? '',
            state: issue.state ?? null
          }))
        );
        return;
      }
      setIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open || !linearOn) return;
    const handle = window.setTimeout(() => {
      void loadIssues(query);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [open, linearOn, query, loadIssues]);

  const createLinear = async (teamId?: string): Promise<void> => {
    setBusy(true);
    try {
      const result = await createLinearFromThread({
        threadId,
        title: subject || '(no subject)',
        teamId
      });
      const data = toolPayload(result);
      if (data?.needsTeam && Array.isArray(data.teams)) {
        setLinearTeams(data.teams as LinearTeam[]);
        return;
      }
      if (data) {
        toast.success(
          typeof data.identifier === 'string'
            ? `Linear ${data.identifier} created`
            : 'Linear issue created'
        );
        setLinearTeams(null);
        await refreshMenu();
        return;
      }
      toast.error(toolError(result, 'Could not create Linear issue'));
    } finally {
      setBusy(false);
    }
  };

  const linkLinear = async (issueId: string): Promise<void> => {
    if (!issueId.trim()) return;
    setBusy(true);
    try {
      const result = await linkLinearToThread({
        threadId,
        issueId: issueId.trim()
      });
      const data = toolPayload(result);
      if (data) {
        toast.success(
          typeof data.identifier === 'string'
            ? `Linked ${data.identifier}`
            : 'Linear issue linked'
        );
        setQuery('');
        await refreshMenu();
        return;
      }
      toast.error(toolError(result, 'Could not link Linear issue'));
    } finally {
      setBusy(false);
    }
  };

  const createGithub = async (
    repo?: Pick<GithubRepo, 'owner' | 'repo'>
  ): Promise<void> => {
    setBusy(true);
    try {
      const result = await createGithubFromThread({
        threadId,
        title: subject || '(no subject)',
        owner: repo?.owner,
        repo: repo?.repo
      });
      const data = toolPayload(result);
      if (data?.needsRepo && Array.isArray(data.repos)) {
        setGithubRepos(data.repos as GithubRepo[]);
        return;
      }
      if (data) {
        toast.success(
          typeof data.number === 'number'
            ? `GitHub #${data.number} created`
            : 'GitHub issue created'
        );
        setGithubRepos(null);
        return;
      }
      toast.error(toolError(result, 'Could not create GitHub issue'));
    } finally {
      setBusy(false);
    }
  };

  const ticketLabel = ticketNumber
    ? `#${String(ticketNumber).padStart(5, '0')}`
    : null;

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {tags.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              title={currentTag ? currentTag.name : 'Label'}
            >
              {currentTag ? (
                <span
                  className="size-3.5 rounded-sm"
                  style={{ backgroundColor: currentTag.color }}
                  aria-hidden
                />
              ) : (
                <BookmarkIcon className="size-4" />
              )}
              <span className="sr-only">Label</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-44"
          >
            <DropdownMenuItem onSelect={() => onTag(null)}>
              No label
            </DropdownMenuItem>
            {tags.map((tag) => (
              <DropdownMenuItem
                key={tag.id}
                onSelect={() => onTag(tag.id)}
              >
                <span
                  className="mr-2 size-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('size-8 rounded-lg', isPinned && 'text-foreground')}
        title={isPinned ? 'Unpin' : 'Pin to top'}
        onClick={onPin}
      >
        <PinIcon className={cn('size-4', isPinned && 'fill-current')} />
        <span className="sr-only">{isPinned ? 'Unpin' : 'Pin to top'}</span>
      </Button>
      <MailThreadAttachmentsControl
        threadId={threadId}
        hasAttachments={hasAttachments || attachments.length > 0}
        attachments={attachments}
      />
      {suggestedDocument && onGenerateDocument ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          title={documentKindLabel(suggestedDocument, generatingDocument)}
          disabled={generatingDocument}
          onClick={() => onGenerateDocument(suggestedDocument)}
        >
          <DocumentKindIcon
            kind={suggestedDocument}
            generating={generatingDocument}
            className="size-4"
          />
          <span className="sr-only">
            {documentKindLabel(suggestedDocument, generatingDocument)}
          </span>
        </Button>
      ) : null}
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            title="Thread actions"
          >
            <EllipsisIcon className="size-4" />
            <span className="sr-only">Thread actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-56"
        >
          <DropdownMenuItem onSelect={onReply}>
            <MenuRowIcon>
              <ArrowRightIcon className="size-3.5 rotate-180" />
            </MenuRowIcon>
            <span className="ml-2">Reply</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onForward}>
            <MenuRowIcon>
              <ForwardGlyph className="size-3.5" />
            </MenuRowIcon>
            <span className="ml-2">Forward</span>
          </DropdownMenuItem>

          {suggestedDocument && onGenerateDocument ? (
            <DropdownMenuItem
              disabled={generatingDocument}
              onSelect={() => onGenerateDocument(suggestedDocument)}
            >
              <MenuRowIcon>
                <DocumentKindIcon
                  kind={suggestedDocument}
                  generating={generatingDocument}
                />
              </MenuRowIcon>
              <span className="ml-2">
                {documentKindLabel(suggestedDocument, generatingDocument)}
              </span>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <AssigneeFace
                person={assignPerson}
                size={16}
                className="shrink-0"
              />
              <span className="min-w-0 flex-1 truncate">
                {assignPerson?.name ?? 'Assignee'}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-56">
              <AssigneeMenuItems
                members={members}
                value={assignValue}
                includeCompanion
                onSelect={onAssign}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onSelect={onNotes}>
            <MenuRowIcon>
              <FileTextIcon className="size-3.5" />
            </MenuRowIcon>
            <span className="ml-2">{notesOpen ? 'Hide notes' : 'Notes'}</span>
            {noteCount > 0 ? (
              <DropdownMenuShortcut>{noteCount}</DropdownMenuShortcut>
            ) : null}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={creatingTask}
            onSelect={onCreateTask}
          >
            <MenuRowIcon>
              <CheckSquare2Icon className="size-3.5" />
            </MenuRowIcon>
            <span className="ml-2">
              {ticketLabel ? `Task ${ticketLabel}` : 'Create a task'}
            </span>
          </DropdownMenuItem>

          {linearOn || githubOn ? <DropdownMenuSeparator /> : null}

          {linearOn ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MenuRowIcon>
                  <BrandLogo
                    domain={getConnectApp('linear').logoDomain}
                    fallbackIcon={Link2Icon}
                    size={32}
                    className="size-3.5"
                  />
                </MenuRowIcon>
                <span className="ml-2">Linear</span>
                {linkedLinear ? (
                  <DropdownMenuShortcut>
                    {linkedLinear.identifier}
                  </DropdownMenuShortcut>
                ) : null}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-56">
                {linearLinks.length > 0 ? (
                  <>
                    {linearLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.id}
                        onSelect={() => {
                          if (link.url) {
                            window.open(
                              link.url,
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }
                        }}
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {link.identifier}
                        </span>
                        <span className="ml-2 min-w-0 truncate">
                          {link.title}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                ) : null}

                {linearTeams && linearTeams.length > 0 ? (
                  <>
                    <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Team
                    </p>
                    {linearTeams.map((team) => (
                      <DropdownMenuItem
                        key={team.id}
                        disabled={busy}
                        onSelect={(event) => {
                          event.preventDefault();
                          void createLinear(team.id);
                        }}
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {team.key}
                        </span>
                        <span className="ml-2">{team.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : (
                  <DropdownMenuItem
                    disabled={busy}
                    onSelect={(event) => {
                      event.preventDefault();
                      void createLinear();
                    }}
                  >
                    <MenuRowIcon>
                      <PlusIcon className="size-3.5" />
                    </MenuRowIcon>
                    <span className="ml-2">Create Linear issue</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MenuRowIcon>
                      <Link2Icon className="size-3.5" />
                    </MenuRowIcon>
                    <span className="ml-2">Link to Linear</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 p-0">
                    <div
                      className="border-b border-border/60 p-1.5"
                      onKeyDown={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search or ENG-123"
                        className="h-8 font-mono text-xs"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {query.trim() ? (
                        <DropdownMenuItem
                          disabled={busy}
                          onSelect={() => void linkLinear(query)}
                        >
                          <MenuRowIcon>
                            <Link2Icon className="size-3.5" />
                          </MenuRowIcon>
                          <span className="ml-2 min-w-0 truncate">
                            Link {query.trim()}
                          </span>
                        </DropdownMenuItem>
                      ) : null}
                      {loadingIssues ? (
                        <p className="px-2 py-2 font-mono text-[11px] text-muted-foreground">
                          Searching…
                        </p>
                      ) : issues.length === 0 ? (
                        <p className="px-2 py-2 font-mono text-[11px] text-muted-foreground">
                          {query.trim()
                            ? 'No matching issues'
                            : 'No recent issues'}
                        </p>
                      ) : (
                        issues.map((issue) => (
                          <DropdownMenuItem
                            key={issue.id}
                            disabled={busy}
                            onSelect={() => void linkLinear(issue.identifier)}
                          >
                            <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">
                              {issue.identifier}
                            </span>
                            <span className="min-w-0 truncate">
                              {issue.title}
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}

          {githubOn ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MenuRowIcon>
                  <BrandLogo
                    domain={getConnectApp('github').logoDomain}
                    fallbackIcon={Link2Icon}
                    size={32}
                    className="size-3.5"
                  />
                </MenuRowIcon>
                <span className="ml-2">GitHub</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-56">
                {githubRepos && githubRepos.length > 0 ? (
                  <>
                    <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Repository
                    </p>
                    {githubRepos.map((repo) => (
                      <DropdownMenuItem
                        key={repo.fullName}
                        disabled={busy}
                        onSelect={(event) => {
                          event.preventDefault();
                          void createGithub(repo);
                        }}
                      >
                        {repo.fullName}
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : (
                  <DropdownMenuItem
                    disabled={busy}
                    onSelect={(event) => {
                      event.preventDefault();
                      void createGithub();
                    }}
                  >
                    <MenuRowIcon>
                      <PlusIcon className="size-3.5" />
                    </MenuRowIcon>
                    <span className="ml-2">Create GitHub issue</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}

          <DropdownMenuSeparator />

          {inTrash ? (
            <DropdownMenuItem onSelect={() => onMoveFolder('INBOX')}>
              Restore
            </DropdownMenuItem>
          ) : inSpam ? (
            <DropdownMenuItem onSelect={() => onMoveFolder('INBOX')}>
              Not spam
            </DropdownMenuItem>
          ) : isArchived ? (
            <DropdownMenuItem onSelect={() => onArchive(false)}>
              Move to inbox
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onArchive(true)}>
              Archive
            </DropdownMenuItem>
          )}
          {!inSpam && !inTrash && folder !== 'SENT' ? (
            <DropdownMenuItem onSelect={() => onMoveFolder('SPAM')}>
              Report spam
            </DropdownMenuItem>
          ) : null}
          {onAddContact ? (
            <DropdownMenuItem
              disabled={contactSaved}
              onSelect={onAddContact}
            >
              {contactSaved ? 'In your contacts' : 'Add to contacts'}
            </DropdownMenuItem>
          ) : null}
          {folder !== 'SENT' && !inTrash ? (
            <DropdownMenuItem onSelect={onBlock}>Block sender</DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive hover:bg-destructive/10 hover:text-destructive"
            onSelect={onDelete}
          >
            <MenuRowIcon>
              <Trash2Icon className="size-3.5" />
            </MenuRowIcon>
            <span className="ml-2">
              {inTrash ? 'Delete forever' : 'Move to Trash'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** @deprecated Use MailThreadHeaderMenu */
export const MailThreadTaskMenu = MailThreadHeaderMenu;
