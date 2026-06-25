'use client';

import * as React from 'react';
import { StarIcon } from 'lucide-react';

import { cn, mergeRefs } from '@/lib/utils';

const ratingVariants = {
  default: {
    star: 'text-foreground',
    emptyStar: 'text-muted-foreground'
  },
  destructive: {
    star: 'text-red-500',
    emptyStar: 'text-red-200'
  },
  yellow: {
    star: 'text-yellow-500',
    emptyStar: 'text-yellow-200'
  }
} as const;

export type RatingElement = HTMLDivElement;
export type RatingProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onValueChange'
> & {
  value: number;
  totalStars?: number;
  size?: number;
  fill?: boolean;
  Icon?: React.ReactElement;
  variant?: keyof typeof ratingVariants;
  onChange?: (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>,
    value: number
  ) => void;
  onValueChange?: (value: number) => void;
  readOnly?: boolean;
  name?: string;
};
const Rating = React.forwardRef<RatingElement, RatingProps>(
  (
    {
      value,
      totalStars = 5,
      size = 20,
      fill = true,
      Icon = <StarIcon />,
      variant = 'default',
      onChange,
      onValueChange,
      readOnly = false,
      className,
      name,
      ...props
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const [focusedStar, setFocusedStar] = React.useState<number | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleValueChange = React.useCallback(
      (
        event:
          | React.MouseEvent<HTMLButtonElement>
          | React.KeyboardEvent<HTMLButtonElement>,
        newValue: number
      ) => {
        if (!readOnly) {
          onChange?.(event, newValue);
          onValueChange?.(newValue);
        }
      },
      [readOnly, onChange, onValueChange]
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (readOnly) return;

        let newValue = focusedStar !== null ? focusedStar : value;

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            newValue = Math.min(totalStars, newValue + 1);
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            newValue = Math.max(1, newValue - 1);
            break;
          case 'Home':
            newValue = 1;
            break;
          case 'End':
            newValue = totalStars;
            break;
          default:
            return;
        }

        event.preventDefault();
        setFocusedStar(newValue);
        handleValueChange(event, newValue);
      },
      [focusedStar, value, totalStars, readOnly, handleValueChange]
    );

    const renderStar = React.useCallback(
      (index: number) => {
        const isActive = index < (hoverValue ?? focusedStar ?? value);
        return React.cloneElement(Icon, {
          key: index,
          size,
          className: cn(
            'transition-colors duration-200',
            isActive && fill ? 'fill-current' : 'fill-transparent',
            isActive
              ? ratingVariants[variant].star
              : ratingVariants[variant].emptyStar,
            !readOnly && 'cursor-pointer'
          ),
          'aria-hidden': 'true'
        });
      },
      [Icon, size, fill, hoverValue, focusedStar, value, variant, readOnly]
    );

    React.useEffect(() => {
      if (focusedStar !== null && containerRef.current) {
        const buttons = containerRef.current.querySelectorAll('button');
        buttons[focusedStar - 1]?.focus();
      }
    }, [focusedStar]);

    return (
      <div
        ref={mergeRefs(ref, containerRef)}
        className={cn('inline-flex items-center gap-0.5', className)}
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={() => setHoverValue(null)}
        {...props}
      >
        {[...Array(totalStars)].map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={(event) => handleValueChange(event, index + 1)}
            onMouseEnter={() => !readOnly && setHoverValue(index + 1)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedStar(index + 1)}
            onBlur={() => setFocusedStar(null)}
            disabled={readOnly}
            className={cn(
              'rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'p-0.5',
              readOnly && 'cursor-default'
            )}
            role="radio"
            aria-checked={value === index + 1}
            aria-posinset={index + 1}
            aria-setsize={totalStars}
            tabIndex={readOnly ? -1 : value === index + 1 ? 0 : -1}
          >
            {renderStar(index)}
          </button>
        ))}
        {name && (
          <input
            type="hidden"
            name={name}
            value={value}
          />
        )}
      </div>
    );
  }
);

Rating.displayName = 'Rating';

export { Rating, ratingVariants };
