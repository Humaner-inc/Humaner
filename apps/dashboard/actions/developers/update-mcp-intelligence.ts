'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { writeMcpIntelligenceEnabled } from '@/data/developers/mcp-intelligence-mode';

export const updateMcpIntelligence = ownerActionClient
  .metadata({ actionName: 'updateMcpIntelligence' })
  .schema(z.object({ enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    await writeMcpIntelligenceEnabled(
      session.user.organizationId,
      parsedInput.enabled
    );

    revalidatePath(Routes.Developers);
    // Companion visibility lives in the dashboard shell layout.
    revalidatePath('/dashboard', 'layout');
    return { enabled: parsedInput.enabled };
  });
