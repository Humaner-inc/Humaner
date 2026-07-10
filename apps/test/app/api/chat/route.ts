import { NextResponse } from "next/server";

import { getServerCredentials } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  agentId?: string;
  sessionId?: string;
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

export async function POST(request: Request): Promise<Response> {
  const { apiUrl, apiKey } = getServerCredentials();

  if (!apiKey) {
    return NextResponse.json(
      { error: "HUMANER_API_KEY is not set in apps/test/.env.local" },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agentId = body.agentId?.trim();
  const message = body.message?.trim();
  const sessionId = body.sessionId?.trim() || crypto.randomUUID();

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required." },
      { status: 400 },
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 },
    );
  }

  const endpoint = `${apiUrl.replace(/\/$/, "")}/api/v1/chat`;

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId,
      sessionId,
      message,
      history: body.history,
    }),
  });

  if (!upstream.ok) {
    let detail = `Humaner API returned ${upstream.status}`;
    try {
      const errorBody = (await upstream.json()) as { error?: string };
      if (errorBody.error) {
        detail = errorBody.error;
      }
    } catch {
      // ignore non-JSON bodies
    }
    return NextResponse.json({ error: detail }, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
