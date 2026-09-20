import { type MetadataRoute } from 'next';

import { AppInfo } from '@/constants/app-info';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppInfo.APP_NAME,
    short_name: AppInfo.APP_NAME,
    description: AppInfo.APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D0D',
    theme_color: '#0A0D0D',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  };
}
