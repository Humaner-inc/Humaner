export function mailDocumentDownloadPath(id: string): string {
  return `/api/dashboard/inbox/documents/${id}`;
}

export function mailDocumentObjectKey(input: {
  organizationId: string;
  documentId: string;
}): string {
  return `documents/${input.organizationId}/${input.documentId}.html`;
}
