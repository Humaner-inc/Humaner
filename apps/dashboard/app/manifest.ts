import { type MetadataRoute } from 'next';

import { AppInfo } from '@/constants/app-info';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppInfo.APP_NAME,
    short_name: AppInfo.APP_NAME,
    description: AppInfo.APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#070607',
    theme_color: '#070607',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
