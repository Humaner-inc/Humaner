import { type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export function updateFavoritesOrder(
  userId?: string
): Prisma.PrismaPromise<number> {
  if (userId) {
    return prisma.$executeRawUnsafe(
      `UPDATE "public"."Favorite"
        SET "order" = numbered_table.new_order
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "order" ASC) AS new_order
          FROM "public"."Favorite"
          WHERE "public"."Favorite"."userId" = $1::uuid
        ) numbered_table
        WHERE "public"."Favorite".id = numbered_table.id
        AND "public"."Favorite"."userId" = $1::uuid;`,
      userId
    );
  }

  return prisma.$executeRawUnsafe(
    `UPDATE "public"."Favorite"
      SET "order" = numbered_table.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "order" ASC) AS new_order
        FROM "public"."Favorite"
      ) numbered_table
      WHERE "public"."Favorite".id = numbered_table.id;`
  );
}
