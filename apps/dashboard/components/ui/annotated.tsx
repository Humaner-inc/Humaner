import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { ExternalLinkIcon } from 'lucide-react';

import { slugify } from '@/lib/urls/slugify';
import { cn } from '@/lib/utils';

const annotatedLayoutVariants = cva('py-8', {
  variants: {
    spacing: {
      small: 'space-y-6',
      medium: 'space-y-8',
      large: 'space-y-12'
    }
  },
  defaultVariants: {
    spacing: 'medium'
  }
});

export type AnnotatedLayoutElement = HTMLElement;
export type AnnotatedLayoutProps<
  T extends AnnotatedLayoutElement = HTMLDivElement
> = React.HTMLAttributes<T> &
  VariantProps<typeof annotatedLayoutVariants> & {
    as?: React.ElementType;
  };
const AnnotatedLayout = React.forwardRef<
  AnnotatedLayoutElement,
  AnnotatedLayoutProps
>(
  <T extends AnnotatedLayoutElement = HTMLDivElement>(
    {
      children,
      className,
      spacing,
      as: Component = 'div',
      ...props
    }: AnnotatedLayoutProps<T>,
    ref: React.Ref<T>
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(annotatedLayoutVariants({ spacing, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
AnnotatedLayout.displayName = 'AnnotatedLayout';

const annotatedSectionVariants = cva(
  'grid w-full max-w-4xl grid-cols-1 gap-y-4 px-6 md:grid-cols-12 md:gap-x-8 lg:gap-x-16',
  {
    variants: {
      intent: {
        default: 'bg-background',
        highlight: 'bg-muted'
      }
    },
    defaultVariants: {
      intent: 'default'
    }
  }
);

export type AnnotatedSectionElement = HTMLElement;
export type AnnotatedSectionProps<
  T extends AnnotatedSectionElement = HTMLDivElement
> = React.HTMLAttributes<T> &
  VariantProps<typeof annotatedSectionVariants> & {
    title: string;
    description: React.ReactNode;
    docLink?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    contentClassName?: string;
    as?: React.ElementType;
  };
const AnnotatedSection = React.forwardRef<
  AnnotatedSectionElement,
  AnnotatedSectionProps
>(
  <T extends AnnotatedSectionElement = HTMLDivElement>(
    {
      title,
      description,
      docLink,
      children,
      className,
      titleClassName,
      descriptionClassName,
      contentClassName,
      as: Component = 'div',
      intent,
      ...props
    }: AnnotatedSectionProps<T>,
    ref: React.Ref<T>
  ) => {
    const id = slugify(title);
    return (
      <Component
        ref={ref}
        className={cn(annotatedSectionVariants({ intent, className }))}
        {...props}
      >
        <div className="space-y-4 md:col-span-5">
          <h2
            id={id}
            className={cn('text-sm font-semibold', titleClassName)}
          >
            {title}
          </h2>
          <p
            className={cn(
              'text-sm text-muted-foreground',
              descriptionClassName
            )}
          >
            {description}
          </p>
          {docLink && (
            <Link
              href={docLink}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Read documentation
              <ExternalLinkIcon className="size-3" />
            </Link>
          )}
        </div>
        <div
          className={cn('md:col-span-7', contentClassName)}
          aria-labelledby={id}
        >
          {children}
        </div>
      </Component>
    );
  }
);
AnnotatedSection.displayName = 'AnnotatedSection';

export { AnnotatedLayout, AnnotatedSection };
