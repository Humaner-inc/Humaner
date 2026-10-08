import type { NextRequest } from 'next/server';

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  const trimmed = header.trim();
  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1].trim();
  }
  // Humaner org REST keys (load tests, curl) sometimes omit the Bearer prefix.
  if (/^(?:hu_|api_|mcp_at_)[0-9a-f]+$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}
