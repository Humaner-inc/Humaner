export const HELP_PANEL_COPY = {
  title: "Need help?",
  description:
    "Reach the team, report a bug or give feedback. Human team only behind the scenes.",
} as const;

export const HELP_PANEL_ITEMS = [
  {
    id: "email",
    label: "Send an email",
    description: "Open your mail client",
    mailtoSubject: "Humaner support",
  },
  {
    id: "bug",
    label: "Report a bug",
    description: "Open a support ticket",
    mailtoSubject: "Bug report",
  },
  {
    id: "feedback",
    label: "Give feedback",
    description: "Share ideas or questions",
    mailtoSubject: "Feedback",
  },
] as const;

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@humaner.io";
}

export function getSupportMailtoUrl(subject?: string): string {
  const email = getSupportEmail();
  if (!subject) {
    return `mailto:${email}`;
  }
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
