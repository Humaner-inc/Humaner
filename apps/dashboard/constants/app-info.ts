import { brand } from '@/brand.config';

import { isOssDeployment } from '@/lib/deployment-mode';
import type { ObjectValues } from '@/types/object-values';

import packageInfo from '../package.json';

/**
 * Product identity. Prefer brand.config.ts for Self-Host white-label;
 * NEXT_PUBLIC_APP_NAME still overrides the display name when set.
 */
/**
 * Product identity. Self-Host always uses brand.config (Acme kit) and ignores
 * Cloud env overrides like NEXT_PUBLIC_APP_NAME=Humaner.
 */
export const AppInfo = {
  APP_NAME: isOssDeployment()
    ? brand.name
    : process.env.NEXT_PUBLIC_APP_NAME?.trim() || brand.name,
  APP_DESCRIPTION: isOssDeployment()
    ? `${brand.name} customer support kit — Helpdesk, BYO agent, team & org.`
    : 'Personality-driven AI support agents. Accurate as a specialist, human as a person.',
  PRODUCTION: process.env.NODE_ENV === 'production',
  VERSION: packageInfo.version,
  /** Self-Host: brand.labels.helpdesk. Cloud: Human Desk. */
  get HELPDESK_LABEL(): string {
    return isOssDeployment() ? brand.labels.helpdesk : 'Human Desk';
  },
  /** Sidebar parent label under Desk / Helpdesk. */
  get DESK_NAV_PARENT(): string {
    return isOssDeployment() ? brand.labels.helpdesk : 'Desk';
  },
  AGENT_LABEL: brand.labels.agent
} as const;

export type AppInfo = ObjectValues<typeof AppInfo>;
