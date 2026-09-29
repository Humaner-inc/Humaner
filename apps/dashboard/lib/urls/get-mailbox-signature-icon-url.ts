export function getMailboxSignatureIconUrl(
  connectionId: string,
  hash: string
): string {
  return `/api/mailbox-signature-icons/${connectionId}?v=${hash}`;
}
