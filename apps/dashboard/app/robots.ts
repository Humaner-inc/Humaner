import type { MetadataRoute } from 'next';
import { getLandingUrl } from '@humaner/shared/urls';

export default function robots(): MetadataRoute.Robots {
  const landing = getLandingUrl().replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: ['/auth/', '/manifest'],
      disallow: [
        '/dashboard',
        '/onboarding',
        '/settings',
        '/organization',
        '/api/'
      ]
    },
    sitemap: `${landing}/sitemap.xml`
  };
}
