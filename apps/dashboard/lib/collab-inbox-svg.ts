import fs from 'node:fs';
import path from 'node:path';

/** SSR-safe read of the auth CollabInbox scene (no client fetch). */
export function readCollabInboxSvg(): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'public/CollabInbox.svg'),
    'utf8'
  );
}
