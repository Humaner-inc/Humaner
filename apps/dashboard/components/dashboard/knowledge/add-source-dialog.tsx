'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { HighlightedTextarea, HighlightedTextInput } from '@humaner/react';
import type { HighlightedFieldTone } from '@humaner/react';
import { ctaSecondaryAdaptiveClassName } from '@humaner/shared/cta';
import {
  ArrowUpRightIcon,
  FileTextIcon,
  PlusIcon,
  UploadIcon,
  XIcon
} from '@humaner/shared/icons';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { addKnowledgeSource } from '@/actions/knowledge/add-knowledge-source';
import {
  KnowledgeIngestionPanel,
  MIN_INGESTION_LOADING_MS,
  randomIngestionLoadingDelayMs,
  type KnowledgeIngestionPhase
} from '@/components/dashboard/knowledge/knowledge-ingestion-panel';
import {
  useKnowledgeResources,
  useOptionalKnowledgeResources
} from '@/components/dashboard/knowledge/knowledge-resources-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { KnowledgeSourceItem } from '@/data/knowledge/get-knowledge-sources';
import {
  formatKnowledgeFileSizeLimit,
  KNOWLEDGE_FILE_CONTENT_MAX_LENGTH,
  KNOWLEDGE_PASTED_TEXT_MAX_LENGTH
} from '@/lib/knowledge/content-limits';
import { buildOptimisticKnowledgeSources } from '@/lib/knowledge/optimistic-knowledge-source';
import { cn } from '@/lib/utils';

const REMOTE_INGESTION_POLL_MS = 2000;
const REMOTE_INGESTION_MAX_WAIT_MS = 120_000;

const highlightedInputClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const highlightedTextareaClassName =
  'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type SourceType = 'URL' | 'SITEMAP' | 'TEXT' | 'MARKDOWN';
type DialogView = 'form' | 'ingestion';

const TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'URL', label: 'Pages' },
  { value: 'SITEMAP', label: 'Crawl site' },
  { value: 'TEXT', label: 'Plain text' }
];

const sourceTypeButtonSizeClassName =
  'px-3 py-2 text-sm font-medium font-sans tracking-normal';

const sourceTypeButtonClassName = cn(
  ctaSecondaryAdaptiveClassName,
  'w-full justify-center normal-case',
  sourceTypeButtonSizeClassName
);

const sourceTypeButtonSelectedClassName = cn(
  'inline-flex w-full items-center justify-center rounded-none border border-transparent bg-[#070607] text-[#fff8f2] transition-[color,background-color,border-color] duration-200 dark:bg-[#fff8f2] dark:text-[#070607]',
  sourceTypeButtonSizeClassName
);

function isMarkdownFileName(name: string): boolean {
  return /\.(md|markdown)$/i.test(name);
}

function stripMarkdownExtension(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '');
}

function firstValidationError(validationErrors: unknown): string | undefined {
  if (!validationErrors || typeof validationErrors !== 'object') {
    return undefined;
  }

  const rootErrors = (validationErrors as { _errors?: string[] })._errors;
  if (rootErrors?.[0]) {
    return rootErrors[0];
  }

  for (const value of Object.values(validationErrors)) {
    if (!value || typeof value !== 'object' || !('_errors' in value)) {
      continue;
    }

    const message = (value as { _errors?: string[] })._errors?.[0];
    if (message) {
      return message;
    }
  }

  return undefined;
}

function firstActionError(result?: {
  serverError?: string;
  validationErrors?: unknown;
}): string | undefined {
  if (!result) {
    return undefined;
  }

  if (result.serverError) {
    return result.serverError;
  }

  return (
    firstValidationError(result.validationErrors) ??
    (result.validationErrors ? 'Please check the source details' : undefined)
  );
}

export type AddSourceDialogProps = {
  agentId: string;
  agentName?: string;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  textPrefill?: { title: string; content?: string };
  onSourceAdded?: () => void;
};

export function AddSourceDialog({
  agentId,
  agentName,
  hideTrigger = false,
  open: controlledOpen,
  onOpenChange,
  textPrefill,
  onSourceAdded
}: AddSourceDialogProps): React.JSX.Element {
  const router = useRouter();
  const knowledgeResources = useOptionalKnowledgeResources();
  const { resolvedTheme } = useTheme();
  const highlightedTone: HighlightedFieldTone =
    resolvedTheme === 'light' ? 'light' : 'dark';
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = React.useTransition();

  const [type, setType] = React.useState<SourceType>('MARKDOWN');
  const [title, setTitle] = React.useState('');
  const [urls, setUrls] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [content, setContent] = React.useState('');
  const [mdFiles, setMdFiles] = React.useState<
    { name: string; content: string }[]
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dialogView, setDialogView] = React.useState<DialogView>('form');
  const [ingestionPhase, setIngestionPhase] =
    React.useState<KnowledgeIngestionPhase>('loading');
  const ingestionTimersRef = React.useRef<number[]>([]);

  const reset = React.useCallback((): void => {
    setType('MARKDOWN');
    setTitle('');
    setUrls('');
    setUrl('');
    setContent('');
    setMdFiles([]);
  }, []);

  const clearIngestionTimers = React.useCallback((): void => {
    for (const timer of ingestionTimersRef.current) {
      window.clearTimeout(timer);
    }
    ingestionTimersRef.current = [];
  }, []);

  const cancelIngestionSequence = React.useCallback((): void => {
    clearIngestionTimers();
    setDialogView('form');
    setIngestionPhase('loading');
  }, [clearIngestionTimers]);

  const showIngestionLoading = React.useCallback((): void => {
    setDialogView('ingestion');
    setIngestionPhase('loading');
  }, []);

  const startIngestionSequence = React.useCallback(
    (
      onComplete: () => void,
      options?: { remoteSourceIds?: string[]; skipViewSetup?: boolean }
    ): void => {
      clearIngestionTimers();
      if (!options?.skipViewSetup) {
        showIngestionLoading();
      }

      const markSuccess = (): void => {
        setIngestionPhase('success');
        onComplete();
      };

      const remoteSourceIds = options?.remoteSourceIds ?? [];
      if (remoteSourceIds.length === 0) {
        const loadingDelayMs = randomIngestionLoadingDelayMs();
        ingestionTimersRef.current.push(
          window.setTimeout(markSuccess, loadingDelayMs)
        );
        return;
      }

      const startedAt = Date.now();

      const pollRemoteSources = async (): Promise<void> => {
        const elapsed = Date.now() - startedAt;
        if (elapsed >= REMOTE_INGESTION_MAX_WAIT_MS) {
          markSuccess();
          return;
        }

        try {
          const response = await fetch(
            `/api/agents/${agentId}/knowledge-sources`,
            { cache: 'no-store' }
          );
          if (response.ok) {
            const payload = (await response.json()) as {
              sources: Array<{ id: string; status: string }>;
            };
            const tracked = payload.sources.filter((source) =>
              remoteSourceIds.includes(source.id)
            );
            const allSettled =
              tracked.length > 0 &&
              tracked.every(
                (source) =>
                  source.status === 'READY' || source.status === 'FAILED'
              );

            if (allSettled && elapsed >= MIN_INGESTION_LOADING_MS) {
              markSuccess();
              return;
            }
          }
        } catch {
          // Keep polling on transient errors.
        }

        ingestionTimersRef.current.push(
          window.setTimeout(() => {
            void pollRemoteSources();
          }, REMOTE_INGESTION_POLL_MS)
        );
      };

      ingestionTimersRef.current.push(
        window.setTimeout(() => {
          void pollRemoteSources();
        }, MIN_INGESTION_LOADING_MS)
      );
    },
    [agentId, clearIngestionTimers, showIngestionLoading]
  );

  const finishIngestionDialog = React.useCallback((): void => {
    clearIngestionTimers();
    reset();
    setDialogView('form');
    setIngestionPhase('loading');
    setOpen(false);
  }, [clearIngestionTimers, reset, setOpen]);

  React.useEffect(() => {
    return () => clearIngestionTimers();
  }, [clearIngestionTimers]);

  const handleDialogOpenChange = React.useCallback(
    (nextOpen: boolean): void => {
      if (!nextOpen && dialogView === 'ingestion') {
        return;
      }
      if (!nextOpen) {
        cancelIngestionSequence();
        reset();
      }
      setOpen(nextOpen);
    },
    [cancelIngestionSequence, dialogView, reset, setOpen]
  );

  const parsedUrls = urls
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const canSubmit = (() => {
    switch (type) {
      case 'URL':
        return parsedUrls.length > 0;
      case 'SITEMAP':
        return url.trim().length > 0;
      case 'TEXT':
        return title.trim().length > 0 && content.trim().length > 0;
      case 'MARKDOWN':
        return mdFiles.length > 0;
    }
  })();

  React.useEffect(() => {
    if (!open || !textPrefill) return;
    setType('TEXT');
    setTitle(textPrefill.title);
    setContent(textPrefill.content ?? '');
  }, [open, textPrefill]);

  const handleMdFiles = async (files: FileList | null): Promise<void> => {
    if (!files) return;
    const results: { name: string; content: string }[] = [];
    const skipped: string[] = [];
    for (const file of Array.from(files)) {
      if (!isMarkdownFileName(file.name)) continue;
      const text = await file.text();
      const trimmed = text.trim();
      if (!trimmed) {
        skipped.push(`${file.name} (empty)`);
        continue;
      }
      if (trimmed.length > KNOWLEDGE_FILE_CONTENT_MAX_LENGTH) {
        skipped.push(
          `${file.name} (over ${formatKnowledgeFileSizeLimit()} limit)`
        );
        continue;
      }
      results.push({
        name: stripMarkdownExtension(file.name),
        content: trimmed
      });
    }
    if (results.length === 0) {
      toast.error(
        skipped.length > 0
          ? `No valid .md files found. ${skipped.join(', ')}`
          : 'No valid .md files found'
      );
      return;
    }
    if (skipped.length > 0) {
      toast.warning(`Skipped ${skipped.length} file(s): ${skipped.join(', ')}`);
    }
    setMdFiles((prev) => [...prev, ...results]);
  };

  const removeMdFile = (index: number): void => {
    setMdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = (): void => {
    if (!canSubmit || isPending || dialogView === 'ingestion') {
      return;
    }

    const finishIngestion = (): void => {
      onSourceAdded?.();
      router.refresh();
    };

    if (type === 'MARKDOWN') {
      const filesToAdd = [...mdFiles];
      const optimisticSources = buildOptimisticKnowledgeSources({
        type: 'TEXT',
        files: filesToAdd
      });
      const optimisticIds = optimisticSources.map((source) => source.id);
      knowledgeResources?.addSources(optimisticSources);
      startIngestionSequence(finishIngestion);

      startTransition(async () => {
        let added = 0;
        const createdSources: KnowledgeSourceItem[] = [];
        let lastError: string | undefined;

        for (const file of filesToAdd) {
          const result = await addKnowledgeSource({
            agentId,
            type: 'TEXT',
            title: file.name,
            content: file.content,
            contentFormat: 'markdown'
          });
          const error = firstActionError(result);
          if (error) {
            lastError = `${file.name}: ${error}`;
            continue;
          }
          if (result?.data?.sources) {
            createdSources.push(...result.data.sources);
          }
          added++;
        }

        if (added === 0) {
          cancelIngestionSequence();
          knowledgeResources?.reconcileSources(optimisticIds, []);
          toast.error(lastError ?? 'Could not add any files');
          return;
        }

        knowledgeResources?.reconcileSources(optimisticIds, createdSources);
      });
      return;
    }

    const optimisticSources = buildOptimisticKnowledgeSources({
      type,
      urls: type === 'URL' ? parsedUrls : undefined,
      url: type === 'SITEMAP' ? url.trim() : undefined,
      title: type === 'TEXT' ? title.trim() : undefined
    });
    const optimisticIds = optimisticSources.map((source) => source.id);
    const isRemoteSource = type === 'URL' || type === 'SITEMAP';
    knowledgeResources?.addSources(optimisticSources);
    showIngestionLoading();

    startTransition(async () => {
      const result = await addKnowledgeSource({
        agentId,
        type,
        urls: type === 'URL' ? parsedUrls : undefined,
        url: type === 'SITEMAP' ? url.trim() : undefined,
        title: type === 'TEXT' ? title.trim() : undefined,
        content: type === 'TEXT' ? content.trim() : undefined
      });
      if (result?.serverError) {
        cancelIngestionSequence();
        knowledgeResources?.reconcileSources(optimisticIds, []);
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        cancelIngestionSequence();
        knowledgeResources?.reconcileSources(optimisticIds, []);
        toast.error('Please check the source details');
        return;
      }

      if (result?.data?.sources) {
        const createdSources = result.data.sources;
        knowledgeResources?.reconcileSources(optimisticIds, createdSources);

        if (isRemoteSource) {
          startIngestionSequence(finishIngestion, {
            remoteSourceIds: createdSources.map((source) => source.id),
            skipViewSetup: true
          });
          return;
        }
      }

      startIngestionSequence(finishIngestion);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button type="button">
            <PlusIcon className="mr-1.5 size-4" />
            Add source
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="max-w-lg overflow-hidden"
        preventDismiss={dialogView === 'ingestion'}
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {dialogView === 'form' ? (
            <motion.div
              key="add-source-form"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <DialogHeader className="space-y-1">
                <DialogTitle className="font-display text-2xl">
                  Add a source
                </DialogTitle>
                <DialogDescription>
                  Insert your company&apos;s knowledge into your agent.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isPending}
                      onClick={() => setType(option.value)}
                      className={cn(
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        type === option.value
                          ? sourceTypeButtonSelectedClassName
                          : sourceTypeButtonClassName
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {type === 'URL' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="source-urls">URLs</Label>
                      {parsedUrls.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {parsedUrls.length} URL
                          {parsedUrls.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <HighlightedTextarea
                      id="source-urls"
                      rows={5}
                      placeholder={
                        'https://example.com/help/refunds\nhttps://example.com/help/shipping\nhttps://example.com/faq'
                      }
                      value={urls}
                      tone={highlightedTone}
                      disabled={isPending}
                      onChange={(e) => setUrls(e.target.value)}
                      className={highlightedTextareaClassName}
                      mirrorClassName="px-3 py-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      One URL per line — each URL is scraped as a single page.
                    </p>
                  </div>
                )}

                {type === 'SITEMAP' && (
                  <div className="space-y-2">
                    <Label htmlFor="source-root">Root URL</Label>
                    <HighlightedTextInput
                      id="source-root"
                      placeholder="https://example.com"
                      value={url}
                      tone={highlightedTone}
                      maxLength={2048}
                      disabled={isPending}
                      onChange={(e) => setUrl(e.target.value)}
                      className={highlightedInputClassName}
                      mirrorClassName="px-3 py-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      We discover and crawl every page under this URL.
                    </p>
                  </div>
                )}

                {type === 'TEXT' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="source-title">Title</Label>
                      <Input
                        id="source-title"
                        placeholder="e.g. Refund policy"
                        value={title}
                        maxLength={255}
                        disabled={isPending}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source-content">Content</Label>
                      <Textarea
                        id="source-content"
                        rows={6}
                        placeholder="Paste the knowledge your agent should learn from…"
                        value={content}
                        maxLength={KNOWLEDGE_PASTED_TEXT_MAX_LENGTH}
                        disabled={isPending}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {type === 'MARKDOWN' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown"
                      multiple
                      className="hidden"
                      disabled={isPending}
                      onChange={(e) => {
                        void handleMdFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleMdFiles(e.dataTransfer.files);
                      }}
                      className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-foreground/20 hover:bg-muted/30"
                    >
                      <UploadIcon className="size-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drop .md files here or click to browse
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Markdown files up to {formatKnowledgeFileSizeLimit()}{' '}
                          each
                        </p>
                      </div>
                    </button>
                    {mdFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {mdFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
                          >
                            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {file.name}.md
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {(file.content.length / 1024).toFixed(1)}kb
                            </span>
                            <button
                              type="button"
                              onClick={() => removeMdFile(index)}
                              disabled={isPending}
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <XIcon className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <a
                      href="https://markdown.humaner.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[#0682de]"
                    >
                      Convert a full site into a .md file
                      <ArrowUpRightIcon className="size-3 shrink-0 opacity-60" />
                    </a>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAdd}
                  loading={isPending}
                  disabled={!canSubmit || isPending}
                >
                  Add source
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="add-source-ingestion"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <KnowledgeIngestionPanel
                phase={ingestionPhase}
                agentName={agentName}
                onDone={
                  ingestionPhase === 'success'
                    ? finishIngestionDialog
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export type AddSourceDialogTriggerProps = Omit<
  React.ComponentProps<typeof Button>,
  'type' | 'onClick'
>;

export function AddSourceDialogTrigger({
  children,
  ...props
}: AddSourceDialogTriggerProps): React.JSX.Element {
  const { openAddSourceDialog } = useKnowledgeResources();

  return (
    <Button
      type="button"
      onClick={() => openAddSourceDialog()}
      {...props}
    >
      {children ?? (
        <>
          <PlusIcon className="mr-1.5 size-4" />
          Add source
        </>
      )}
    </Button>
  );
}
