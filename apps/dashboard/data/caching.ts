import { AppInfo } from '@/constants/app-info';

export enum UserCacheKey {
  OnboardingData,
  Profile,
  PersonalDetails,
  Preferences,
  MultiFactorAuthentication,
  Sessions,
  TransactionalEmails,
  MarketingEmails,
  ActivityNotifications
}

export enum OrganizationCacheKey {
  OrganizationDetails,
  BusinessHours,
  SocialMedia,
  Members,
  Invitations,
  ApiKeys,
  McpOAuthGrants,
  Webhooks,
  Agents,
  KnowledgeSources,
  IntegrationAssignments,
  Industry
}

export class Caching {
  private static readonly USER_PREFIX = 'user';
  private static readonly ORGANIZATION_PREFIX = 'organization';

  private static joinKeyParts(...parts: string[]): string[] {
    return parts.filter((part) => part.length > 0);
  }

  private static joinTagParts(...parts: string[]): string {
    return parts.filter((part) => part.length > 0).join(':');
  }

  public static createUserKeyParts(
    key: UserCacheKey,
    userId: string,
    ...additionalKeyParts: string[]
  ): string[] {
    if (!userId) {
      throw new Error('User ID cannot be empty');
    }
    return this.joinKeyParts(
      this.USER_PREFIX,
      userId,
      UserCacheKey[key].toLowerCase(),
      ...additionalKeyParts
    );
  }

  public static createUserTag(
    key: UserCacheKey,
    userId: string,
    ...additionalTagParts: string[]
  ): string {
    if (!userId) {
      throw new Error('User ID cannot be empty');
    }
    return this.joinTagParts(
      this.USER_PREFIX,
      userId,
      UserCacheKey[key].toLowerCase(),
      ...additionalTagParts
    );
  }

  public static createOrganizationKeyParts(
    key: OrganizationCacheKey,
    organizationId: string,
    ...additionalKeyParts: string[]
  ): string[] {
    if (!organizationId) {
      throw new Error('Organization ID cannot be empty');
    }
    return this.joinKeyParts(
      this.ORGANIZATION_PREFIX,
      organizationId,
      OrganizationCacheKey[key].toLowerCase(),
      ...additionalKeyParts
    );
  }

  public static createOrganizationTag(
    key: OrganizationCacheKey,
    organizationId: string,
    ...additionalTagParts: string[]
  ): string {
    if (!organizationId) {
      throw new Error('Organization ID cannot be empty');
    }
    return this.joinTagParts(
      this.ORGANIZATION_PREFIX,
      organizationId,
      OrganizationCacheKey[key].toLowerCase(),
      ...additionalTagParts
    );
  }
}

export const defaultRevalidateTimeInSeconds = AppInfo.PRODUCTION ? 3600 : 120;

/** Paginated or frequently updated lists. */
export const dynamicListRevalidateTimeInSeconds = AppInfo.PRODUCTION ? 30 : 15;
