import { getIndustry } from '@humaner/customer-support-skills/runtime';
import type { IndustryType } from '@prisma/client';

/** Maps Humaner's Prisma `IndustryType` to the open Skills catalog package id. */
const PACKAGE_ID_BY_INDUSTRY: Record<IndustryType, string> = {
  ECOMMERCE: 'retail',
  EDUCATION: 'digital-services',
  FITNESS: 'wellness',
  TRAVEL: 'hospitality'
};

/**
 * Common topics for an industry, read from the open
 * `@humaner/customer-support-skills` catalog. Public: does not depend on the
 * private `services/training/verticals` adapter.
 */
export function getVerticalCommonTopics(industry: IndustryType): string[] {
  const pkg = getIndustry(PACKAGE_ID_BY_INDUSTRY[industry]) as
    | { skills: { core: { commonTopics: string[] } } }
    | undefined;
  return pkg?.skills.core.commonTopics ?? [];
}

/**
 * Resolve which vertical topics are selected for an organization.
 * Empty storage means "all catalog topics" (legacy / pre-seed orgs).
 */
export function resolveSelectedVerticalTopics(
  stored: string[] | null | undefined,
  catalog: string[]
): string[] {
  if (!stored || stored.length === 0) {
    return [...catalog];
  }
  const catalogSet = new Set(catalog);
  return stored.filter((topic) => catalogSet.has(topic));
}
