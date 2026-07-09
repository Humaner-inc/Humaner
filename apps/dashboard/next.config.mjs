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
              removeViewBox: false, // Preserve the viewBox attribute
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
        destination: '/dashboard/home',
        permanent: false
      },
      {
        source: '/auth',
        destination: '/auth/login',
        permanent: false
      },
      {
        source: '/dashboard',
        destination: '/dashboard/home',
        permanent: false
      },
      {
        source: '/dashboard/settings',
        destination: '/dashboard/settings/account/profile',
        permanent: false
      },
      {
        source: '/dashboard/settings/account',
        destination: '/dashboard/settings/account/profile',
        permanent: false
      },
      {
        source: '/dashboard/contacts',
        destination: '/dashboard/home',
        permanent: false
      },
      {
        source: '/dashboard/contacts/:path*',
        destination: '/dashboard/home',
        permanent: false
      },
      {
        source: '/dashboard/settings/organization',
        destination: '/dashboard/settings/organization/information',
        permanent: false
      },
      {
        source: '/dashboard/agents/:agentId/personality',
        destination: '/dashboard/agents/:agentId/persona',
        permanent: false
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
