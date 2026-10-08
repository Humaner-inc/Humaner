import { brand } from '@/brand.config';
import { HUMANER_META_DESCRIPTION } from '@humaner/shared/product-positioning';

import { isOssDeployment } from '@/lib/deployment-mode';
import type { ObjectValues } from '@/types/object-values';

import packageInfo from '../package.json';

/**
 * Product identity — always Humaner.
 * Self-Host helpdesk labels stay "Helpdesk" (content split); chrome is Humaner.
 */
export const AppInfo = {
  APP_NAME: brand.name,
  APP_DESCRIPTION: isOssDeployment()
    ? `${brand.name} self-hosted mailbox — inbox, tasks, calendar, and MCP.`
    : HUMANER_META_DESCRIPTION,
  PRODUCTION: process.env.NODE_ENV === 'production',
  VERSION: packageInfo.version,
  /** Self-Host: Helpdesk. Cloud: Human Desk. */
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
