/** Corner radius for dashboard chrome (`--radius`: 12px). */
export const dashboardRadiusClassName = 'rounded-lg';

/** Nested rows/chips inside a 12px panel. */
export const dashboardItemRadiusClassName = 'rounded-md';

/** CTAs stay square. */
export const dashboardCtaRadiusClassName = 'rounded-none';

/** Photos, logos, and avatar faces stay square. */
export const dashboardPictureRadiusClassName = 'rounded-none';

/** Shared bordered panel surfaces across dashboard pages. */
export const dashboardSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardSurfaceDashedClassName = `${dashboardRadiusClassName} border border-dashed border-border/70 bg-muted/20`;

export const dashboardListSurfaceClassName = `divide-y divide-border/60 ${dashboardRadiusClassName} border border-border/70 bg-muted/20`;

export const dashboardInteractiveSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-muted/20 transition-colors hover:border-border`;
