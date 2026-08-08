/**
 * Resolve `server-only` to an empty module outside Next.js (IMAP IDLE worker).
 */
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const emptyUrl = pathToFileURL(
  join(dirname(fileURLToPath(import.meta.url)), 'empty-module.mjs')
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { shortCircuit: true, url: emptyUrl };
  }
  return nextResolve(specifier, context);
}
