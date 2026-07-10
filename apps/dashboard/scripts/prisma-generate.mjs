#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');

function runGenerate() {
  return spawnSync(process.execPath, [prismaCli, 'generate'], {
    cwd: dashboardRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env
  });
}

const result = runGenerate();

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

if (result.status === 0) {
  process.exit(0);
}

if (output.includes('EPERM') && output.includes('query_engine')) {
  console.error('');
  console.error(
    'Prisma generate failed: the query engine file is locked on Windows.'
  );
  console.error('');
  console.error('Stop anything using Prisma Client, then retry:');
  console.error(
    '  1. Stop the dashboard dev server (Ctrl+C in the terminal running pnpm dev)'
  );
  console.error('  2. Close Prisma Studio if open');
  console.error('  3. Run: pnpm run db:generate');
  console.error('');
  console.error(
    'Your database schema may already be synced — only client regeneration is blocked.'
  );
}

process.exit(result.status ?? 1);
