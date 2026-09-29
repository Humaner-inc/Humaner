'use client';

import * as React from 'react';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  $toggleLink,
  AutoLinkNode,
  LinkNode
} from '@lexical/link';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp
} from '@lexical/react/LexicalAutoLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  type EditorState,
  type LexicalEditor,
  type LexicalNode
} from 'lexical';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith('http') ? text : `https://${text}`
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`)
];

export type MailComposeBodyValue = {
  text: string;
  html: string | null;
};

type LinkEditState = {
  key: string;
  text: string;
  url: string;
  top: number;
  left: number;
};

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.includes('@') && !trimmed.includes(' ')) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n/)
    .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlHasLinks(html: string): boolean {
  return /<a\s/i.test(html);
}

function serializeEditor(editor: LexicalEditor): MailComposeBodyValue {
  let text = '';
  let html = '';
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
    html = $generateHtmlFromNodes(editor, null);
  });
  const trimmed = text.trim();
  return {
    text,
    html: trimmed && htmlHasLinks(html) ? html : null
  };
}

function setEditorPlainText(editor: LexicalEditor, value: string): void {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const lines = value.split(/\n/);
    if (lines.length === 0) {
      root.append($createParagraphNode());
      return;
    }
    for (const line of lines) {
      const paragraph = $createParagraphNode();
      if (line) paragraph.append($createTextNode(line));
      root.append(paragraph);
    }
  });
}

function findLinkNode(
  node: LexicalNode | null
): LinkNode | AutoLinkNode | null {
  let current = node;
  while (current) {
    if ($isLinkNode(current) || $isAutoLinkNode(current)) return current;
    current = current.getParent();
  }
  return null;
}

function SyncValuePlugin({
  value,
  lastEmittedRef
}: {
  value: string;
  lastEmittedRef: React.MutableRefObject<string>;
}): null {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    setEditorPlainText(editor, value);
  }, [editor, lastEmittedRef, value]);

  return null;
}

function LinkEditPopoverPlugin({
  disabled
}: {
  disabled?: boolean;
}): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [edit, setEdit] = React.useState<LinkEditState | null>(null);
  const [draftText, setDraftText] = React.useState('');
  const [draftUrl, setDraftUrl] = React.useState('');
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const panelRef = React.useRef<HTMLDivElement>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setEdit(null), 180);
  }, [clearCloseTimer]);

  const openForLink = React.useCallback(
    (link: LinkNode | AutoLinkNode, anchor: HTMLElement) => {
      if (disabled) return;
      clearCloseTimer();
      const rect = anchor.getBoundingClientRect();
      const next: LinkEditState = {
        key: link.getKey(),
        text: link.getTextContent(),
        url: link.getURL(),
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      };
      setEdit(next);
      setDraftText(next.text);
      setDraftUrl(next.url.replace(/^mailto:/i, ''));
    },
    [clearCloseTimer, disabled]
  );

  const openForSelection = React.useCallback(() => {
    if (disabled) return false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const nodes = selection.getNodes();
      const existing = findLinkNode(nodes[0] ?? null);
      if (existing) {
        const dom = editor.getElementByKey(existing.getKey());
        if (dom) openForLink(existing, dom);
        return;
      }

      const text = selection.getTextContent();
      if (!text.trim()) return;

      const native = window.getSelection();
      const range =
        native && native.rangeCount > 0 ? native.getRangeAt(0) : null;
      const rect = range?.getBoundingClientRect();
      if (!rect) return;

      setEdit({
        key: '',
        text,
        url: '',
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
      setDraftText(text);
      setDraftUrl('');
    });
    return true;
  }, [disabled, editor, openForLink]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === 'k'
          ) {
            event.preventDefault();
            openForSelection();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, openForSelection]);

  React.useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const onMouseOver = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || !root.contains(anchor)) return;

      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(anchor);
        const link = findLinkNode(node);
        if (link) openForLink(link, anchor as HTMLElement);
      });
    };

    const onMouseOut = (event: MouseEvent): void => {
      const related = event.relatedTarget;
      if (related instanceof Node && panelRef.current?.contains(related)) {
        return;
      }
      const target = event.target;
      if (target instanceof Element && target.closest('a')) {
        scheduleClose();
      }
    };

    const onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || !root.contains(anchor)) return;

      if (event.metaKey || event.ctrlKey) {
        const href = anchor.getAttribute('href');
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }

      event.preventDefault();
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(anchor);
        const link = findLinkNode(node);
        if (link) openForLink(link, anchor as HTMLElement);
      });
    };

    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mouseout', onMouseOut);
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('mouseover', onMouseOver);
      root.removeEventListener('mouseout', onMouseOut);
      root.removeEventListener('click', onClick);
    };
  }, [editor, openForLink, scheduleClose]);

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const handleSave = (): void => {
    const url = normalizeUrl(draftUrl);
    const label = draftText.trim() || url;
    if (!url) {
      setEdit(null);
      return;
    }

    editor.update(() => {
      if (edit?.key) {
        const node = $getNodeByKey(edit.key);
        if ($isLinkNode(node) || $isAutoLinkNode(node)) {
          if ($isAutoLinkNode(node) || node.getTextContent() !== label) {
            const replacement = $createLinkNode(url, {
              target: '_blank',
              rel: 'noopener noreferrer'
            });
            replacement.append($createTextNode(label));
            node.replace(replacement);
            return;
          }
          node.setURL(url);
          return;
        }
      }

      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        $toggleLink(url);
        const link = findLinkNode(selection.anchor.getNode());
        if (link) {
          link.getChildren().forEach((child) => child.remove());
          link.append($createTextNode(label));
        }
        return;
      }

      const link = $createLinkNode(url, {
        target: '_blank',
        rel: 'noopener noreferrer'
      });
      link.append($createTextNode(label));
      if ($isRangeSelection(selection)) {
        selection.insertNodes([link]);
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append(link);
        $getRoot().append(paragraph);
      }
    });
    setEdit(null);
  };

  if (!edit) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Edit link"
      className="fixed z-[80] w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ top: edit.top, left: edit.left }}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
    >
      <div className="space-y-2">
        <label className="flex items-center gap-2 border-b border-border/70 pb-2">
          <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
            Text:
          </span>
          <input
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />
        </label>
        <label className="flex items-center gap-2 border-b border-border/70 pb-2">
          <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
            Link:
          </span>
          <input
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            placeholder="https://"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 font-mono text-xs"
            onClick={() => setEdit(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-3 font-mono text-xs"
            onClick={handleSave}
            disabled={!draftUrl.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditablePlugin({ editable }: { editable: boolean }): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);
  return null;
}

function InitialContentPlugin({
  value,
  lastEmittedRef
}: {
  value: string;
  lastEmittedRef: React.MutableRefObject<string>;
}): null {
  const [editor] = useLexicalComposerContext();
  const booted = React.useRef(false);

  React.useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    lastEmittedRef.current = value;
    if (!value) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(plainTextToHtml(value), 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, lastEmittedRef, value]);

  return null;
}

export function MailComposeBodyEditor({
  value,
  onChange,
  placeholder = 'Write the message…',
  disabled = false,
  className,
  contentClassName
}: {
  value: string;
  onChange: (next: MailComposeBodyValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}): React.JSX.Element {
  const lastEmittedRef = React.useRef(value);
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'MailCompose',
      theme: {
        paragraph: 'mail-compose-paragraph',
        link: 'mail-compose-link',
        text: {
          bold: 'font-semibold',
          italic: 'italic',
          underline: 'underline'
        }
      },
      onError(error: Error) {
        console.error(error);
      },
      nodes: [LinkNode, AutoLinkNode],
      editable: !disabled
    }),
    // editable is synced via EditablePlugin; avoid remounting the composer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleChange = React.useCallback(
    (_state: EditorState, editor: LexicalEditor) => {
      const next = serializeEditor(editor);
      lastEmittedRef.current = next.text;
      onChange(next);
    },
    [onChange]
  );

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditablePlugin editable={!disabled} />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label="Message body"
              className={cn(
                'mail-compose-editor min-h-32 w-full flex-1 resize-none bg-transparent text-sm outline-none',
                disabled && 'pointer-events-none opacity-60',
                contentClassName
              )}
            />
          }
          placeholder={
            <p className="pointer-events-none absolute left-0 top-0 text-sm text-muted-foreground/60">
              {placeholder}
            </p>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin
          validateUrl={(url) => Boolean(url.trim())}
          attributes={{ target: '_blank', rel: 'noopener noreferrer' }}
        />
        <AutoLinkPlugin matchers={MATCHERS} />
        <OnChangePlugin
          onChange={handleChange}
          ignoreSelectionChange
        />
        <InitialContentPlugin
          value={value}
          lastEmittedRef={lastEmittedRef}
        />
        <SyncValuePlugin
          value={value}
          lastEmittedRef={lastEmittedRef}
        />
        <LinkEditPopoverPlugin disabled={disabled} />
      </LexicalComposer>
      <style
        jsx
        global
      >{`
        .mail-compose-editor {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .mail-compose-paragraph {
          margin: 0;
          position: relative;
        }
        .mail-compose-link {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
