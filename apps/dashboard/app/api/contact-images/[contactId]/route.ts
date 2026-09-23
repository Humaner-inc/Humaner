import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { dedupedAuth } from '@/lib/auth';
import { checkAuthenticatedSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ contactId: string }> }
): Promise<Response> {
  const session = await dedupedAuth();
  if (!checkAuthenticatedSession(session)) {
    return new NextResponse(undefined, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const { contactId } = await props.params;
  if (!contactId || !uuidValidate(contactId)) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const owned = await prisma.contact.findFirst({
    where: { id: contactId, userId: session.user.id },
    select: { id: true }
  });
  if (!owned) {
    return new NextResponse(undefined, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const [image] = await prisma.$transaction(
    [
      prisma.contactImage.findUnique({
        where: { contactId },
        select: { data: true, contentType: true, hash: true }
      })
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted }
  );

  if (!image || image.data.length === 0) {
    return new NextResponse(undefined, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const version = req.nextUrl.searchParams.get('v');
  if (version && version !== image.hash) {
    return new NextResponse(undefined, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  const body = Buffer.from(image.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=86400, immutable',
      'Content-Type': image.contentType,
      'Content-Length': body.byteLength.toString()
    }
  });
}
