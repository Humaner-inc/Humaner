import { getBaseUrl } from "@/lib/urls/get-base-url";
import { createUnsubscribeToken } from "@/lib/waitlist/unsubscribe-token";

export function createUnsubscribeUrl(email: string): string | null {
  const token = createUnsubscribeToken(email);

  if (!token) {
    return null;
  }

  const params = new URLSearchParams({
    email,
    token,
  });

  return `${getBaseUrl()}/unsubscribe?${params.toString()}`;
}
