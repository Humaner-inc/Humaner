import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/humaner.svg', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/favicon.ico'
};
