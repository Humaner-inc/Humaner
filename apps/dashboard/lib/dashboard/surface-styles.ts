import {
  radiusChipClassName,
  radiusCtaPrimaryClassName,
  radiusCtaSecondaryClassName,
  radiusInputClassName,
  radiusModalClassName,
  radiusSurfaceClassName
} from '@humaner/shared';

/** Cards and containers (`--radius`: 12px). */
export const dashboardRadiusClassName = radiusSurfaceClassName;

/** Inputs and search bars (12px). */
export const dashboardInputRadiusClassName = radiusInputClassName;

/** Nested rows inside a 12px panel. */
export const dashboardItemRadiusClassName = radiusSurfaceClassName;

/** Primary CTAs (16px). */
export const dashboardCtaRadiusClassName = radiusCtaPrimaryClassName;

/** Secondary / outline buttons (14px). */
export const dashboardSecondaryRadiusClassName = radiusCtaSecondaryClassName;

/** Small chips and badges. */
export const dashboardChipRadiusClassName = radiusChipClassName;

/** Modals and sheets (24px). */
export const dashboardModalRadiusClassName = radiusModalClassName;

/** Floating create cards — same grey as assignee / dropdown popovers.
 * Do not add CSS clip-path chamfers: they shear bordered corners. */
export const dashboardQuickCreateClassName = `${dashboardModalRadiusClassName} border-border/50 bg-popover text-popover-foreground shadow-lg`;

/** Photo, logo, and avatar tiles use the 12px surface radius. */
export const dashboardPictureRadiusClassName = radiusSurfaceClassName;

/** Shared bordered panel surfaces across dashboard pages. */
export const dashboardSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardSurfaceDashedClassName = `${dashboardRadiusClassName} border border-dashed border-border/70 bg-muted/20`;

export const dashboardListSurfaceClassName = `divide-y divide-border/60 ${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardInteractiveSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20 transition-colors hover:border-border`;

/** Banded inset headers — `--muted` (#e0e1df / #1c1c1e). */
export const dashboardInsetHeaderClassName = 'border-b bg-muted';

/**
 * Companion composer, suggestion chips, and icon pill.
 * Same `--muted` fill as inset headers, plus a light top highlight / bottom lip.
 */
export const companionExtrudeClassName =
  'border-foreground/10 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.72),inset_0_-1px_0_rgb(0_0_0_/_0.06),0_1px_0_0_rgb(0_0_0_/_0.08),0_2px_4px_-1px_rgb(0_0_0_/_0.1)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),inset_0_-1px_0_rgb(0_0_0_/_0.5),0_1px_0_0_rgb(0_0_0_/_0.55),0_3px_6px_-2px_rgb(0_0_0_/_0.45)]';

export const companionSurfaceClassName = `relative isolate overflow-hidden border bg-muted ${companionExtrudeClassName}`;
