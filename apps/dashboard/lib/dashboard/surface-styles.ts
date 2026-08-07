import { isOssDeployment } from '@/lib/deployment-mode';

const oss = isOssDeployment();

/** Corner radius for dashboard chrome — Acme rounded, Cloud sharp. */
export const dashboardRadiusClassName = oss
  ? 'rounded-[0.5rem]'
  : 'rounded-none';

/** Shared bordered panel surfaces across dashboard pages. */
export const dashboardSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-card/20`;

export const dashboardSurfaceDashedClassName = `${dashboardRadiusClassName} border border-dashed border-border/70 bg-card/20`;

export const dashboardListSurfaceClassName = `divide-y divide-border/60 ${dashboardRadiusClassName} border border-border/70 bg-card/20`;

export const dashboardInteractiveSurfaceClassName = `${dashboardRadiusClassName} border border-border/70 bg-card/20 transition-colors hover:border-border`;
