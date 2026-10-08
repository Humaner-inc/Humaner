'use client';

import type {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject
} from 'react';
import { useCallback, useEffect, useState } from 'react';

import { useCharHighlights } from './use-char-highlights';

export type HighlightedFieldTone = 'dark' | 'light' | 'light-inverted';

export function cn(
  ...classes: Array<string | false | undefined | null>
): string {
  return classes.filter(Boolean).join(' ');
}

export function HighlightedValueMirror({
  value,
  highlightedIndices
}: {
  value: string;
  highlightedIndices: Set<number>;
}): React.JSX.Element {
  return (
    <>
      {value.split('').map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={cn(
            highlightedIndices.has(index) &&
              'highlighted-text-field__char--highlight'
          )}
        >
          {char}
        </span>
      ))}
    </>
  );
}

export function HighlightedFieldShell({
  tone,
  className,
  isSelecting = false,
  children
}: {
  tone: HighlightedFieldTone;
  className?: string;
  isSelecting?: boolean;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'highlighted-text-field w-full min-w-0',
        isSelecting && 'highlighted-text-field--selecting',
        className
      )}
      data-tone={tone}
    >
      {children}
    </div>
  );
}

export function useHighlightedValue(value: string): {
  highlightedIndices: Set<number>;
} {
  const highlightedIndices = useCharHighlights(value);
  return { highlightedIndices };
}

type HighlightedFieldElement = HTMLInputElement | HTMLTextAreaElement;

type HighlightedFieldSelectionHandlers<T extends HighlightedFieldElement> = {
  onSelect?: FormEventHandler<T>;
  onKeyUp?: KeyboardEventHandler<T>;
  onMouseUp?: MouseEventHandler<T>;
  onBlur?: FocusEventHandler<T>;
};

export function useHighlightedFieldSelection<T extends HighlightedFieldElement>(
  elementRef: RefObject<T | null>,
  external?: HighlightedFieldSelectionHandlers<T>
): {
  isSelecting: boolean;
  handlers: Required<HighlightedFieldSelectionHandlers<T>> & {
    onMouseDown: MouseEventHandler<T>;
    onKeyDown: KeyboardEventHandler<T>;
  };
} {
  const [isSelecting, setIsSelecting] = useState(false);

  const updateSelection = useCallback((element: T | null | undefined): void => {
    if (!element) {
      setIsSelecting(false);
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    setIsSelecting(start !== null && end !== null && start !== end);
  }, []);

  // `select` alone misses drag-selection frames; keep mirror/input in sync.
  useEffect(() => {
    const syncFromDocument = (): void => {
      const element = elementRef.current;
      if (!element || document.activeElement !== element) {
        return;
      }
      updateSelection(element);
    };

    document.addEventListener('selectionchange', syncFromDocument);
    return () => {
      document.removeEventListener('selectionchange', syncFromDocument);
    };
  }, [elementRef, updateSelection]);

  return {
    isSelecting,
    handlers: {
      onMouseDown: () => {
        // Hide mirror immediately — WebKit paints native glyphs under ::selection
        // even when the input fill is transparent, which doubles the text.
        setIsSelecting(true);
      },
      onKeyDown: (event) => {
        if (event.shiftKey) {
          setIsSelecting(true);
        }
      },
      onSelect: (event) => {
        updateSelection(event.currentTarget);
        external?.onSelect?.(event);
      },
      onKeyUp: (event) => {
        updateSelection(event.currentTarget);
        external?.onKeyUp?.(event);
      },
      onMouseUp: (event) => {
        updateSelection(event.currentTarget);
        external?.onMouseUp?.(event);
      },
      onBlur: (event) => {
        setIsSelecting(false);
        external?.onBlur?.(event);
      }
    }
  };
}
