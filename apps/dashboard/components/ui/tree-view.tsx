'use client';

import * as React from 'react';
import { ChevronRightIcon, Loader2Icon } from 'lucide-react';
import * as TreeViewPrimitive from 'react-accessible-treeview';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type TreeViewElement = React.ElementRef<
  typeof TreeViewPrimitive.default
>;
export type TreeViewProps = React.ComponentPropsWithoutRef<
  typeof TreeViewPrimitive.default
>;
const TreeView = TreeViewPrimitive.default;

export type TreeViewItemElement = HTMLDivElement;
export type TreeViewItemProps = React.ComponentPropsWithoutRef<'div'> & {
  level: number;
  isExpanded?: boolean;
  isBranch?: boolean;
  isSelected?: boolean;
  indentation: number;
  levelIndentation?: number;
  name: string;
  icon?: React.ReactNode;
  isEditing?: boolean;
  onEditSubmit?: (value: string) => void;
  isLoading?: boolean;
};
const TreeViewItem = React.forwardRef<TreeViewItemElement, TreeViewItemProps>(
  (
    {
      level = 1,
      isExpanded = false,
      isBranch = false,
      isSelected = false,
      isLoading = false,
      indentation = 16,
      levelIndentation = 48,
      name = '',
      icon,
      isEditing = false,
      onEditSubmit,
      ...other
    },
    ref
  ) => {
    const [localValueState, setLocalValueState] = React.useState(name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!inputRef.current?.contains(event.target as Node)) {
          onEditSubmit?.(localValueState);
        }
      };
      if (isEditing) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        if (isEditing) {
          document.removeEventListener('mousedown', handleClickOutside);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    React.useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [isEditing]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      onEditSubmit?.(localValueState);
    };

    return (
      <div
        ref={ref}
        aria-selected={isSelected}
        aria-expanded={!isEditing && isExpanded}
        {...other}
        className={cn(
          'group relative flex h-8 cursor-pointer select-none items-center gap-3 text-sm text-muted-foreground transition-colors hover:bg-muted',
          isSelected && '!bg-muted text-foreground'
        )}
        style={{
          paddingLeft:
            level === 1 && !isBranch
              ? indentation
              : level
                ? levelIndentation * (level - 1) +
                  indentation +
                  (!isBranch ? 0 : 0)
                : levelIndentation,
          ...other.style
        }}
        data-treeview-is-branch={isBranch}
        data-treeview-level={level}
      >
        {level && level > 1 && (
          <div
            style={{
              left: (levelIndentation / 2 + 4) * (level - 1) + indentation
            }}
            className="absolute h-full w-px group-data-[treeview-is-branch=false]:border"
          />
        )}
        {isSelected && (
          <div className="absolute left-0 h-full w-0.5 bg-foreground" />
        )}
        {isBranch && (
          <>
            {isLoading ? (
              <Loader2Icon
                className="animate-spin text-muted-foreground"
                size={14}
              />
            ) : (
              <ChevronRightIcon
                className="text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-90 group-aria-expanded:text-muted-foreground group-aria-selected:text-muted-foreground"
                size={14}
              />
            )}
          </>
        )}
        {icon}
        <span
          className={cn('truncate text-sm', isEditing && 'hidden')}
          title={name}
        >
          {name}
        </span>
        <form
          autoFocus
          onSubmit={handleSubmit}
          className={cn(!isEditing && 'hidden')}
        >
          <Input
            ref={inputRef}
            onChange={(e) => {
              setLocalValueState(e.target.value);
            }}
            onKeyDownCapture={(e) => {
              if (e.key === 'Enter') {
                onEditSubmit?.(localValueState);
              } else if (e.key === 'Escape') {
                setLocalValueState(name);
                onEditSubmit?.(name);
              } else {
                e.stopPropagation();
              }
            }}
            className="w block h-7 w-full px-2 py-1 text-sm"
            value={localValueState}
          />
        </form>
      </div>
    );
  }
);
TreeViewItem.displayName = 'TreeViewItem';

export { TreeView, TreeViewItem };
