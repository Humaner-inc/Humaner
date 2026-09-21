import 'server-only';

import { prisma } from '@/lib/db/prisma';
import type { WeeklyHoursJson } from '@/types/dtos/weekly-hours-dto';

export async function writeUserWorkingHours(
  userId: string,
  workingHours: WeeklyHoursJson
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "workingHours" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2::uuid`,
    JSON.stringify(workingHours),
    userId
  );
}

export async function readWorkingHoursByOrganization(
  organizationId: string
): Promise<Map<string, unknown>> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; workingHours: unknown }>
    >`
      SELECT id, "workingHours"
      FROM "User"
      WHERE "organizationId" = ${organizationId}::uuid
    `;
    return new Map(rows.map((row) => [row.id, row.workingHours]));
  } catch {
    return new Map();
  }
}
