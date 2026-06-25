import { InvitationStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export async function verifyEmail(email: string): Promise<void> {
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { identifier: email },
      data: { expires: new Date(+0) }
    }),
    prisma.changeEmailRequest.deleteMany({
      where: { email }
    }),
    prisma.resetPasswordRequest.deleteMany({
      where: { email }
    }),
    prisma.invitation.updateMany({
      where: { email },
      data: { status: InvitationStatus.ACCEPTED }
    }),
    prisma.user.updateMany({
      where: { email },
      data: { emailVerified: new Date() }
    })
  ]);
}
