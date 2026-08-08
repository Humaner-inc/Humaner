/**
 * Neutralize `server-only` for plain Node workers (IMAP IDLE).
 * Covers both CJS (tsx transformer) and ESM resolution.
 */
import { register } from 'node:module';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const emptyUrl = pathToFileURL(join(here, 'empty-module.mjs')).href;

register(pathToFileURL(join(here, 'server-only-hook.mjs')).href);

const require = createRequire(import.meta.url);
const Module = require('node:module');

function isServerOnly(request) {
  if (request === 'server-only') return true;
  if (typeof request !== 'string') return false;
  return /(^|[\\/])server-only([\\/]index\.js)?$/.test(request);
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (isServerOnly(request)) {
    return {};
  }
  return originalLoad.apply(this, arguments);
};

// Warm the empty ESM module path for hooks that resolve by URL.
void emptyUrl;
