import { MetadataRoute } from 'next';
import { getAppUrl } from '@humaner/shared/urls';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl().replace(/\/$/, '');

  return [
    {
      url: `${base}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3
    },
    {
      url: `${base}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4
    }
  ];
}
