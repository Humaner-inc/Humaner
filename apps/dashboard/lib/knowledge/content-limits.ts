/** Max characters for pasted plain-text sources in the UI. */
export const KNOWLEDGE_PASTED_TEXT_MAX_LENGTH = 20_000;

/** Max characters per uploaded markdown file (~500 KB). */
export const KNOWLEDGE_FILE_CONTENT_MAX_LENGTH = 512_000;

export function formatKnowledgeFileSizeLimit(): string {
  return `${Math.round(KNOWLEDGE_FILE_CONTENT_MAX_LENGTH / 1024)} KB`;
}
