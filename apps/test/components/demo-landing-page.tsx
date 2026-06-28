'use client';

import * as React from 'react';

import type { TestEnvConfig } from '@/lib/env';
import { cn } from '@/lib/utils';

import { CustomChatWidget } from './custom-chat-widget';
import { DevToolbar } from './dev-toolbar';
import { LandingShell } from './landing-shell';

export type DemoLandingPageProps = {
  config: TestEnvConfig;
};

type IntegrationMode = 'widget' | 'api';

const FEATURES = [
  'Free shipping over $75',
  '30-day hassle-free returns',
  'Ships worldwide in 5–10 days'
];

export function DemoLandingPage({
  config
}: DemoLandingPageProps): React.JSX.Element {
  const [integrationMode, setIntegrationMode] =
    React.useState<IntegrationMode>('api');
  const [selectedAgentId, setSelectedAgentId] = React.useState(
    config.agents[0]?.id ?? ''
  );
  const [widgetLoaded, setWidgetLoaded] = React.useState(false);

  const selectedAgent =
    config.agents.find((agent) => agent.id === selectedAgentId) ??
    config.agents[0];

  const ready = config.apiKeyConfigured && config.agents.length > 0;
  const baseUrl = config.apiUrl.replace(/\/$/, '');
  const accentColor = '#dc143c';

  React.useEffect(() => {
    if (
      config.agents.length > 0 &&
      !config.agents.some((agent) => agent.id === selectedAgentId)
    ) {
      setSelectedAgentId(config.agents[0].id);
    }
  }, [config.agents, selectedAgentId]);

  React.useEffect(() => {
    if (integrationMode !== 'widget' && widgetLoaded) {
      removeWidget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationMode]);

  const loadWidget = (): void => {
    if (!selectedAgentId) {
      return;
    }

    removeWidget();

    const script = document.createElement('script');
    script.id = 'humaner-test-widget';
    script.src = `${baseUrl}/widget.js`;
    script.setAttribute('data-agent', selectedAgentId);
    script.setAttribute('data-color', accentColor);
    script.setAttribute('data-position', 'bottom-right');
    document.body.appendChild(script);
    setWidgetLoaded(true);
  };

  const removeWidget = (): void => {
    document.getElementById('humaner-test-widget')?.remove();
    document
      .querySelectorAll('iframe[title="Humaner chat"]')
      .forEach((node) => node.remove());
    setWidgetLoaded(false);
  };

  React.useEffect(() => {
    return () => {
      removeWidget();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LandingShell>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white backdrop-blur-sm">
            V
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Velvet &amp; Vine
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-white/55 sm:flex">
          <span>Shop</span>
          <span>About</span>
          <span>Contact</span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 sm:px-8 sm:pt-14">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <section className="space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                Demo storefront · Humaner integration
              </p>
              <h1 className="max-w-xl font-display text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
                Support that feels human, not scripted.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                This page mimics a real landing site. Test the floating widget
                embed or a fully custom chat UI powered by the REST API — both
                talk to your live agent on{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/85">
                  {baseUrl}
                </code>
                .
              </p>
            </div>

            <ul className="space-y-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-white/65"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIntegrationMode('api')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  integrationMode === 'api'
                    ? 'border-white/25 bg-white text-foreground'
                    : 'border-white/15 text-white/65 hover:border-white/25 hover:text-white'
                )}
              >
                Custom API chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntegrationMode('widget');
                  if (!widgetLoaded && selectedAgentId) {
                    loadWidget();
                  }
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  integrationMode === 'widget'
                    ? 'border-white/25 bg-white text-foreground'
                    : 'border-white/15 text-white/65 hover:border-white/25 hover:text-white'
                )}
              >
                Floating widget
              </button>
            </div>

            {integrationMode === 'widget' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-sm text-white/75">
                  The Humaner bubble loads in the corner — same{' '}
                  <code className="text-white/90">widget.js</code> snippet you&apos;d
                  paste on a customer site. Scroll and interact with the page
                  like a real visitor.
                </p>
                {!widgetLoaded && (
                  <button
                    type="button"
                    onClick={loadWidget}
                    disabled={!selectedAgentId}
                    className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}
                  >
                    Open live widget
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="lg:pt-4">
            {integrationMode === 'api' ? (
              <CustomChatWidget
                agentId={selectedAgent?.id ?? ''}
                agentLabel={selectedAgent?.label ?? 'Agent'}
                accentColor={accentColor}
                disabled={!ready}
              />
            ) : (
              <div className="flex h-[min(520px,70svh)] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-white/80">
                  Widget mode active
                </p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">
                  Look for the chat bubble in the bottom-right corner. Use the
                  developer panel to switch agents or remove the widget.
                </p>
                <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4 text-left">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Snippet on this page
                  </p>
                  <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-white/70">
{`<script
  src="${baseUrl}/widget.js"
  data-agent="${selectedAgentId || '…'}"
  data-color="${accentColor}"
  data-position="bottom-right">
</script>`}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/30">
        Local test harness · Velvet &amp; Vine demo · Humaner agents on{' '}
        {baseUrl}
      </footer>

      <DevToolbar
        config={config}
        agents={config.agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={setSelectedAgentId}
        integrationMode={integrationMode}
        onIntegrationModeChange={setIntegrationMode}
        widgetLoaded={widgetLoaded}
        onLoadWidget={loadWidget}
        onRemoveWidget={removeWidget}
      />
    </LandingShell>
  );
}
