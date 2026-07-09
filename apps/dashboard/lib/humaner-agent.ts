/** Public id of the platform Humaner assistant (org guide, product help). */
export function getHumanerAgentPublicId(): string | undefined {
  const id =
    process.env.NEXT_PUBLIC_HUMANER_AGENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_AGENT_ID?.trim();
  return id || undefined;
}
