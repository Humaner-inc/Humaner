import Link from "next/link";

import { ctaSecondaryOnDarkClassName } from "@humaner/shared/cta";
import { uiBodyClassName } from "@humaner/shared/typography";

import { AppInfo } from "@/constants/app-info";
import { unsubscribeWaitlistContact } from "@/lib/resend/waitlist-contacts";
import { verifyUnsubscribeToken } from "@/lib/waitlist/unsubscribe-token";
import { cn } from "@/lib/utils";

type UnsubscribePageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

type UnsubscribeState =
  | { status: "success" }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "error" };

async function resolveUnsubscribeState(
  email: string | undefined,
  token: string | undefined,
): Promise<UnsubscribeState> {
  if (!email || !token) {
    return { status: "missing" };
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return { status: "invalid" };
  }

  try {
    await unsubscribeWaitlistContact(email);
    return { status: "success" };
  } catch (error) {
    console.error("[waitlist] unsubscribe failed:", error);
    return { status: "error" };
  }
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const state = await resolveUnsubscribeState(params.email, params.token);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass-dark w-full max-w-md p-8 text-center">
        {state.status === "success" ? (
          <>
            <h1 className="font-display text-2xl text-[#fff8f2]">
              You&apos;re unsubscribed
            </h1>
            <p className={cn(uiBodyClassName, "mt-3 text-background/60")}>
              You won&apos;t receive any more emails from the {AppInfo.APP_NAME}{" "}
              waitlist.
            </p>
          </>
        ) : null}

        {state.status === "missing" || state.status === "invalid" ? (
          <>
            <h1 className="font-display text-2xl text-[#fff8f2]">
              Invalid unsubscribe link
            </h1>
            <p className={cn(uiBodyClassName, "mt-3 text-background/60")}>
              This link is missing or expired. Use the unsubscribe link from
              your latest email.
            </p>
          </>
        ) : null}

        {state.status === "error" ? (
          <>
            <h1 className="font-display text-2xl text-[#fff8f2]">
              Something went wrong
            </h1>
            <p className={cn(uiBodyClassName, "mt-3 text-background/60")}>
              We couldn&apos;t process your unsubscribe request. Please try
              again in a moment.
            </p>
          </>
        ) : null}

        <Link href="/" className={cn(ctaSecondaryOnDarkClassName, "mt-8")}>
          Back to waitlist
        </Link>
      </div>
    </main>
  );
}
