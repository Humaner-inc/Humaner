'use client';

import { forwardRef, useRef, type InputHTMLAttributes, type Ref } from 'react';

import {
  cn,
  HighlightedFieldShell,
  HighlightedValueMirror,
  useHighlightedFieldSelection,
  useHighlightedValue,
  type HighlightedFieldTone
} from './highlighted-text-field-shared';

export type { HighlightedFieldTone };

export type HighlightedTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value'
> & {
  value: string;
  tone?: HighlightedFieldTone;
  mirrorClassName?: string;
  containerClassName?: string;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export const HighlightedTextInput = forwardRef<
  HTMLInputElement,
  HighlightedTextInputProps
>(function HighlightedTextInput(
  {
    value,
    tone = 'light',
    className,
    mirrorClassName,
    containerClassName,
    placeholder,
    onSelect,
    onKeyUp,
    onKeyDown,
    onMouseUp,
    onMouseDown,
    onBlur,
    onScroll,
    ...props
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const { highlightedIndices } = useHighlightedValue(value);
  const { isSelecting, handlers } =
    useHighlightedFieldSelection<HTMLInputElement>(inputRef, {
      onSelect,
      onKeyUp,
      onMouseUp,
      onBlur
    });
  const showPlaceholder =
    !value && typeof placeholder === 'string' && placeholder.length > 0;

  const syncMirrorScroll = (): void => {
    if (!inputRef.current || !mirrorRef.current) {
      return;
    }
    mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
  };

  return (
    <HighlightedFieldShell
      tone={tone}
      className={containerClassName}
      isSelecting={isSelecting}
    >
      <div className="relative h-full w-full min-w-0">
        <input
          ref={(node) => {
            inputRef.current = node;
            assignRef(ref, node);
          }}
          value={value}
          placeholder={placeholder}
          className={cn(
            'highlighted-text-field__input relative z-0 w-full min-w-0 bg-transparent text-sm text-transparent outline-none',
            className
          )}
          onScroll={(event) => {
            syncMirrorScroll();
            onScroll?.(event);
          }}
          {...props}
          {...handlers}
          onMouseDown={(event) => {
            handlers.onMouseDown(event);
            onMouseDown?.(event);
          }}
          onKeyDown={(event) => {
            handlers.onKeyDown(event);
            onKeyDown?.(event);
          }}
        />

        <div
          ref={mirrorRef}
          className={cn(
            'highlighted-text-field__overlay pointer-events-none absolute inset-0 z-10 overflow-hidden whitespace-pre text-sm',
            mirrorClassName
          )}
          aria-hidden
        >
          {showPlaceholder ? (
            <span className="highlighted-text-field__placeholder">
              {placeholder}
            </span>
          ) : (
            <HighlightedValueMirror
              value={value}
              highlightedIndices={highlightedIndices}
            />
          )}
        </div>
      </div>
    </HighlightedFieldShell>
  );
});
