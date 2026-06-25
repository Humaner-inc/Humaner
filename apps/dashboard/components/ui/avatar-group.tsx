import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const avatarGroupVariants = cva(
  'flex flex-row items-center [&>*]:rounded-full',
  {
    variants: {
      spacing: {
        tight: '-space-x-6',
        normal: '-space-x-4',
        loose: '-space-x-2'
      },
      size: {
        xs: '[&>*]:size-6 [&>*]:text-xs',
        sm: '[&>*]:size-8 [&>*]:text-sm',
        md: '[&>*]:size-10 [&>*]:text-base',
        lg: '[&>*]:size-12 [&>*]:text-lg',
        xl: '[&>*]:size-14 [&>*]:text-xl'
      }
    },
    defaultVariants: {
      spacing: 'normal',
      size: 'md'
    }
  }
);

export type AvatarData = {
  id: string;
  name: string;
  image?: string;
};

export type AvatarGroupElement = HTMLDivElement;
export type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof avatarGroupVariants> & {
    avatars: AvatarData[];
    max?: number;
    showOverflowCount?: boolean;
    overflowClassName?: React.HTMLAttributes<HTMLDivElement>['className'];
    renderAvatar?: (avatar: AvatarData, index: number) => React.ReactNode;
  };
const AvatarGroup = React.forwardRef<AvatarGroupElement, AvatarGroupProps>(
  (
    {
      className,
      avatars,
      spacing,
      size,
      max = 4,
      showOverflowCount = true,
      overflowClassName,
      renderAvatar,
      ...props
    },
    ref
  ) => {
    const { shownAvatars, hiddenAvatars } = React.useMemo(() => {
      const shown = avatars.slice(0, max);
      const hidden = avatars.slice(max);
      return { shownAvatars: shown, hiddenAvatars: hidden };
    }, [avatars, max]);

    const defaultRenderAvatar = (avatar: AvatarData, _index: number) => {
      const content = (
        <Avatar
          title={avatar.name}
          className="ring-2 ring-background transition-all duration-200 ease-in-out hover:z-10 hover:-translate-x-1"
        >
          {avatar.image && (
            <AvatarImage
              src={avatar.image}
              alt={avatar.name}
            />
          )}
          <AvatarFallback>
            {avatar.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );

      return <React.Fragment key={avatar.id}>{content}</React.Fragment>;
    };

    const renderAvatarWithKey = (avatar: AvatarData, index: number) => (
      <React.Fragment key={avatar.id}>
        {renderAvatar
          ? renderAvatar(avatar, index)
          : defaultRenderAvatar(avatar, index)}
      </React.Fragment>
    );

    return (
      <div
        ref={ref}
        className={cn(avatarGroupVariants({ spacing, size }), className)}
        {...props}
      >
        {shownAvatars.map(renderAvatarWithKey)}
        {hiddenAvatars.length > 0 && showOverflowCount && (
          <Avatar
            className={cn('bg-muted text-muted-foreground', overflowClassName)}
          >
            <AvatarFallback>+{hiddenAvatars.length}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup, avatarGroupVariants };
