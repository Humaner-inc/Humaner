'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { HighlightedTextarea, HighlightedTextInput } from '@humaner/react';
import type { HighlightedFieldTone } from '@humaner/react';
import {
  FileTextIcon,
  PlusIcon,
  UploadIcon,
  XIcon
} from '@humaner/shared/icons';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { addKnowledgeSource } from '@/actions/knowledge/add-knowledge-source';
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
import { cn } from '@/lib/utils';

const highlightedInputClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const highlightedTextareaClassName =
  'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

type SourceType = 'URL' | 'SITEMAP' | 'TEXT' | 'MARKDOWN';

const TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'URL', label: 'Pages' },
  { value: 'SITEMAP', label: 'Crawl site' },
  { value: 'TEXT', label: 'Plain text' },
  { value: 'MARKDOWN', label: '.md files' }
];

export type AddSourceDialogProps = {
  agentId: string;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  textPrefill?: { title: string; content?: string };
  onSourceAdded?: () => void;
};

export function AddSourceDialog({
  agentId,
  hideTrigger = false,
  open: controlledOpen,
  onOpenChange,
  textPrefill,
  onSourceAdded
}: AddSourceDialogProps): React.JSX.Element {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const highlightedTone: HighlightedFieldTone =
    resolvedTheme === 'light' ? 'light' : 'dark';
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = React.useTransition();

  const [type, setType] = React.useState<SourceType>('URL');
  const [title, setTitle] = React.useState('');
  const [urls, setUrls] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [content, setContent] = React.useState('');
  const [mdFiles, setMdFiles] = React.useState<
    { name: string; content: string }[]
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const reset = (): void => {
    setType('URL');
    setTitle('');
    setUrls('');
    setUrl('');
    setContent('');
    setMdFiles([]);
  };

  React.useEffect(() => {
    if (!open || !textPrefill) return;
    setType('TEXT');
    setTitle(textPrefill.title);
    setContent(textPrefill.content ?? '');
  }, [open, textPrefill]);

  const handleMdFiles = async (files: FileList | null): Promise<void> => {
    if (!files) return;
    const results: { name: string; content: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown'))
        continue;
      const text = await file.text();
      if (text.trim()) {
        results.push({
          name: file.name.replace(/\.(md|markdown)$/, ''),
          content: text.trim()
        });
      }
    }
    if (results.length === 0) {
      toast.error('No valid .md files found');
      return;
    }
    setMdFiles((prev) => [...prev, ...results]);
  };

  const removeMdFile = (index: number): void => {
    setMdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = (): void => {
    if (!canSubmit) {
      return;
    }
    startTransition(async () => {
      if (type === 'MARKDOWN') {
        let added = 0;
        for (const file of mdFiles) {
          const result = await addKnowledgeSource({
            agentId,
            type: 'TEXT',
            title: file.name,
            content: file.content
          });
          if (result?.serverError || result?.validationErrors) continue;
          added++;
        }
        if (added === 0) {
          toast.error('Could not add any files');
          return;
        }
        toast.success(
          `${added} file${added === 1 ? '' : 's'} added — queued for processing`
        );
        setOpen(false);
        reset();
        onSourceAdded?.();
        router.refresh();
        return;
      }

      const result = await addKnowledgeSource({
        agentId,
        type,
        urls: type === 'URL' ? parsedUrls : undefined,
        url: type === 'SITEMAP' ? url.trim() : undefined,
        title: type === 'TEXT' ? title.trim() : undefined,
        content: type === 'TEXT' ? content.trim() : undefined
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error('Please check the source details');
        return;
      }
      toast.success(
        type === 'URL'
          ? `${parsedUrls.length} source${parsedUrls.length === 1 ? '' : 's'} added — queued for processing`
          : 'Source added — queued for processing'
      );
      setOpen(false);
      reset();
      onSourceAdded?.();
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button type="button">
            <PlusIcon className="mr-1.5 size-4" />
            Add source
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Add a source
          </DialogTitle>
          <DialogDescription>
            Scrape a page, crawl a whole site, drop .md files, or paste text.
            Sources are chunked and embedded for grounded answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isPending}
                onClick={() => setType(option.value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  type === option.value
                    ? 'border-foreground/20 bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/15 hover:text-foreground'
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
                    {parsedUrls.length} URL{parsedUrls.length === 1 ? '' : 's'}
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
                One URL per line — add as many as you need.
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
                  maxLength={20000}
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
                    Markdown files are parsed as knowledge sources
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
