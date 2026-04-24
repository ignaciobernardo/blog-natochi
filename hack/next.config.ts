import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const isProduction = process.env.NODE_ENV === 'production';
const immutableRoutes = ['/_next/static/:path*', '/fonts/:path*'] as const;
const mediaRoutes = ['/assets/:path*', '/videos/:path*'] as const;

function createCacheControlHeader(source: string, value: string) {
  return {
    source,
    headers: [
      {
        key: 'Cache-Control',
        value,
      },
    ],
  };
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: 'hack-user-assets.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'static.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/vote',
        destination: '/25/vote',
        permanent: true,
      },
      {
        source: '/vote/:path*',
        destination: '/25/vote/:path*',
        permanent: true,
      },
      {
        source: '/arcade',
        destination: '/25/arcade',
        permanent: true,
      },
      {
        source: '/arcade/:path*',
        destination: '/25/arcade/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/relay-Ph7v/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/relay-Ph7v/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/sponsor-deck/:path*',
        destination: '/es/sponsor-deck/:path*',
      },
      {
        source: '/tour/sponsor/:path*',
        destination: '/es/tour/sponsor/:path*',
      },
      {
        source: '/tour/sponsor',
        destination: '/es/tour/sponsor',
      },
      {
        source: '/:eventSlug((?!es|en)[^/]+)/pics',
        destination: '/pics?eventSlug=:eventSlug',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  typedRoutes: true,
  async headers() {
    if (!isProduction) {
      return [
        ...immutableRoutes.map((source) =>
          createCacheControlHeader(
            source,
            'no-store, no-cache, must-revalidate',
          ),
        ),
        ...mediaRoutes.map((source) =>
          createCacheControlHeader(
            source,
            'no-store, no-cache, must-revalidate',
          ),
        ),
      ];
    }

    return [
      ...immutableRoutes.map((source) =>
        createCacheControlHeader(source, 'public, max-age=31536000, immutable'),
      ),
      ...mediaRoutes.map((source) =>
        createCacheControlHeader(
          source,
          'public, max-age=86400, s-maxage=604800',
        ),
      ),
    ];
  },
};

// Only apply Sentry configuration in production
const finalConfig = withNextIntl(nextConfig);

export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(finalConfig, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      // This can increase your server load as well as your hosting bill.
      // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
      // side errors will fail.
      // tunnelRoute: "/monitoring",

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    })
  : finalConfig;
