import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecureHeaders } from 'next-secure-headers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.BUNDLE_ANALYZER === 'true'
});

const svgLoader = {
  loader: '@svgr/webpack',
  options: {
    svgoConfig: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false // Preserve the viewBox attribute
            }
          }
        }
      ]
    }
  }
};

const isSelfHostBuild =
  process.env.NEXT_PUBLIC_DEPLOYMENT_MODE?.trim().toLowerCase() === 'oss';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker / self-host: emit standalone server bundle
  ...(isSelfHostBuild ? { output: 'standalone' } : {}),
  transpilePackages: ['@humaner/shared', 'lucide-animated', 'ldrs'],
  // Prefer skills/runtime on hot paths; full package stays external on the server.
  serverExternalPackages: ['@humaner/customer-support-skills'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    exposeTestingApiInProductionBuild: true,
    optimizePackageImports: [
      'date-fns',
      'recharts',
      '@phosphor-icons/react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'lucide-animated',
      '@humaner/shared',
      'ldrs'
    ]
  },
  turbopack: {
    resolveAlias: {
      '@prisma/client': './lib/generated/prisma'
    },
    rules: {
      '*.svg': {
        loaders: [svgLoader],
        as: '*.js'
      }
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.logo.dev'
      },
      {
        protocol: 'https',
        hostname: '**.neon.tech'
      }
    ]
  },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const baseSecureHeaders = {
      noopen: 'noopen',
      nosniff: 'nosniff',
      xssProtection: 'sanitize',
      forceHTTPSRedirect: [
        true,
        { maxAge: 60 * 60 * 24 * 360, includeSubDomains: true }
      ]
    };

    return [
      {
        // Everything except the embeddable widget gets strict frame protection.
        locale: false,
        source: '/((?!widget/).*)',
        headers: createSecureHeaders({
          ...baseSecureHeaders,
          frameGuard: 'deny',
          referrerPolicy: 'same-origin'
        })
      },
      {
        // The widget is designed to be iframed on third-party sites, so we must
        // NOT send X-Frame-Options: DENY here. `frame-ancestors *` allows
        // embedding while keeping the other hardening headers.
        locale: false,
        source: '/widget/:path*',
        headers: [
          ...createSecureHeaders({
            ...baseSecureHeaders,
            frameGuard: false,
            referrerPolicy: 'strict-origin-when-cross-origin'
          }),
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *'
          }
        ]
      }
    ];
  },
  async redirects() {
    const signedInHome = isSelfHostBuild
      ? '/organization/overview'
      : '/inbox/all';

    return [
      {
        source: '/',
        destination: signedInHome,
        permanent: false
      },
      {
        source: '/organization',
        destination: signedInHome,
        permanent: false
      },
      ...(!isSelfHostBuild
        ? [
            {
              source: '/organization/overview',
              destination: '/inbox/all',
              permanent: false
            }
          ]
        : []),
      {
        source: '/auth',
        destination: '/auth/login',
        permanent: false
      },
      {
        source: '/settings',
        destination: '/settings/account/profile',
        permanent: false
      },
      {
        source: '/settings/account',
        destination: '/settings/account/profile',
        permanent: false
      },
      {
        source: '/settings/organization',
        destination: '/settings/organization/information',
        permanent: false
      },
      {
        source: '/desk',
        destination: '/desk/agent',
        permanent: false
      },
      {
        source: '/desk/ai',
        destination: '/desk/agent',
        permanent: true
      },
      {
        source: '/desk/clusters',
        destination: '/desk/loops',
        permanent: true
      },
      {
        source: '/dashboard/desk/clusters',
        destination: '/desk/loops',
        permanent: true
      },
      {
        source: '/inbox',
        destination: '/inbox/all',
        permanent: false
      },
      {
        source: '/tasks',
        destination: '/organization/tasks',
        permanent: false
      },
      {
        source: '/tasks/:path*',
        destination: '/organization/tasks/:path*',
        permanent: false
      },
      {
        source: '/resources',
        destination: '/organization/resources',
        permanent: false
      },
      {
        source: '/settings/organization/information',
        destination: '/organization/workspace',
        permanent: false
      },
      {
        source: '/dashboard/home/workspace',
        destination: '/organization/workspace',
        permanent: true
      },
      {
        source: '/dashboard/home/team',
        destination: '/organization/team',
        permanent: true
      },
      {
        source: '/dashboard/home',
        destination: signedInHome,
        permanent: true
      },
      {
        source: '/dashboard/contacts',
        destination: signedInHome,
        permanent: false
      },
      {
        source: '/dashboard/contacts/:path*',
        destination: signedInHome,
        permanent: false
      },
      {
        source: '/dashboard',
        destination: signedInHome,
        permanent: true
      },
      {
        source: '/dashboard/agents/:agentId/personality',
        destination: '/agents/:agentId/persona',
        permanent: true
      },
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/organization/overview',
        destination: '/dashboard/home'
      },
      {
        source: '/organization/team',
        destination: '/dashboard/home/team'
      },
      {
        source: '/organization/workspace',
        destination: '/dashboard/home/workspace'
      },
      {
        source: '/organization/tasks',
        destination: '/dashboard/tasks'
      },
      {
        source: '/organization/tasks/:path*',
        destination: '/dashboard/tasks/:path*'
      },
      {
        source: '/organization/resources',
        destination: '/dashboard/resources'
      },
      {
        source: '/organization/resources/:path*',
        destination: '/dashboard/resources/:path*'
      },
      {
        source: '/resources',
        destination: '/dashboard/resources'
      },
      {
        source: '/resources/:path*',
        destination: '/dashboard/resources/:path*'
      },
      {
        source: '/agents',
        destination: '/dashboard/agents'
      },
      {
        source: '/agents/:path*',
        destination: '/dashboard/agents/:path*'
      },
      {
        source: '/desk',
        destination: '/dashboard/desk'
      },
      {
        source: '/desk/:path*',
        destination: '/dashboard/desk/:path*'
      },
      {
        source: '/inbox',
        destination: '/dashboard/inbox'
      },
      {
        source: '/inbox/:path*',
        destination: '/dashboard/inbox/:path*'
      },
      {
        source: '/tasks',
        destination: '/dashboard/tasks'
      },
      {
        source: '/tasks/:path*',
        destination: '/dashboard/tasks/:path*'
      },
      {
        source: '/calendar',
        destination: '/dashboard/calendar'
      },
      {
        source: '/calendar/:path*',
        destination: '/dashboard/calendar/:path*'
      },
      {
        source: '/integrations',
        destination: '/dashboard/integrations'
      },
      {
        source: '/integrations/:path*',
        destination: '/dashboard/integrations/:path*'
      },
      {
        source: '/settings',
        destination: '/dashboard/settings'
      },
      {
        source: '/settings/:path*',
        destination: '/dashboard/settings/:path*'
      },
      {
        source: '/history',
        destination: '/dashboard/history'
      },
      {
        source: '/analytics',
        destination: '/dashboard/analytics'
      },
      {
        source: '/knowledge',
        destination: '/dashboard/knowledge'
      },
      {
        source: '/human-desk',
        destination: '/dashboard/human-desk'
      },
      {
        source: '/human-desk/:path*',
        destination: '/dashboard/human-desk/:path*'
      },
      {
        source: '/training',
        destination: '/dashboard/training'
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/admin/:path*'
      }
    ];
  },
  webpack(config) {
    // Keep runtime resolution aligned with tsconfig paths → generated client.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': path.join(__dirname, 'lib/generated/prisma')
    };
    config.module.rules.push({
      test: /\.svg$/i,
      use: [svgLoader]
    });
    return config;
  }
};

export default bundleAnalyzerConfig(nextConfig);
