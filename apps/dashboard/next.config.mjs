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

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@humaner/shared', 'lucide-animated'],
  // Keep skillz on the Node filesystem so catalog.json resolves via createRequire.
  serverExternalPackages: ['customer-support-skillz'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  turbopack: {
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
        hostname: '*.supabase.co'
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
    return [
      {
        source: '/',
        destination: '/organization/overview',
        permanent: false
      },
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
        destination: '/desk/ai',
        permanent: false
      },
      {
        source: '/inbox',
        destination: '/inbox/all',
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
        destination: '/organization/overview',
        permanent: true
      },
      {
        source: '/dashboard/contacts',
        destination: '/organization/overview',
        permanent: false
      },
      {
        source: '/dashboard/contacts/:path*',
        destination: '/organization/overview',
        permanent: false
      },
      {
        source: '/dashboard',
        destination: '/organization/overview',
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
        source: '/admin/tickets',
        destination: '/dashboard/admin/tickets'
      }
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: [svgLoader]
    });
    return config;
  }
};

export default bundleAnalyzerConfig(nextConfig);
