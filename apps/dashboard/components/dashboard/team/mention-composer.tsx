'use client';

import * as React from 'react';

import { Textarea } from '@/components/ui/textarea';
import {
  filterMentionMembers,
  insertMention,
  mentionQueryAt,
  type MentionMember
} from '@/lib/inbox/mentions';
import { filesFromClipboard } from '@/lib/team/message-attachments';
import { cn } from '@/lib/utils';

export function MentionComposer({
  value,
  onChange,
  members,
  placeholder,
  rows = 3,
  disabled,
  className,
  variant = 'default',
  onSubmit,
  onPasteImages
}: {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'bare';
  onSubmit?: () => void;
  onPasteImages?: (files: File[]) => void;
}): React.JSX.Element {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = React.useState(0);
  const isBare = variant === 'bare';

  React.useEffect(() => {
    if (!isBare) return;
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 112)}px`;
  }, [isBare, value]);

  const mention = mentionQueryAt(value, caret);
  const suggestions = mention
    ? filterMentionMembers(members, mention.query).slice(0, 8)
    : [];

  const applyMention = (name: string): void => {
    const next = insertMention(value, caret, name);
    onChange(next.value);
    setCaret(next.caret);
    window.requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(next.caret, next.caret);
    });
  };

  return (
    <div className={cn('relative', isBare && 'min-w-0 flex-1')}>
      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        rows={isBare ? 1 : rows}
        placeholder={placeholder}
        className={cn(
          isBare
            ? 'min-h-7 resize-none border-0 bg-transparent p-0 py-1 shadow-none focus-visible:ring-0'
            : 'rounded-lg',
          className
        )}
        onChange={(event) => {
          onChange(event.target.value);
          setCaret(event.target.selectionStart ?? event.target.value.length);
        }}
        onClick={(event) => {
          setCaret(event.currentTarget.selectionStart ?? 0);
        }}
        onKeyUp={(event) => {
          setCaret(event.currentTarget.selectionStart ?? 0);
        }}
        onPaste={(event) => {
          if (!onPasteImages) return;
          const images = filesFromClipboard(event.nativeEvent);
          if (images.length === 0) return;
          event.preventDefault();
          onPasteImages(images);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
            if (suggestions.length > 0) {
              event.preventDefault();
              applyMention(suggestions[0].name);
              return;
            }
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      {suggestions.length > 0 ? (
        <ul className="absolute bottom-full z-20 mb-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border/60 bg-popover p-1 shadow-md">
          {suggestions.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                className="flex w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/60"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyMention(member.name);
                }}
              >
                @{member.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MentionBody({
  body,
  members
}: {
  body: string;
  members: MentionMember[];
}): React.JSX.Element {
  const tokens = React.useMemo(() => {
    const names = new Set<string>();
    for (const member of members) {
      const trimmed = member.name.trim();
      if (!trimmed) continue;
      names.add(trimmed.toLowerCase());
      names.add(trimmed.split(/\s+/)[0]!.toLowerCase());
    }
    return names;
  }, [members]);

  const pattern = React.useMemo(() => {
    const unique = [...tokens].toSorted(
      (left, right) => right.length - left.length
    );
    if (unique.length === 0) return null;
    const escaped = unique.map((name) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return new RegExp(`(@(?:${escaped.join('|')}))`, 'gi');
  }, [tokens]);

  if (!pattern) {
    return <span className="whitespace-pre-wrap">{body}</span>;
  }

  const parts = body.split(pattern);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const isMention =
          part.startsWith('@') && tokens.has(part.slice(1).toLowerCase());
        return isMention ? (
          <span
            key={`${part}-${index}`}
            className="font-medium text-[#2252bc]"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        );
      })}
    </span>
  );
}
