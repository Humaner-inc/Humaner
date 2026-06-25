import * as React from 'react';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { TRANSFORMERS } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode,
  QuoteNode
} from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister
} from '@lexical/utils';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  LineBreakNode,
  SELECTION_CHANGE_COMMAND
} from 'lexical';
import {
  BoldIcon,
  ChevronsUpDownIcon,
  ItalicIcon,
  UnderlineIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const lowPriority = 1;
const supportedBlockTypes = new Set([
  'paragraph',
  'h2',
  'h1',
  'bullet',
  'number'
]);

type BlockType = {
  [key: string]: string;
};

const blockTypeToBlockName: BlockType = {
  paragraph: 'Normal',
  h2: 'Small Heading',
  h1: 'Large Heading',
  bullet: 'Bulleted List',
  number: 'Numbered List'
};

function ToolbarPlugin(): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = React.useRef(null);
  const [blockType, setBlockType] = React.useState<string>('paragraph');
  const [isBold, setIsBold] = React.useState<boolean>(false);
  const [isItalic, setIsItalic] = React.useState<boolean>(false);
  const [isUnderline, setIsUnderline] = React.useState<boolean>(false);

  const formatParagraph = (): void => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatLargeHeading = (): void => {
    if (blockType !== 'h1') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h1'));
        }
      });
    }
  };

  const formatSmallHeading = (): void => {
    if (blockType !== 'h2') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h2'));
        }
      });
    }
  };

  const formatBulletList = (): void => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = (): void => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const format = (newBlockType: string): void => {
    switch (newBlockType) {
      case 'paragraph':
        formatParagraph();
        break;
      case 'bullet':
        formatBulletList();
        break;
      case 'number':
        formatNumberedList();
        break;
      case 'h1':
        formatLargeHeading();
        break;
      case 'h2':
        formatSmallHeading();
        break;
    }
  };

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });
      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }
      const elementDOM = editor.getElementByKey(element.getKey());
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type === 'root') {
            setBlockType('paragraph');
          } else {
            setBlockType(type);
          }
        }
      }
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, [editor]);

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            updateToolbar();
          });
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          (_payload, _newEditor) => {
            updateToolbar();
            return false;
          },
          lowPriority
        )
      ),
    [editor, updateToolbar]
  );

  const handleFormatBold = (): void => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const handleFormatItalic = (): void => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const handleFormatUnderline = (): void => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };
  return (
    <div
      className="flex flex-row items-center px-2 py-1 align-middle"
      ref={toolbarRef}
    >
      {supportedBlockTypes.has(blockType) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
            >
              {blockTypeToBlockName[blockType as keyof BlockType]}
              <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.keys(blockTypeToBlockName).map((key) => {
              const handleFormatBlock = (): void => {
                format(key);
              };
              return (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={blockType === key}
                  onClick={handleFormatBlock}
                >
                  <p className="text-sm">
                    <span className={'icon block-type ' + key} />
                    <span>{blockTypeToBlockName[key]}</span>
                  </p>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('size-8', isBold && 'bg-neutral-100')}
        onClick={handleFormatBold}
      >
        <BoldIcon className="size-4 shrink-0" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('size-8', isItalic && 'bg-neutral-100')}
        onClick={handleFormatItalic}
      >
        <ItalicIcon className="size-4 shrink-0" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('size-8', isUnderline && 'bg-neutral-100')}
        onClick={handleFormatUnderline}
      >
        <UnderlineIcon className="size-4 shrink-0" />
      </Button>
    </div>
  );
}

export type TextEditorProps = {
  getText: () => string;
  setText: (text: string) => void;
  height?: string;
  placeholder?: string;
};

export function TextEditor(props: TextEditorProps): React.JSX.Element {
  const initEditor = React.useCallback((editor: LexicalEditor) => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(props.getText(), 'text/html');
    const nodes = $generateNodesFromDOM(editor, dom);

    $getRoot().select();
    $insertNodes(nodes);

    editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      editorState.read(() => {
        const textInHtml = $generateHtmlFromNodes(editor)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        props.setText(textInHtml);
      });
      if (!prevEditorState._selection) {
        editor.blur();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialConfig = React.useMemo(
    () => ({
      editorState: initEditor,
      theme: {
        placeholder: 'editor-placeholder',
        paragraph: 'editor-paragraph',
        heading: {
          h1: 'editor-heading-h1',
          h2: 'editor-heading-h2'
        },
        list: {
          nested: {
            listitem: 'editor-nested-listitem'
          },
          ol: 'editor-list-ol',
          ul: 'editor-list-ul',
          listitem: 'editor-listitem'
        },
        image: 'editor-image',
        link: 'editor-link',
        text: {
          bold: 'editor-text-bold',
          italic: 'editor-text-italic',
          underline: 'editor-text-underline'
        }
      },
      onError(error: Error) {
        throw error;
      },
      namespace: '',
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        LineBreakNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        LinkNode
      ]
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <div className="editor rounded border">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container rounded bg-background">
          <ToolbarPlugin />
          <Separator className="opacity-40" />
          <div
            className="editor-inner scroll-bar overflow-y-auto rounded-b"
            style={{ height: props.height }}
          >
            <style
              jsx
              global
            >{`
              .editor a {
                text-decoration: underline;
                font-size: 14px;
              }

              .editor li {
                padding-left: 1.28571429em;
                text-indent: -1.28571429em;
              }

              .editor ul {
                list-style: disc inside;
              }

              .editor ol {
                list-style: decimal inside;
              }

              .editor-container {
                position: relative;
                line-height: 20px;
                font-weight: 400;
                text-align: left;
                padding: 1px;
              }

              .scroll-bar {
                --scrollbar-track: initial;
                --scrollbar-thumb: initial;
                --scrollbar-corner: initial;
                --scrollbar-track-hover: var(--scrollbar-track);
                --scrollbar-thumb-hover: var(--scrollbar-thumb);
                --scrollbar-corner-hover: var(--scrollbar-corner);
                --scrollbar-track-active: var(--scrollbar-track-hover);
                --scrollbar-thumb-active: var(--scrollbar-thumb-hover);
                --scrollbar-corner-active: var(--scrollbar-corner-hover);
                scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
                overflow: overlay;
              }

              .scroll-bar.overflow-x-hidden {
                overflow-x: hidden;
              }

              .scroll-bar.overflow-y-hidden {
                overflow-y: hidden;
              }

              .scroll-bar::-webkit-scrollbar-track {
                background-color: var(--scrollbar-track);
              }

              .scroll-bar::-webkit-scrollbar-thumb {
                background-color: var(--scrollbar-thumb);
              }

              .scroll-bar::-webkit-scrollbar-corner {
                background-color: var(--scrollbar-corner);
              }

              .scroll-bar::-webkit-scrollbar-track:hover {
                background-color: var(--scrollbar-track-hover);
              }

              .scroll-bar::-webkit-scrollbar-thumb:hover {
                background-color: var(--scrollbar-thumb-hover);
              }

              .scroll-bar::-webkit-scrollbar-corner:hover {
                background-color: var(--scrollbar-corner-hover);
              }

              .scroll-bar::-webkit-scrollbar-track:active {
                background-color: var(--scrollbar-track-active);
              }

              .scroll-bar::-webkit-scrollbar-thumb:active {
                background-color: var(--scrollbar-thumb-active);
              }

              .scroll-bar::-webkit-scrollbar-corner:active {
                background-color: var(--scrollbar-corner-active);
              }

              .scroll-bar {
                scrollbar-width: thin;
              }

              .scroll-bar::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }

              .scroll-bar {
                --scrollbar-track: transparent;
                --scrollbar-thumb: var(--bg-muted);
              }

              .scroll-bar::-webkit-scrollbar-thumb {
                border-radius: 0.375rem;
              }

              .editor-inner {
                position: relative;
                resize: vertical;
                height: auto;
                min-height: 40px;
              }

              .editor-input {
                height: auto;
                font-size: 14px;
                position: relative;
                tab-size: 1;
                outline: 0;
                padding: 12px 20px;
                outline: none;
              }

              .editor-text-bold {
                font-weight: bold;
              }

              .editor-text-italic {
                font-style: italic;
              }

              .editor-text-underline {
                text-decoration: underline;
              }

              .editor-link {
                color: rgb(0, 0, 238);
                text-decoration: none;
              }

              .editor-tokenFunction {
                color: var(--bg-muted);
              }

              .editor-paragraph {
                margin: 0;
                position: relative;
              }

              .editor-paragraph:last-child {
                margin-bottom: 0;
              }

              .editor-heading-h1 {
                font-size: 25px;
                font-weight: 400;
                margin-bottom: 20px;
                font-weight: bold;
              }

              .editor-heading-h2 {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
              }

              .editor-list-ul {
                margin-bottom: 12px;
              }

              .editor-list-ol {
                margin-bottom: 12px;
              }

              .editor-listitem {
                margin: 0px 32px;
              }

              .editor-nested-listitem {
                list-style-type: none;
              }

              pre::-webkit-scrollbar {
                background: transparent;
                width: 10px;
              }

              pre::-webkit-scrollbar-thumb {
                background: #999;
              }
            `}</style>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  style={{ height: props.height }}
                  className="editor-input"
                />
              }
              placeholder={
                <p
                  className="pointer-events-none select-none p-3 text-sm text-muted-foreground opacity-60"
                  style={{ marginTop: `calc(0px - ${props.height} - 2px)` }}
                >
                  {props.placeholder || ''}
                </p>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <ListPlugin />
            <LinkPlugin />
            <HistoryPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
