import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return new NextResponse(undefined, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const { userId } = await props.params;
  if (!userId || !uuidValidate(userId)) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const organizationId = session.user.organizationId;
  const isSelf = userId === session.user.id;

  if (!isSelf) {
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId
      },
      select: { id: true }
    });

    if (!membership) {
      return new NextResponse(undefined, {
        status: 404,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
  }

  const [userImage] = await prisma.$transaction(
    [
      prisma.userImage.findFirst({
        where: { userId },
        select: {
          data: true,
          contentType: true,
          hash: true
        }
      })
    ],
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
    }
  );

  if (!userImage?.data || userImage.data.length === 0) {
    return new NextResponse(undefined, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const version = req.nextUrl.searchParams.get('v');
  if (version && version !== userImage.hash) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const body = Buffer.from(userImage.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=86400, immutable',
      'Content-Type': userImage.contentType ?? 'image/png',
      'Content-Length': body.byteLength.toString()
    }
  });
}
