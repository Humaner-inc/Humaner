import type { TestEnvConfig } from '@/lib/env';

export type EnvPanelProps = {
  config: TestEnvConfig;
  compact?: boolean;
};

export function EnvPanel({
  config,
  compact = false
}: EnvPanelProps): React.JSX.Element {
  const entries = Object.entries(config.rawEnv) as [string, string][];

  if (compact) {
    return (
      <dl className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-0.5">
            <dt className="font-mono text-[10px] text-white/40">{key}</dt>
            <dd className="break-all font-mono text-xs text-white/75">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">apps/test/.env.local</h2>
        <p className="mt-1 text-sm text-white/50">
          Loaded server-side. The API key is masked — the full value is only used
          by <code className="text-white/70">/api/chat</code> on the server.
        </p>

        <dl className="mt-5 space-y-3">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-1 rounded-lg bg-black/25 px-3 py-2.5 sm:grid-cols-[220px_1fr]"
            >
              <dt className="font-mono text-xs font-medium text-white/40">
                {key}
              </dt>
              <dd className="break-all font-mono text-sm text-white/80">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
