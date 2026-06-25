'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const tagVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-md border pl-2 text-sm transition-all',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        primary:
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90'
      },
      size: {
        sm: 'h-7 text-xs',
        md: 'h-8 text-sm',
        lg: 'h-9 text-base',
        xl: 'h-10 text-lg'
      },
      shape: {
        default: 'rounded-sm',
        rounded: 'rounded-lg',
        square: 'rounded-none',
        pill: 'rounded-full'
      },
      borderStyle: {
        default: 'border-solid',
        none: 'border-none'
      },
      textCase: {
        uppercase: 'uppercase',
        lowercase: 'lowercase',
        capitalize: 'capitalize'
      },
      interaction: {
        clickable: 'cursor-pointer hover:shadow-md',
        nonClickable: 'cursor-default'
      },
      animation: {
        none: '',
        fadeIn: 'animate-fadeIn',
        slideIn: 'animate-slideIn',
        bounce: 'animate-bounce'
      },
      textStyle: {
        normal: 'font-normal',
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        lineThrough: 'line-through'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'default',
      borderStyle: 'default',
      interaction: 'nonClickable',
      animation: 'fadeIn',
      textStyle: 'normal'
    }
  }
);

export type TagProps = {
  tagObj: TagType;
  variant: TagInputProps['variant'];
  size: TagInputProps['size'];
  shape: TagInputProps['shape'];
  borderStyle: TagInputProps['borderStyle'];
  textCase: TagInputProps['textCase'];
  interaction: TagInputProps['interaction'];
  animation: TagInputProps['animation'];
  textStyle: TagInputProps['textStyle'];
  onRemoveTag?: (id: string) => void;
} & Pick<TagInputProps, 'direction' | 'onTagClick'>;

function Tag({
  tagObj,
  direction,
  onTagClick,
  onRemoveTag,
  variant,
  size,
  shape,
  borderStyle,
  textCase,
  interaction,
  animation,
  textStyle
}: TagProps): React.JSX.Element {
  return (
    <span
      key={tagObj.id}
      className={cn(
        tagVariants({
          variant,
          size,
          shape,
          borderStyle,
          textCase,
          interaction,
          animation,
          textStyle
        }),
        {
          'justify-between': direction === 'column'
        },
        !onRemoveTag && 'pr-2'
      )}
      onClick={() => onTagClick?.(tagObj)}
    >
      {tagObj.text}
      {onRemoveTag && (
        <Button
          type="button"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event from bubbling up to the tag span
            onRemoveTag(tagObj.id);
          }}
          className="h-full px-3 py-1 hover:bg-transparent"
        >
          <XIcon
            width={14}
            height={14}
            className="shrink-0"
          />
        </Button>
      )}
    </span>
  );
}

export type TagListProps = {
  tags: TagType[];
  direction?: TagProps['direction'];
  className?: React.HtmlHTMLAttributes<HTMLDivElement>['className'];
} & Omit<TagProps, 'tagObj'>;

export const TagList: React.FC<TagListProps> = ({
  tags,
  direction,
  className,
  ...tagListProps
}) => {
  return (
    <div
      className={cn(
        'max-w-[450px] rounded-md',
        {
          'flex flex-wrap gap-2': direction === 'row',
          'flex flex-col gap-2': direction === 'column'
        },
        className
      )}
    >
      {tags.map((tag) => (
        <Tag
          key={tag.id}
          tagObj={tag}
          {...tagListProps}
        />
      ))}
    </div>
  );
};

export enum Delimiter {
  Comma = ',',
  Enter = 'Enter'
}

type OmittedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value'
>;

export type TagType = {
  id: string;
  text: string;
};

export type TagInputProps = OmittedInputProps &
  VariantProps<typeof tagVariants> & {
    placeholder?: string;
    tags: TagType[];
    onTagsChange: (tags: TagType[]) => void;
    maxTags?: number;
    minTags?: number;
    readOnly?: boolean;
    disabled?: boolean;
    onTagAdd?: (tag: string) => void;
    onTagRemove?: (tag: string) => void;
    allowDuplicates?: boolean;
    validateTag?: (tag: string) => boolean;
    delimiter?: Delimiter;
    placeholderWhenFull?: string;
    sortTags?: boolean;
    delimiterList?: string[];
    truncate?: number;
    minLength?: number;
    maxLength?: number;
    value?: string | number | readonly string[] | TagType[];
    direction?: 'row' | 'column';
    onInputChange?: (value: string) => void;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onTagClick?: (tag: TagType) => void;
    inputFieldPosition?: 'bottom' | 'top' | 'inline';
    clearAll?: boolean;
    onClearAll?: () => void;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  };

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (props, ref) => {
    const {
      id,
      placeholder,
      tags,
      onTagsChange,
      variant,
      size,
      shape,
      className,
      maxTags,
      delimiter = Delimiter.Comma,
      onTagAdd,
      onTagRemove,
      allowDuplicates,
      validateTag,
      placeholderWhenFull = 'Max tags reached',
      sortTags,
      delimiterList,
      truncate,
      borderStyle,
      textCase,
      interaction,
      animation,
      textStyle,
      minLength,
      maxLength,
      direction = 'row',
      onInputChange,
      onFocus,
      onBlur,
      onTagClick,
      inputFieldPosition = 'bottom',
      clearAll = false,
      onClearAll,
      inputProps = {}
    } = props;

    const [inputValue, setInputValue] = React.useState('');
    if (
      (maxTags !== undefined && maxTags < 0) ||
      (props.minTags !== undefined && props.minTags < 0)
    ) {
      console.warn('maxTags and minTags cannot be less than 0');
      // error
      return null;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onInputChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        delimiterList
          ? delimiterList.includes(e.key)
          : e.key === delimiter || e.key === Delimiter.Enter
      ) {
        e.preventDefault();
        const newTagText = inputValue.trim();

        if (validateTag && !validateTag(newTagText)) {
          return;
        }

        if (minLength && newTagText.length < minLength) {
          console.warn('Tag is too short');
          // error
          return;
        }

        // Validate maxLength
        if (maxLength && newTagText.length > maxLength) {
          // error
          console.warn('Tag is too long');
          return;
        }

        const newTagId = crypto
          .getRandomValues(new Uint32Array(1))[0]
          .toString();

        if (
          newTagText &&
          (allowDuplicates || !tags.some((tag) => tag.text === newTagText)) &&
          (maxTags === undefined || tags.length < maxTags)
        ) {
          onTagsChange([...tags, { id: newTagId, text: newTagText }]);
          onTagAdd?.(newTagText);
        }
        setInputValue('');
      }
    };

    const removeTag = (idToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag.id !== idToRemove));
      onTagRemove?.(tags.find((tag) => tag.id === idToRemove)?.text || '');
    };

    const handleClearAll = () => {
      onClearAll?.();
    };

    const displayedTags = sortTags ? [...tags].sort() : tags;

    const truncatedTags = truncate
      ? tags.map((tag) => ({
          id: tag.id,
          text:
            tag.text?.length > truncate
              ? `${tag.text.substring(0, truncate)}...`
              : tag.text
        }))
      : displayedTags;

    return (
      <div
        className={`relative flex w-full gap-3 ${
          inputFieldPosition === 'bottom'
            ? 'flex-col'
            : inputFieldPosition === 'top'
              ? 'flex-col-reverse'
              : 'flex-row'
        }`}
      >
        <TagList
          tags={truncatedTags}
          variant={variant}
          size={size}
          shape={shape}
          borderStyle={borderStyle}
          textCase={textCase}
          interaction={interaction}
          animation={animation}
          textStyle={textStyle}
          onTagClick={onTagClick}
          onRemoveTag={removeTag}
          direction={direction}
        />
        <div className="w-full">
          <Input
            ref={ref}
            id={id}
            type="text"
            placeholder={
              maxTags !== undefined && tags.length >= maxTags
                ? placeholderWhenFull
                : placeholder
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            {...inputProps}
            className={className}
            disabled={maxTags !== undefined && tags.length >= maxTags}
          />
        </div>
        {clearAll && (
          <Button
            type="button"
            onClick={handleClearAll}
            className="mt-2"
          >
            Clear All
          </Button>
        )}
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';

export { TagInput };
