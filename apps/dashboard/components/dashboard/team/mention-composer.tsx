'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { Textarea } from '@/components/ui/textarea';
import {
  filterMentionMembers,
  insertMention,
  mentionQueryAt,
  type MentionMember
} from '@/lib/inbox/mentions';
import { filesFromClipboard } from '@/lib/team/message-attachments';
import { cn } from '@/lib/utils';

const SUGGESTION_HEIGHT = 196;

function MentionSuggestionList({
  anchorRef,
  suggestions,
  onPick
}: {
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
  suggestions: MentionMember[];
  onPick: (name: string) => void;
}): React.JSX.Element | null {
  const [coords, setCoords] = React.useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    const node = anchorRef.current;
    if (!node) return;

    const update = (): void => {
      const rect = node.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeBelow =
        spaceBelow >= SUGGESTION_HEIGHT || spaceBelow >= spaceAbove;
      setCoords({
        left: rect.left,
        width: Math.max(rect.width, 180),
        ...(placeBelow
          ? { top: rect.bottom + 4 }
          : { bottom: window.innerHeight - rect.top + 4 })
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, suggestions.length]);

  if (!coords || typeof document === 'undefined') return null;

  return createPortal(
    <ul
      style={{
        position: 'fixed',
        left: coords.left,
        width: coords.width,
        top: coords.top,
        bottom: coords.bottom,
        zIndex: 80
      }}
      className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-popover p-1 shadow-md"
    >
      {suggestions.map((member) => (
        <li key={member.id}>
          <button
            type="button"
            className="flex w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/60"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(member.name);
            }}
          >
            @{member.name}
          </button>
        </li>
      ))}
    </ul>,
    document.body
  );
}

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
        <MentionSuggestionList
          anchorRef={textareaRef}
          suggestions={suggestions}
          onPick={applyMention}
        />
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
            className="font-medium text-[#001afc]"
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
