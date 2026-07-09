'use client';

import * as React from 'react';

import type { AnimatedIconHandle, LucideIcon } from '@humaner/shared/icons';
import { cn } from '@/lib/utils';

type BranchIconAnimationContextValue = {
  iconRef: React.RefObject<AnimatedIconHandle | null>;
};

const BranchIconAnimationContext =
  React.createContext<BranchIconAnimationContextValue | null>(null);

export function useBranchIconAnimation(): {
  iconRef: React.RefObject<AnimatedIconHandle | null>;
  triggerAnimation: () => void;
  stopAnimation: () => void;
  rowHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointerDown: () => void;
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
    rowHandlers: {
      onMouseEnter: triggerAnimation,
      onMouseLeave: stopAnimation,
      onPointerDown: triggerAnimation
    }
  };
}

export function BranchIconAnimationProvider({
  value,
  children
}: {
  value: BranchIconAnimationContextValue;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <BranchIconAnimationContext.Provider value={value}>
      {children}
    </BranchIconAnimationContext.Provider>
  );
}

type SidebarBranchIconProps = {
  icon: LucideIcon;
  className?: string;
};

export function SidebarBranchIcon({
  icon: Icon,
  className
}: SidebarBranchIconProps): React.JSX.Element {
  const context = React.useContext(BranchIconAnimationContext);
  const localRef = React.useRef<AnimatedIconHandle>(null);
  const iconRef = context?.iconRef ?? localRef;

  return (
    <Icon
      ref={iconRef}
      className={cn('size-3.5 shrink-0', className)}
      animateOnHover={!context}
      strokeWidth={1.5}
    />
  );
}
