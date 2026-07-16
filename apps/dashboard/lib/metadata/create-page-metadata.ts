import type { Metadata } from 'next';

import { createTitle } from '@/lib/utils';

export function createPageMetadata(
  pathname: string,
  title: string,
  options?: { description?: string; titleSuffix?: boolean }
): Metadata {
  const pageTitle = createTitle(title, options?.titleSuffix ?? true);

  return {
    title: pageTitle,
    ...(options?.description ? { description: options.description } : {}),
    alternates: {
      canonical: pathname
    },
    openGraph: {
      title: pageTitle,
      url: pathname,
      ...(options?.description ? { description: options.description } : {})
    }
  };
}
