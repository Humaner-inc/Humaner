'use server';

import { revalidateTag } from 'next/cache';
import { startOfDay } from 'date-fns';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import {
  isApiKeyScopeAvailable,
  normalizeApiKeyScopes,
  PLATFORM_ADMIN_API_KEY_SCOPES
} from '@/lib/auth/api-key-scopes';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';
import { isAdmin } from '@/lib/auth/permissions';
import {
  getOrganizationCapabilities,
  getOrganizationPlanName
} from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { PreConditionError } from '@/lib/validation/exceptions';
import { createApiKeySchema } from '@/schemas/api-keys/create-api-key-schema';

export const createApiKey = ownerActionClient
  .metadata({ actionName: 'createApiKey' })
  .schema(createApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const [capabilities, organization] = await Promise.all([
      getOrganizationCapabilities(session.user.organizationId),
      prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { completedOnboarding: true }
      })
    ]);
    // Cloud Custom onboarding creates a key before Polar, while the org is
    // still on Free. The key cannot call the API until the trial is active.
    const onboardingAllowsApiKey = organization?.completedOnboarding === false;
    if (!capabilities.apiAccess && !onboardingAllowsApiKey) {
      const planName = await getOrganizationPlanName(
        session.user.organizationId
      );
      throw new PreConditionError(
        `REST API access is not available on the ${planName} plan. Upgrade to Custom or Humaner to create API keys.`
      );
    }

    const apiKey = generateApiKey();
    let scopes = normalizeApiKeyScopes({
      access: parsedInput.access,
      scopes: parsedInput.scopes
    });
    // Scopes with nothing behind them on Self-Host are never minted there.
    scopes = scopes.filter(isApiKeyScopeAvailable);
    // Outbound is Cloud Role.ADMIN preview — never mint on Self-Host or for owners
    if (isOssDeployment() || !(await isAdmin(session.user.id))) {
      scopes = scopes.filter(
        (scope) => !PLATFORM_ADMIN_API_KEY_SCOPES.has(scope)
      );
    }
    const created = await prisma.apiKey.create({
      data: {
        description: parsedInput.description,
        hashedKey: hashApiKey(apiKey),
        scopes,
        expiresAt: parsedInput.neverExpires
          ? null
          : startOfDay(parsedInput.expiresAt ?? new Date()),
        organizationId: session.user.organizationId
      },
      select: {
        id: true,
        description: true,
        scopes: true,
        expiresAt: true
      }
    });

    await recordAuditEvent({
      organizationId: session.user.organizationId,
      eventType: 'api_key.created',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'api_key',
      resourceId: created.id,
      after: {
        description: created.description,
        scopes: created.scopes,
        expiresAt: created.expiresAt?.toISOString() ?? null
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ApiKeys,
        session.user.organizationId
      ),
      'max'
    );

    return { apiKey };
  });
