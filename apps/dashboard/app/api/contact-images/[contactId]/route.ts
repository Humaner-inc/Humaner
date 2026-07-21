import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { validate as uuidValidate } from 'uuid';

import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ contactId: string }> }
): Promise<Response> {
  const { contactId } = await props.params;
  if (!contactId || !uuidValidate(contactId)) {
    return new NextResponse(undefined, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const [contactImage] = await prisma.$transaction(
    [
      prisma.contactImage.findFirst({
        where: { contactId },
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

  if (!contactImage?.data || contactImage.data.length === 0) {
    return new NextResponse(undefined, {
      status: 404,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const version = req.nextUrl.searchParams.get('v');
  if (version && version !== contactImage.hash) {
    return new NextResponse(undefined, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const body = Buffer.from(contactImage.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': contactImage.contentType ?? 'image/png',
      'Content-Length': body.byteLength.toString()
    }
  });
}
