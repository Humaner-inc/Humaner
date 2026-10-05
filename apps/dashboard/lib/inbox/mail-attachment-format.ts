export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mailAttachmentDownloadPath(id: string): string {
  return `/api/dashboard/inbox/attachments/${id}`;
}

export function contentDispositionAttachment(filename: string): string {
  const fallback = filename
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/"/g, "'")
    .slice(0, 180);
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback || 'download'}"; filename*=UTF-8''${encoded}`;
}
