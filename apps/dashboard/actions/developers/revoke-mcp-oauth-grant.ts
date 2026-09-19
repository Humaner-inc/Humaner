'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { revokeMcpOAuthGrant } from '@/lib/developers/mcp-oauth-store';
import { NotFoundError } from '@/lib/validation/exceptions';

export const revokeMcpOAuthGrantAction = ownerActionClient
  .metadata({ actionName: 'revokeMcpOAuthGrant' })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const revoked = await revokeMcpOAuthGrant({
      id: parsedInput.id,
      organizationId: session.user.organizationId
    });
    if (!revoked) {
      throw new NotFoundError('Connected client not found');
    }
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.McpOAuthGrants,
        session.user.organizationId
      ),
      'max'
    );
  });
