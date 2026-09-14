'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import {
  assertWorkspaceNameAvailable,
  rememberWorkspaceName
} from '@/lib/onboarding/workspace-name-registry';
import {
  getDefaultWidgetAccent,
  HUMANER_DEFAULT_ACCENT
} from '@/lib/urls/extract-brand-accent-color';
import { extractWebsiteMetadata } from '@/lib/urls/extract-website-metadata';
import { getBusinessLogoUrl } from '@/lib/urls/get-business-logo-url';
import {
  isDocsWebsiteUrl,
  resolveBusinessWebsite
} from '@/lib/urls/infer-website-url-from-email';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { updateOrganizationDetailsSchema } from '@/schemas/organization/update-organization-details-schema';

export const updateOrganizationDetails = ownerActionClient
  .metadata({ actionName: 'updateOrganizationDetails' })
  .schema(updateOrganizationDetailsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organization = await prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: {
        name: true,
        website: true,
        docsUrl: true,
        logoUrl: true,
        accentColor: true
      }
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (isDocsWebsiteUrl(parsedInput.website)) {
      throw new PreConditionError(
        'Use your business website URL, not the docs page.'
      );
    }

    const website =
      resolveBusinessWebsite(parsedInput.website, organization.docsUrl) ??
      parsedInput.website;

    const websiteChanged = (organization.website ?? '') !== (website ?? '');

    let nextName = parsedInput.name;
    let nextLogoUrl = organization.logoUrl;
    let nextAccentColor = organization.accentColor;

    if (websiteChanged) {
      if (website) {
        const metadata = await extractWebsiteMetadata(website);
        const scannedName = metadata?.businessName?.trim();
        if (scannedName && parsedInput.name === organization.name) {
          nextName = scannedName;
        }
        nextLogoUrl =
          getBusinessLogoUrl(website, {
            size: 128,
            faviconUrl: metadata?.faviconUrl
          }) ?? null;
        const defaultAccent = getDefaultWidgetAccent();
        const scannedAccent =
          metadata?.accentColor ?? metadata?.brandColors[0] ?? null;
        nextAccentColor =
          scannedAccent &&
          scannedAccent.toLowerCase() !== HUMANER_DEFAULT_ACCENT &&
          scannedAccent.toLowerCase() !== defaultAccent.toLowerCase()
            ? scannedAccent
            : null;
      } else {
        nextLogoUrl = null;
        nextAccentColor = null;
      }
    }

    await assertWorkspaceNameAvailable({
      name: nextName,
      excludeOrganizationId: session.user.organizationId
    });

    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name: nextName,
        address: parsedInput.address,
        phone: parsedInput.phone,
        email: parsedInput.email,
        website,
        ...(websiteChanged
          ? { logoUrl: nextLogoUrl, accentColor: nextAccentColor }
          : {})
      },
      select: {
        id: true
      }
    });

    if (organization.name !== nextName) {
      rememberWorkspaceName(nextName);
    }

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.OrganizationDetails,
        session.user.organizationId
      ),
      'max'
    );

    if (websiteChanged) {
      revalidatePath(Routes.OrganizationWorkspace);
      revalidatePath(Routes.Home);
    }

    return {
      websiteRescanned: websiteChanged,
      name: nextName
    };
  });
