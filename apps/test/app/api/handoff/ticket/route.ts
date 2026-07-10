import { NextResponse } from "next/server";

import { getServerCredentials } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HandoffTicketRequestBody = {
  agentId?: string;
  sessionId?: string;
  visitorEmail?: string;
  note?: string;
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

  let body: HandoffTicketRequestBody;
  try {
    body = (await request.json()) as HandoffTicketRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = `${apiUrl.replace(/\/$/, "")}/api/v1/handoff/ticket`;

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

  const data = (await upstream.json()) as unknown;
  return NextResponse.json(data);
}
