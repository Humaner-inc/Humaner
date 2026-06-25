import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { validate as uuidValidate } from 'uuid';

import { prisma } from '@/lib/db/prisma';
import type { Params } from '@/types/request-params';

const paramsCache = createSearchParamsCache({
  contactId: parseAsString.withDefault('')
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<Params> }
): Promise<Response> {
  const { contactId } = await paramsCache.parse(props.params);
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

  if (!contactImage || !contactImage.data) {
    return new NextResponse(undefined, {
      status: 404,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const { searchParams } = new URL(req.url);
  const version = searchParams.get('v');
  if (version && version !== contactImage.hash) {
    return new NextResponse(undefined, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  return new NextResponse(contactImage.data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': contactImage.contentType ?? 'image/png',
      'Content-Length': contactImage.data.length.toString()
    }
  });
}
