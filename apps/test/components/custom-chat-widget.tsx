"use client";

import * as React from "react";

import {
  HandoffActions,
  type HandoffPayload,
} from "@/components/handoff-actions";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  handoff?: HandoffPayload | null;
};

export type CustomChatWidgetProps = {
  agentId: string;
  agentLabel: string;
  accentColor?: string;
  disabled?: boolean;
  className?: string;
};

export function CustomChatWidget({
  agentId,
  agentLabel,
  accentColor = "#e1ccaf",
  disabled = false,
  className,
}: CustomChatWidgetProps): React.JSX.Element {
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi — I'm ${agentLabel}. Ask me anything about shipping, returns, or your order.`,
    },
  ]);
  const sessionIdRef = React.useRef(crypto.randomUUID());
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const messagesRef = React.useRef<ChatMessage[]>(messages);

  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const getHistory = React.useCallback(
    () =>
      messagesRef.current
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [],
  );

  const send = async (): Promise<void> => {
    const text = input.trim();
    if (!text || isStreaming || disabled || !agentId) {
      return;
    }

    const history = getHistory();

    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          sessionId: sessionIdRef.current,
          message: text,
          history,
        }),
      });

      if (!response.ok) {
        let detail = `Request failed (${response.status})`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) {
            detail = body.error;
          }
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      if (!response.body) {
        throw new Error("No response body.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      const appendDelta = (delta: string): void => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              content: last.content + delta,
            };
          }
          return next;
        });
      };

      const attachHandoff = (handoff: HandoffPayload | null): void => {
        if (!handoff) {
          return;
        }
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, handoff };
          }
          return next;
        });
      };

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.trim();
          if (!line.startsWith("data:")) {
            continue;
          }
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload) as {
              delta?: string;
              handoff?: HandoffPayload | null;
            };
            if (parsed.delta) {
              appendDelta(parsed.delta);
            }
            if (parsed.handoff !== undefined) {
              attachHandoff(parsed.handoff);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content) {
          next.pop();
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-[min(520px,70svh)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.55)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <div>
            <p className="text-sm font-medium text-white/95">{agentLabel}</p>
            <p className="text-[11px] text-white/45">
              Custom API · streaming SSE
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
          Live
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "max-w-[88%]",
              message.role === "user" ? "ml-auto" : "",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "rounded-br-sm bg-white text-[#070607]"
                  : "rounded-bl-sm border border-white/10 bg-white/15 text-white/90 backdrop-blur-sm",
              )}
            >
              {message.content || (isStreaming ? "…" : "")}
            </div>
            {message.role === "assistant" && message.handoff ? (
              <HandoffActions
                handoff={message.handoff}
                accentColor={accentColor}
                agentId={agentId}
                sessionId={sessionIdRef.current}
                getHistory={getHistory}
              />
            ) : null}
          </div>
        ))}
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
      </div>

      <form
        className="border-t border-white/10 p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              disabled
                ? "Configure apps/test/.env.local to enable chat"
                : "Ask about shipping, returns, sizing…"
            }
            disabled={disabled || isStreaming}
            className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none ring-white/20 focus:ring-2"
          />
          <button
            type="submit"
            disabled={disabled || isStreaming || !input.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: accentColor }}
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
