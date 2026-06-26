import { NextResponse } from 'next/server';
import { z } from 'zod';

const waitlistSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.')
});

async function addToResendAudience(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return;
  }

  const response = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        unsubscribed: false
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const json = await request.json();
    const parsed = waitlistSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid email.' },
        { status: 400 }
      );
    }

    await addToResendAudience(parsed.data.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[waitlist] signup failed:', error);
    return NextResponse.json(
      { error: 'Unable to join the waitlist right now. Please try again.' },
      { status: 500 }
    );
  }
}
