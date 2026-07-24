import type { NextRequest } from 'next/server';

type HeaderReader = {
  get(name: string): string | null;
};

export function getClientIpFromHeaders(headers: HeaderReader): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export function getClientIp(request: NextRequest): string {
  return getClientIpFromHeaders(request.headers);
}
