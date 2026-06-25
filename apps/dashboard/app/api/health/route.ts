import { NextResponse } from 'next/server';

import { AppInfo } from '@/constants/app-info';
import { prisma } from '@/lib/db/prisma';

export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ version: AppInfo.VERSION });
  } catch (err) {
    const { statusCode = 503 } = err;
    return new NextResponse(undefined, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
