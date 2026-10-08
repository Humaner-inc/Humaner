//Long-lived worker entrypoint: IMAP IDLE sessions + realtime hub.
//pnpm --filter @humaner/dashboard imap:idle

import { runImapIdleWorker } from '../services/inbox/imap-idle-worker';

const controller = new AbortController();

// Realtime hub (SSE for browsers). Opt-in so Self-Host keeps its in-process path.
const hubEnabled = process.env.REALTIME_HUB_ENABLED === 'true';

async function main(): Promise<void> {
  if (hubEnabled) {
    const { startRealtimeHub } = await import('../services/realtime/hub');
    const server = startRealtimeHub(Number(process.env.PORT) || 8080);
    controller.signal.addEventListener('abort', () => server.close(), {
      once: true
    });
  }

  await runImapIdleWorker(controller.signal);

  // IDLE disabled but the hub is up: stay alive to serve it.
  if (hubEnabled && !controller.signal.aborted) {
    await new Promise<void>((resolve) =>
      controller.signal.addEventListener('abort', () => resolve(), {
        once: true
      })
    );
  }
}

function shutdown(signal: string): void {
  console.log(`[imap-idle] received ${signal}; shutting down`);
  controller.abort();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[imap-idle] fatal', error);
    process.exit(1);
  });
