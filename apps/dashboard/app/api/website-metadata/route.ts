import { NextResponse } from 'next/server';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { businessNameFromWebsite } from '@/lib/logo';
import { resolveBrandAssets } from '@/lib/urls/resolve-brand-assets';

export async function GET(request: Request): Promise<NextResponse> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const website = new URL(request.url).searchParams.get('url')?.trim();
  if (!website) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const assets = await resolveBrandAssets(website);
    if (!assets) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    return NextResponse.json(assets);
  } catch (error) {
    console.error('[website-metadata] extract failed', error);
    return NextResponse.json({
      businessName: businessNameFromWebsite(website),
      logoUrl: null,
      logoSource: 'none',
      faviconUrl: null,
      accentColor: null,
      brandColors: [],
      canonicalUrl: null,
      description: null
    });
  }
}
