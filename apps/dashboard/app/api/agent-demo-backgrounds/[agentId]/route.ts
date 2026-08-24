import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ agentId: string }> }
): Promise<Response> {
  const { agentId } = await props.params;
  if (!agentId || !uuidValidate(agentId)) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const version = req.nextUrl.searchParams.get('v')?.trim();
  if (!version) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const [background] = await prisma.$transaction(
    [
      prisma.agentDemoBackground.findFirst({
        where: { agentId, hash: version },
        select: {
          data: true,
          contentType: true
        }
      })
    ],
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
    }
  );

  if (!background?.data || background.data.length === 0) {
    return new NextResponse(undefined, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const body = Buffer.from(background.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': background.contentType ?? 'image/jpeg',
      'Content-Length': body.byteLength.toString()
    }
  });
}
