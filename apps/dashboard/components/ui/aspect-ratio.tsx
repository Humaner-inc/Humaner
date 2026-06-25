'use client';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

export type AspectRatioElement = React.ElementRef<
  typeof AspectRatioPrimitive.Root
>;
export type AspectRatioProps = React.ComponentProps<
  typeof AspectRatioPrimitive.Root
>;
const AspectRatio = AspectRatioPrimitive.Root;

export { AspectRatio };
