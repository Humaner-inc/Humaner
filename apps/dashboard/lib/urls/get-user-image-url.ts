export function getUserImageUrl(userId: string, hash: string): string {
  return `/api/user-images/${userId}?v=${hash}`;
}
