import type { NextAuthConfig, User } from 'next-auth';

import { createOrganizationAndConnectUser } from '@/lib/auth/organization';
import { verifyEmail } from '@/lib/auth/verification';
import { prisma } from '@/lib/db/prisma';
import { fetchAndResizeRemoteImage } from '@/lib/imaging/fetch-and-resize-remote-image';
import { sendConnectedAccountSecurityAlertEmail } from '@/lib/smtp/send-connected-account-security-alert-email';
import { sendWelcomeEmail } from '@/lib/smtp/send-welcome-email';
import { getUserImageUrl } from '@/lib/urls/get-user-image-url';
import { OAuthIdentityProvider } from '@/types/identity-provider';

function getOAuthProfileImageUrl(
  provider: string,
  profile: Record<string, unknown> | undefined,
  user: User
): string | null | undefined {
  if (provider === OAuthIdentityProvider.Google) {
    const picture =
      (profile?.picture as string | undefined) ??
      (profile?.image as string | undefined) ??
      user.image;

    if (
      typeof picture === 'string' &&
      picture.includes('googleusercontent.com')
    ) {
      return picture.replace(/=s\d+-c$/, '=s256-c');
    }

    return picture;
  }

  if (provider === OAuthIdentityProvider.GitHub) {
    const avatar =
      (profile?.avatar_url as string | undefined) ??
      (profile?.image as string | undefined) ??
      user.image;

    if (
      typeof avatar === 'string' &&
      avatar.includes('avatars.githubusercontent.com')
    ) {
      const url = new URL(avatar);
      url.searchParams.set('s', '256');
      return url.toString();
    }

    return avatar;
  }

  return user.image;
}

export const events = {
  async signIn({ user, account, profile, isNewUser }) {
    if (user && user.id) {
      await prisma.user.updateMany({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      const orgUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true, email: true }
      });
      if (orgUser?.organizationId) {
        const { recordAuditEvent } = await import(
          '@/lib/audit/record-audit-event'
        );
        await recordAuditEvent({
          organizationId: orgUser.organizationId,
          eventType: 'user.login',
          actorId: user.id,
          actorEmail: orgUser.email ?? user.email,
          resourceType: 'user',
          resourceId: user.id,
          metadata: {
            provider: account?.provider ?? 'credentials',
            isNewUser: Boolean(isNewUser)
          },
          captureIp: true
        });
      }

      if (
        account?.provider === OAuthIdentityProvider.Google ||
        account?.provider === OAuthIdentityProvider.GitHub
      ) {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { image: true }
        });

        if (!existingUser?.image) {
          await tryCopyProfileImage(
            user,
            getOAuthProfileImageUrl(
              account.provider,
              profile as unknown as Record<string, unknown> | undefined,
              user
            )
          );
        }
      }

      if (isNewUser && user.email) {
        if (!user.organizationId) {
          await createOrganizationAndConnectUser({
            userId: user.id,
            normalizedEmail: user.email.toLowerCase()
          });
        }
        if (account?.provider === OAuthIdentityProvider.Google) {
          await verifyEmail(user.email);
          if (user.name) {
            await sendWelcomeEmail({
              name: user.name,
              recipient: user.email!
            });
          }
        }
        if (account?.provider === OAuthIdentityProvider.GitHub) {
          await verifyEmail(user.email);
          if (user.name) {
            await sendWelcomeEmail({
              name: user.name,
              recipient: user.email!
            });
          }
        }
      }
    }
  },
  async signOut(message) {
    if ('session' in message && message.session?.sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken: message.session.sessionToken }
      });
    }
  },
  async linkAccount({ user, account, profile }) {
    if (
      user?.id &&
      account?.provider &&
      (account.provider === OAuthIdentityProvider.Google ||
        account.provider === OAuthIdentityProvider.GitHub)
    ) {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { image: true }
      });

      if (!existingUser?.image) {
        await tryCopyProfileImage(
          user,
          getOAuthProfileImageUrl(
            account.provider,
            profile as unknown as Record<string, unknown> | undefined,
            user
          )
        );
      }
    }

    if (user && user.name && user.email && account && account.provider) {
      // Here we check if the user just has been created using an OAuth provider
      // - If yes -> No need to send out security alert
      // - If no (which means linked using an existing account) -> Send out security alert
      const newUser = await prisma.user.findFirst({
        where: {
          email: user.email,
          lastLogin: null
        },
        select: {
          _count: {
            select: { accounts: true }
          }
        }
      });
      const isNewUser = newUser && newUser._count.accounts < 2;

      if (!isNewUser) {
        try {
          await sendConnectedAccountSecurityAlertEmail({
            recipient: user.email,
            name: user.name,
            action: 'connected',
            provider: account.provider
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
} satisfies NextAuthConfig['events'];

async function tryCopyProfileImage(
  user: User,
  imageUrl?: string | null
): Promise<void> {
  try {
    if (imageUrl) {
      const image = await fetchAndResizeRemoteImage(imageUrl);
      if (image.bytes && image.contentType && image.hash) {
        const imageUrl = getUserImageUrl(user.id!, image.hash);
        await prisma.$transaction([
          prisma.userImage.create({
            data: {
              userId: user.id!,
              data: image.bytes,
              contentType: image.contentType,
              hash: image.hash
            },
            select: {
              id: true // SELECT NONE
            }
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { image: imageUrl },
            select: {
              id: true // SELECT NONE
            }
          })
        ]);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
