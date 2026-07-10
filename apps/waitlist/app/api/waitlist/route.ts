import { NextResponse } from "next/server";
import { z } from "zod";

import { addToResendAudience } from "@/lib/resend/waitlist-contacts";
import { sendWaitlistWelcomeEmail } from "@/lib/smtp/send-waitlist-welcome-email";

const waitlistSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const json = await request.json();
    const parsed = waitlistSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid email." },
        { status: 400 },
      );
    }

    const email = parsed.data.email;

    await addToResendAudience(email);

    try {
      await sendWaitlistWelcomeEmail({ recipient: email });
    } catch (error) {
      console.error("[waitlist] welcome email failed:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[waitlist] signup failed:", error);
    return NextResponse.json(
      { error: "Unable to join the waitlist right now. Please try again." },
      { status: 500 },
    );
  }
}
