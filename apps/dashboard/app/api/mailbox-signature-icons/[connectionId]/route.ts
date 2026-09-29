import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ connectionId: string }> }
): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return new NextResponse(undefined, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const { connectionId } = await props.params;
  if (!connectionId || !uuidValidate(connectionId)) {
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

  const organizationId = session.user.organizationId;

  const [connection] = await prisma.$transaction(
    [
      prisma.mailboxConnection.findFirst({
        where: {
          id: connectionId,
          organizationId,
          signatureIconHash: version
        },
        select: {
          signatureIconData: true,
          signatureIconContentType: true,
          signatureIconHash: true
        }
      })
    ],
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
    }
  );

  if (
    !connection?.signatureIconData ||
    connection.signatureIconData.length === 0
  ) {
    return new NextResponse(undefined, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const body = Buffer.from(connection.signatureIconData);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=86400, immutable',
      'Content-Type': connection.signatureIconContentType ?? 'image/png',
      'Content-Length': body.byteLength.toString()
    }
  });
}
