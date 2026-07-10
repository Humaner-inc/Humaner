"use client";

import * as React from "react";

import type { TestEnvConfig, TestAgent } from "@/lib/env";
import { cn } from "@/lib/utils";

import { EnvPanel } from "./env-panel";

export type DevToolbarProps = {
  config: TestEnvConfig;
  agents: TestAgent[];
  selectedAgentId: string;
  onAgentChange: (id: string) => void;
  integrationMode: "widget" | "api";
  onIntegrationModeChange: (mode: "widget" | "api") => void;
  widgetLoaded: boolean;
  onLoadWidget: () => void;
  onRemoveWidget: () => void;
};

export function DevToolbar({
  config,
  agents,
  selectedAgentId,
  onAgentChange,
  integrationMode,
  onIntegrationModeChange,
  widgetLoaded,
  onLoadWidget,
  onRemoveWidget,
}: DevToolbarProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [showEnv, setShowEnv] = React.useState(false);

  const ready = config.apiKeyConfigured && agents.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 left-5 z-[2147482000] flex size-12 items-center justify-center rounded-full border border-white/15 bg-background/80 text-lg text-white/80 shadow-2xl backdrop-blur-md transition hover:border-white/30 hover:text-white"
        aria-label="Toggle developer panel"
      >
        {open ? "×" : "⚙"}
      </button>

      {open && (
        <div className="fixed bottom-20 left-5 z-[2147482000] w-[min(100vw-2.5rem,380px)] overflow-hidden rounded-2xl border border-white/15 bg-background/92 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Developer panel</p>
            <p className="text-xs text-white/45">Local harness · port 3003</p>
          </div>

          <div className="max-h-[min(70svh,520px)] space-y-4 overflow-y-auto p-4">
            {!ready && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-950/50 px-3 py-2.5 text-xs text-amber-100">
                Set <code>HUMANER_API_KEY</code> and{" "}
                <code>HUMANER_AGENT_ID</code> in{" "}
                <code>apps/test/.env.local</code>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Integration
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["widget", "api"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onIntegrationModeChange(mode)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      integrationMode === mode
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 text-white/50 hover:text-white/80",
                    )}
                  >
                    {mode === "widget" ? "Widget embed" : "Custom API chat"}
                  </button>
                ))}
              </div>
            </div>

            {agents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Agent
                </p>
                <select
                  value={selectedAgentId}
                  onChange={(event) => onAgentChange(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                  {agents.map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                      className="bg-background text-white"
                    >
                      {agent.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {integrationMode === "widget" && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Widget script
                </p>
                <button
                  type="button"
                  onClick={widgetLoaded ? onRemoveWidget : onLoadWidget}
                  disabled={!selectedAgentId}
                  className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
                >
                  {widgetLoaded
                    ? "Remove floating widget"
                    : "Load floating widget"}
                </button>
                <p className="text-[11px] leading-relaxed text-white/40">
                  Adds <code className="text-white/55">widget.js</code> from{" "}
                  {config.apiUrl}. Allow{" "}
                  <code className="text-white/55">localhost</code> on the agent
                  or leave domains empty.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowEnv((prev) => !prev)}
              className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white"
            >
              {showEnv ? "Hide" : "Show"} .env.local values
            </button>

            {showEnv && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <EnvPanel config={config} compact />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
