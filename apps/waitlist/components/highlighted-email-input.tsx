'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes
} from 'react';

import { cn } from '@/lib/utils';

type HighlightedEmailInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const HIGHLIGHT_MS = 800;

type ActiveHighlight = {
  index: number;
  id: number;
};

export function HighlightedEmailInput({
  value,
  onChange,
  className,
  ...props
}: HighlightedEmailInputProps): React.JSX.Element {
  const prevLengthRef = useRef(value.length);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [highlights, setHighlights] = useState<ActiveHighlight[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const addHighlights = (from: number, to: number): void => {
    const added: ActiveHighlight[] = [];

    for (let index = from; index < to; index += 1) {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      added.push({ index, id });

      const timer = setTimeout(() => {
        setHighlights((current) => current.filter((item) => item.id !== id));
        timersRef.current.delete(id);
      }, HIGHLIGHT_MS);

      timersRef.current.set(id, timer);
    }

    if (added.length > 0) {
      setHighlights((current) => [...current, ...added]);
    }
  };

  const clearHighlights = (): void => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setHighlights([]);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    const prevLength = prevLengthRef.current;

    if (next.length > prevLength) {
      addHighlights(prevLength, next.length);
    } else {
      clearHighlights();
    }

    prevLengthRef.current = next.length;
    onChange(event);
  };

  const highlightedIndices = new Set(highlights.map((item) => item.index));

  return (
    <div className="highlighted-email min-w-0 flex-1 overflow-x-auto">
      <div className="grid min-w-max [&>*]:col-start-1 [&>*]:row-start-1">
        <div
          className="pointer-events-none flex items-center whitespace-pre border-b border-transparent py-2 text-sm leading-normal"
          aria-hidden
        >
          {value.split('').map((char, index) => (
            <span
              key={`${index}-${char}`}
              className={cn(
                'text-white',
                highlightedIndices.has(index) && 'email-char-highlight'
              )}
            >
              {char}
            </span>
          ))}
        </div>

        <input
          type="email"
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full min-w-[12rem] border-0 border-b border-white/20 bg-transparent py-2 text-sm leading-normal text-transparent caret-white outline-none transition-colors placeholder:text-white/35 focus:border-white/50 disabled:opacity-60',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
}
