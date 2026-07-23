import { type Prisma as PrismaNamespace } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export function updateFavoritesOrder(
  userId?: string
): PrismaNamespace.PrismaPromise<number> {
  if (userId) {
    return prisma.$executeRaw`
      UPDATE "public"."Favorite"
      SET "order" = numbered_table.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "order" ASC) AS new_order
        FROM "public"."Favorite"
        WHERE "public"."Favorite"."userId" = ${userId}::uuid
      ) numbered_table
      WHERE "public"."Favorite".id = numbered_table.id
      AND "public"."Favorite"."userId" = ${userId}::uuid;
    `;
  }

  return prisma.$executeRaw`
    UPDATE "public"."Favorite"
    SET "order" = numbered_table.new_order
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "order" ASC) AS new_order
      FROM "public"."Favorite"
    ) numbered_table
    WHERE "public"."Favorite".id = numbered_table.id;
  `;
}
