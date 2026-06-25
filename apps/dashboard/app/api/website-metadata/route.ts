import { NextResponse } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { extractWebsiteMetadata } from '@/lib/urls/extract-website-metadata';

export async function GET(request: Request): Promise<NextResponse> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const website = new URL(request.url).searchParams.get('url')?.trim();
  if (!website) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const metadata = await extractWebsiteMetadata(website);
  if (!metadata) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  return NextResponse.json(metadata);
}
