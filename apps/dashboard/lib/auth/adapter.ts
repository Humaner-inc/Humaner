import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/db/prisma';

// Here we could modify the PrismaAdapter, i.e. overwrite the createUser() method.
// Suggestion is to keep the adapter as it is and try to work around it or else you might need to adjust with each update.

export const adapter = Object.freeze(PrismaAdapter(prisma));
