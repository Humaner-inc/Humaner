/** Local UI mockups for empty workspaces. Never runs in production. */
export function isLocalDemo(): boolean {
  return process.env.NODE_ENV === 'development';
}
