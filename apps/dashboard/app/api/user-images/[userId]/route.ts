import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { validate as uuidValidate } from 'uuid';

import { prisma } from '@/lib/db/prisma';
import type { Params } from '@/types/request-params';

const paramsCache = createSearchParamsCache({
  userId: parseAsString.withDefault('')
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<Params> }
): Promise<Response> {
  const { userId } = await paramsCache.parse(props.params);
  if (!userId || !uuidValidate(userId)) {
    return new NextResponse(undefined, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
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

  if (!userImage || !userImage.data) {
    return new NextResponse(undefined, {
      status: 404,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const { searchParams } = new URL(req.url);
  const version = searchParams.get('v');
  if (version && version !== userImage.hash) {
    return new NextResponse(undefined, {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  return new NextResponse(userImage.data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': userImage.contentType ?? 'image/png',
      'Content-Length': userImage.data.length.toString()
    }
  });
}
