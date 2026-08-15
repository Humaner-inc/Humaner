import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    server: {
      // next-auth ships bare `next/server` specifiers that Node's ESM resolver
      // rejects; inlining lets Vite resolve them the way Next does.
      deps: { inline: ['next-auth', '@auth/core'] }
    }
  },
  resolve: {
    alias: {
      // `server-only` throws when resolved outside a Next.js server build.
      'server-only': fileURLToPath(
        new URL('./tests/stubs/server-only.ts', import.meta.url)
      ),
      '@prisma/client': fileURLToPath(
        new URL('./lib/generated/prisma', import.meta.url)
      ),
      '@': root.replace(/[\\/]$/, '')
    }
  }
});
