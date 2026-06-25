'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
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

type SourceType = 'URL' | 'SITEMAP' | 'TEXT' | 'API';

const TYPE_OPTIONS: {
  value: SourceType;
  label: string;
  delegateOnly?: boolean;
}[] = [
  { value: 'URL', label: 'Pages' },
  { value: 'SITEMAP', label: 'Crawl site' },
  { value: 'TEXT', label: 'Plain text' },
  { value: 'API', label: 'Custom API', delegateOnly: true }
];

export type AddSourceDialogProps = {
  agentId: string;
  canUseApiSource?: boolean;
};

export function AddSourceDialog({
  agentId,
  canUseApiSource = false
}: AddSourceDialogProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [type, setType] = React.useState<SourceType>('URL');
  const [title, setTitle] = React.useState('');
  const [urls, setUrls] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [content, setContent] = React.useState('');

  const parsedUrls = urls
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const canSubmit = (() => {
    switch (type) {
      case 'URL':
        return parsedUrls.length > 0;
      case 'SITEMAP':
      case 'API':
        return url.trim().length > 0;
      case 'TEXT':
        return title.trim().length > 0 && content.trim().length > 0;
    }
  })();

  const reset = (): void => {
    setType('URL');
    setTitle('');
    setUrls('');
    setUrl('');
    setContent('');
  };

  const handleAdd = (): void => {
    if (!canSubmit) {
      return;
    }
    startTransition(async () => {
      const result = await addKnowledgeSource({
        agentId,
        type,
        urls: type === 'URL' ? parsedUrls : undefined,
        url: type === 'SITEMAP' || type === 'API' ? url.trim() : undefined,
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
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon className="mr-1.5 size-4" />
          Add source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a source</DialogTitle>
          <DialogDescription>
            Scrape a page, crawl a whole site, or paste text. Sources are chunked
            and embedded for grounded answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((option) => {
              const locked = option.delegateOnly && !canUseApiSource;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending || locked}
                  onClick={() => setType(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    type === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {option.label}
                  {option.delegateOnly && (
                    <span className="rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
                      Delegate
                    </span>
                  )}
                </button>
              );
            })}
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
              <Textarea
                id="source-urls"
                rows={5}
                placeholder={
                  'https://example.com/help/refunds\nhttps://example.com/help/shipping\nhttps://example.com/faq'
                }
                value={urls}
                disabled={isPending}
                onChange={(e) => setUrls(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                One URL per line — add as many as you need.
              </p>
            </div>
          )}

          {type === 'SITEMAP' && (
            <div className="space-y-2">
              <Label htmlFor="source-root">Root URL</Label>
              <Input
                id="source-root"
                placeholder="https://example.com"
                value={url}
                maxLength={2048}
                disabled={isPending}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We discover and crawl every page under this URL.
              </p>
            </div>
          )}

          {type === 'API' && (
            <div className="space-y-2">
              <Label htmlFor="source-endpoint">Endpoint URL</Label>
              <Input
                id="source-endpoint"
                placeholder="https://api.example.com/knowledge"
                value={url}
                maxLength={2048}
                disabled={isPending}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Connect a custom JSON endpoint to sync knowledge automatically.
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
