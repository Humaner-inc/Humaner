import { type MetadataRoute } from 'next';

import { AppInfo } from '@/constants/app-info';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppInfo.APP_NAME,
    short_name: AppInfo.APP_NAME,
    description: AppInfo.APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/humaner.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/humaner.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
