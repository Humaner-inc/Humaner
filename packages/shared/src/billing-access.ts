/** Full access continues for this many days after a failed Inbox payment. */
export const BILLING_PAST_DUE_GRACE_DAYS = 7;

export type WorkspaceBillingBannerKind =
  | "payment_issue_grace"
  | "payment_issue_read_only"
  | "subscription_ended"
  | "trial_ended";

export type WorkspaceBillingAccessDto = {
  readOnly: boolean;
  banner: {
    kind: WorkspaceBillingBannerKind;
    /** Whole days left in the payment grace window (payment_issue_grace only). */
    graceDaysRemaining?: number;
  } | null;
};
