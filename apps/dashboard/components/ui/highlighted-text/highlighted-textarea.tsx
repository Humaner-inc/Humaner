'use client';

import {
  forwardRef,
  useRef,
  type Ref,
  type TextareaHTMLAttributes
} from 'react';

import {
  cn,
  HighlightedFieldShell,
  HighlightedValueMirror,
  useHighlightedFieldSelection,
  useHighlightedValue,
  type HighlightedFieldTone
} from './highlighted-text-field-shared';

export type HighlightedTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
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

export const HighlightedTextarea = forwardRef<
  HTMLTextAreaElement,
  HighlightedTextareaProps
>(function HighlightedTextarea(
  {
    value,
    tone = 'light',
    className,
    mirrorClassName,
    containerClassName,
    onScroll,
    onSelect,
    onKeyUp,
    onKeyDown,
    onMouseUp,
    onMouseDown,
    onBlur,
    ...props
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const { highlightedIndices } = useHighlightedValue(value);
  const { isSelecting, handlers } =
    useHighlightedFieldSelection<HTMLTextAreaElement>(textareaRef, {
      onSelect,
      onKeyUp,
      onMouseUp,
      onBlur
    });

  const syncMirrorScroll = (): void => {
    if (!textareaRef.current || !mirrorRef.current) {
      return;
    }
    mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  return (
    <HighlightedFieldShell
      tone={tone}
      className={containerClassName}
      isSelecting={isSelecting}
    >
      <div className="relative">
        <textarea
          ref={(node) => {
            textareaRef.current = node;
            assignRef(ref, node);
          }}
          value={value}
          className={cn(
            'highlighted-text-field__input relative z-0 w-full resize-none bg-transparent text-sm leading-normal text-transparent outline-none',
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
            'highlighted-text-field__overlay pointer-events-none absolute inset-0 z-10 overflow-hidden whitespace-pre-wrap break-words text-sm leading-normal',
            mirrorClassName
          )}
          aria-hidden
        >
          <HighlightedValueMirror
            value={value}
            highlightedIndices={highlightedIndices}
          />
        </div>
      </div>
    </HighlightedFieldShell>
  );
});
