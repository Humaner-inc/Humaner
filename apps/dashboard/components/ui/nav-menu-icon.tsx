'use client';

import * as React from 'react';

import type { AnimatedIconHandle, LucideIcon } from '@humaner/shared/icons';

export type NavMenuIconProps = {
  icon: LucideIcon;
  className?: string;
};

export function useNavMenuIconAnimation(): {
  iconRef: React.RefObject<AnimatedIconHandle | null>;
  triggerAnimation: () => void;
  stopAnimation: () => void;
  menuHoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
} {
  const iconRef = React.useRef<AnimatedIconHandle>(null);

  const triggerAnimation = React.useCallback(() => {
    iconRef.current?.startAnimation?.();
  }, []);

  const stopAnimation = React.useCallback(() => {
    iconRef.current?.stopAnimation?.();
  }, []);

  return {
    iconRef,
    triggerAnimation,
    stopAnimation,
    menuHoverHandlers: {
      onMouseEnter: triggerAnimation,
      onMouseLeave: stopAnimation
    }
  };
}

export function NavMenuIcon({
  icon: Icon,
  className,
  iconRef
}: NavMenuIconProps & {
  iconRef: React.RefObject<AnimatedIconHandle | null>;
}): React.JSX.Element {
  return (
    <Icon
      ref={iconRef as React.Ref<AnimatedIconHandle>}
      className={className}
      animateOnHover={false}
    />
  );
}
