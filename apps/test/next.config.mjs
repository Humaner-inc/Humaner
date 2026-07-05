/** @type {import('next').NextConfig} */
const nextConfig = {};

if (process.env.VERCEL_ENV === 'production') {
  throw new Error(
    'apps/test must NEVER be deployed to production. ' +
    'It proxies requests with a server-side API key and has no client authentication.'
  );
}

export default nextConfig;
