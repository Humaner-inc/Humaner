export function getContactImageUrl(contactId: string, hash: string): string {
  return `/api/contact-images/${contactId}?v=${hash}`;
}
