import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecureHeaders } from 'next-secure-headers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// postcss source maps live in the pnpm store, which the bundler does not walk
function sourceMapJsDir() {
  const store = path.join(__dirname, '../../node_modules/.pnpm');
  if (!fs.existsSync(store)) {
    return null;
  }
  const folder = fs
    .readdirSync(store)
    .find((name) => name.startsWith('postcss@'));
  if (!folder) {
    return null;
  }
  const pkg = path.join(store, folder, 'node_modules/postcss/package.json');
  if (!fs.existsSync(pkg)) {
    return null;
  }
  try {
    const require = createRequire(pkg);
    return path
      .dirname(fs.realpathSync(require.resolve('source-map-js')))
      .replaceAll('\\', '/');
  } catch {
    return null;
  }
}

const sourceMapJs = sourceMapJsDir();

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
  transpilePackages: [
    '@humaner/shared',
    'lucide-animated',
    'ldrs',
    'react-globe.gl',
    'globe.gl',
    'three-globe'
  ],
  // Prefer skills/runtime on hot paths; full package stays external on the server.
  serverExternalPackages: ['@humaner/customer-support-skills'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    exposeTestingApiInProductionBuild: false,
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
      '@prisma/client': './lib/generated/prisma',
      ...(sourceMapJs ? { 'source-map-js': sourceMapJs } : {})
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

    // react dev overlay needs eval; production builds omit it
    const scriptSrc =
      process.env.NODE_ENV === 'production'
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

    const dashboardCsp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'"
    ].join('; ');

    return [
      {
        locale: false,
        source: '/favicon.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        locale: false,
        source: '/brandmark_blue.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        // Strict frame protection everywhere.
        locale: false,
        source: '/(.*)',
        headers: [
          ...createSecureHeaders({
            ...baseSecureHeaders,
            frameGuard: 'deny',
            referrerPolicy: 'same-origin'
          }),
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            // The dashboard uses no device APIs.
            key: 'Permissions-Policy',
            value:
              'microphone=(), camera=(), geolocation=(), payment=(), usb=()'
          },
          {
            key: 'Content-Security-Policy',
            value: dashboardCsp
          }
        ]
      }
    ];
  },
  async redirects() {
    const signedInHome = isSelfHostBuild
      ? '/organization/overview'
      : '/overview';

    return [
      {
        source: '/',
        // Cloud: send unsigned visitors straight to login (no /overview bounce).
        // Signed-in users on /auth/login are redirected home by the auth layout.
        destination: isSelfHostBuild ? signedInHome : '/auth/login',
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
              destination: '/overview',
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
        source: '/dashboard',
        destination: signedInHome,
        permanent: true
      },
      {
        source: '/dashboard/agents/:agentId/personality',
        destination: '/persona',
        permanent: true
      },
      {
        source: '/training',
        destination: '/knowledge',
        permanent: true
      },
      {
        source: '/dashboard/training',
        destination: '/knowledge',
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
        source: '/favicon.ico',
        destination: '/favicon.svg'
      },
      {
        source: '/icon.svg',
        destination: '/favicon.svg'
      },
      {
        source: '/apple-touch-icon.png',
        destination: '/favicon.svg'
      },
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
        source: '/persona',
        destination: '/dashboard/persona'
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
        source: '/overview',
        destination: '/dashboard/overview'
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
        source: '/contacts',
        destination: '/dashboard/contacts'
      },
      {
        source: '/contacts/:path*',
        destination: '/dashboard/contacts/:path*'
      },
      {
        source: '/outbound',
        destination: '/dashboard/outbound'
      },
      {
        source: '/outbound/:path*',
        destination: '/dashboard/outbound/:path*'
      },
      {
        source: '/support',
        destination: '/dashboard/support'
      },
      {
        source: '/support/:path*',
        destination: '/dashboard/support/:path*'
      },
      {
        source: '/workflow',
        destination: '/dashboard/workflow'
      },
      {
        source: '/workflow/:path*',
        destination: '/dashboard/workflow/:path*'
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
        source: '/admin/:path*',
        destination: '/dashboard/admin/:path*'
      }
    ];
  },
  webpack(config) {
    // Keep runtime resolution aligned with tsconfig paths → generated client.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prisma/client': path.join(__dirname, 'lib/generated/prisma'),
      ...(sourceMapJs ? { 'source-map-js': sourceMapJs } : {})
    };
    config.module.rules.push({
      test: /\.svg$/i,
      use: [svgLoader]
    });
    return config;
  }
};

export default bundleAnalyzerConfig(nextConfig);
