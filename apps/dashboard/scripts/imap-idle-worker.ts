//Long-lived IMAP IDLE worker entrypoint. pnpm --filter @humaner/dashboard imap:idle

import { runImapIdleWorker } from '../services/inbox/imap-idle-worker';

const controller = new AbortController();

function shutdown(signal: string): void {
  console.log(`[imap-idle] received ${signal}; shutting down`);
  controller.abort();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

runImapIdleWorker(controller.signal)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[imap-idle] fatal', error);
    process.exit(1);
  });
