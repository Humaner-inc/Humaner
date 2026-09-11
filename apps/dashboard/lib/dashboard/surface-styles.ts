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

/** Photo, logo, and avatar tiles use the 12px surface radius. */
export const dashboardPictureRadiusClassName = radiusSurfaceClassName;

/** Shared bordered panel surfaces across dashboard pages. */
export const dashboardSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardSurfaceDashedClassName = `${dashboardRadiusClassName} border border-dashed border-border/70 bg-muted/20`;

export const dashboardListSurfaceClassName = `divide-y divide-border/60 ${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardInteractiveSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20 transition-colors hover:border-border`;
