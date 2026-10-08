/**
 * Self-Host (OSS) twin of `access-code-constants.ts`.
 *
 * Self-Host has no early-access wall, so there is no built-in seed code. An
 * `AUTH_ACCESS_CODE` is only honored when the operator sets one of exactly the
 * right length; otherwise the seed is empty and can never match a submitted
 * code. josh renames this file onto `access-code-constants.ts`.
 */
export const AUTH_ACCESS_CODE_LENGTH = 11;

export function resolveAuthAccessCode(
  envCode: string | undefined | null = process.env.AUTH_ACCESS_CODE
): string {
  const fromEnv = envCode?.trim();
  return fromEnv && fromEnv.length === AUTH_ACCESS_CODE_LENGTH ? fromEnv : '';
}
