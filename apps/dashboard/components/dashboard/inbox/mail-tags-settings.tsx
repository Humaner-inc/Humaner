'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  Trash2Icon
} from '@humaner/shared/icons';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  createMailTag,
  deleteMailTag,
  updateMailTag
} from '@/actions/inbox/manage-mail-tags';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MailTagItem } from '@/data/inbox/get-mail-threads';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#64748B'
];

export type MailTagAliasOption = {
  id: string;
  address: string;
};

function scopeLabel(
  aliasId: string | null,
  aliases: MailTagAliasOption[]
): string {
  if (!aliasId) return 'On all';
  return aliases.find((alias) => alias.id === aliasId)?.address ?? 'Inbox';
}

function TagScopeSelect({
  aliases,
  value,
  onChange
}: {
  aliases: MailTagAliasOption[];
  value: string | null;
  onChange: (aliasId: string | null) => void;
}): React.JSX.Element {
  const label = scopeLabel(value, aliases);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 max-w-48 gap-1.5 px-2 font-mono text-xs"
        >
          <span className="truncate">{label}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
      >
        <DropdownMenuItem
          onSelect={() => onChange(null)}
          className={cn(!value && 'bg-accent font-medium')}
        >
          <span className="min-w-0 flex-1 truncate">On all</span>
          {!value ? (
            <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
          ) : null}
        </DropdownMenuItem>
        {aliases.map((alias) => {
          const selected = value === alias.id;
          return (
            <DropdownMenuItem
              key={alias.id}
              onSelect={() => onChange(alias.id)}
              className={cn(selected && 'bg-accent font-medium')}
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {alias.address}
              </span>
              {selected ? (
                <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MailTagsSettings({
  tags,
  aliases,
  canManage
}: {
  tags: MailTagItem[];
  aliases: MailTagAliasOption[];
  canManage: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(PRESET_COLORS[0]);

  const showScopeSelector = aliases.length > 1;

  const { execute: createTag, isExecuting: creating } = useAction(
    createMailTag,
    {
      onSuccess: () => {
        toast.success('Tag created');
        setName('');
        router.refresh();
      },
      onError: ({ error }) =>
        toast.error(error.serverError || 'Could not create tag')
    }
  );

  const { execute: saveTag } = useAction(updateMailTag, {
    onSuccess: () => {
      toast.success('Tag updated');
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not update tag')
  });

  const { execute: removeTag } = useAction(deleteMailTag, {
    onSuccess: () => {
      toast.success('Tag deleted');
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || 'Could not delete tag')
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Mail tags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define colors and tags to label your mails.
        </p>
      </div>

      {canManage ? (
        <form
          className="space-y-4 rounded-lg border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            createTag({
              name: name.trim(),
              color,
              aliasId: null
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Priority"
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              <ColorPicker
                value={color}
                onChange={setColor}
                className="size-7 rounded-none border"
                title="Open full palette"
              />
              <div
                className="h-5 w-px shrink-0 bg-border"
                aria-hidden
              />
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className="size-7 rounded-none ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    backgroundColor: preset,
                    boxShadow:
                      color === preset ? `0 0 0 2px ${preset}` : undefined
                  }}
                  aria-label={preset}
                />
              ))}
              <Input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-8 max-w-40 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={creating || !name.trim()}
          >
            <PlusIcon className="mr-2 size-4" />
            Add tag
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the workspace owner can create or edit tags.
        </p>
      )}

      <ul className="divide-y overflow-hidden rounded-lg border">
        {tags.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            No tags yet.
          </li>
        ) : (
          tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {canManage ? (
                <>
                  <Input
                    defaultValue={tag.name}
                    className="h-8 max-w-xs"
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (next && next !== tag.name) {
                        saveTag({
                          tagId: tag.id,
                          name: next,
                          color: tag.color,
                          aliasId: tag.aliasId
                        });
                      }
                    }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {tag.color}
                  </span>
                  {showScopeSelector ? (
                    <TagScopeSelect
                      aliases={aliases}
                      value={tag.aliasId}
                      onChange={(aliasId) => {
                        if (aliasId !== tag.aliasId) {
                          saveTag({
                            tagId: tag.id,
                            name: tag.name,
                            color: tag.color,
                            aliasId
                          });
                        }
                      }}
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTag({ tagId: tag.id })}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm">{tag.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {tag.color}
                  </span>
                  {showScopeSelector ? (
                    <span className="ml-auto truncate font-mono text-[10px] text-muted-foreground">
                      {scopeLabel(tag.aliasId, aliases)}
                    </span>
                  ) : (
                    <span className="ml-auto" />
                  )}
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
