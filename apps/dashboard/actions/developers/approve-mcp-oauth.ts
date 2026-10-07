'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import {
  API_KEY_SCOPES,
  PLATFORM_ADMIN_API_KEY_SCOPES
} from '@/lib/auth/api-key-scopes';
import {
  parseMcpOAuthScopes,
  redirectUriMatches
} from '@/lib/developers/mcp-oauth';
import {
  createMcpAuthorizationCode,
  findMcpOAuthClient
} from '@/lib/developers/mcp-oauth-store';
import { ValidationError } from '@/lib/validation/exceptions';

const approveMcpOAuthSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().min(1),
  codeChallenge: z.string().min(1),
  state: z.string().optional(),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1)
});

export const approveMcpOAuth = authActionClient
  .metadata({ actionName: 'approveMcpOAuth' })
  .schema(approveMcpOAuthSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const client = await findMcpOAuthClient(parsedInput.clientId);
    if (
      !client ||
      !redirectUriMatches(client.redirectUris, parsedInput.redirectUri)
    ) {
      throw new ValidationError('Unknown MCP client.');
    }

    const scopes = parseMcpOAuthScopes(parsedInput.scopes).filter(
      (scope) => !PLATFORM_ADMIN_API_KEY_SCOPES.has(scope)
    );
    const code = await createMcpAuthorizationCode({
      clientId: parsedInput.clientId,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      scopes,
      redirectUri: parsedInput.redirectUri,
      codeChallenge: parsedInput.codeChallenge
    });
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.McpOAuthGrants,
        session.user.organizationId
      ),
      'max'
    );

    const target = new URL(parsedInput.redirectUri);
    target.searchParams.set('code', code);
    if (parsedInput.state) {
      target.searchParams.set('state', parsedInput.state);
    }
    return { redirectTo: target.toString() };
  });
