import { prisma } from '@/lib/db/prisma';
import {
  deleteChangeEmailRequestsByEmail,
  deleteResetPasswordRequestsByEmail,
  deleteVerificationTokensForEmail
} from '@/lib/db/unique-mutations';

export async function verifyEmail(email: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await deleteVerificationTokensForEmail(tx, email);
    await deleteChangeEmailRequestsByEmail(tx, email);
    await deleteResetPasswordRequestsByEmail(tx, email);
    const user = await tx.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      });
    }
  });
}
