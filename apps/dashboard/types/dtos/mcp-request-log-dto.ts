export type McpRequestLogDto = {
  id: string;
  method: string;
  tool: string;
  status: number;
  durationMs: number;
  apiKeyDescription?: string;
  clientName?: string;
  errorMessage?: string;
  createdAt: Date;
};
