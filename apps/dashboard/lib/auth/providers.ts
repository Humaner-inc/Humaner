import { Authenticator } from '@otplib/core';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';
import { isBefore, isValid } from 'date-fns';
import { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

import { symmetricDecrypt, symmetricEncrypt } from '@/lib/auth/encryption';
import { verifyPassword } from '@/lib/auth/password';
import { isEmailVerified } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import {
  IncorrectEmailOrPasswordError,
  IncorrectRecoveryCodeError,
  IncorrectTotpCodeError,
  InternalServerError,
  MissingRecoveryCodesError,
  RateLimitExceededError,
  RequestExpiredError,
  UnverifiedEmailError
} from '@/lib/validation/exceptions';
import { logInSchema } from '@/schemas/auth/log-in-schema';
import { submitEmailVerificationSchema } from '@/schemas/auth/submit-email-verification-schema';
import { submitRecoveryCodeSchema } from '@/schemas/auth/submit-recovery-code-schema';
import { submitTotpCodeSchema } from '@/schemas/auth/submit-totp-code-schema';
import { IdentityProvider } from '@/types/identity-provider';

// 10 attempts per minute, shared across instances when Redis is configured
async function checkRateLimitAndThrowError(
  uniqueIdentifier: string
): Promise<void> {
  try {
    const count = await incrementRateLimit(`login:${uniqueIdentifier}`, 60);
    if (count >= 10) {
      throw new RateLimitExceededError();
    }
    if (count > 0) {
      return;
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw error;
    }
  }

  const limiter = rateLimit({
    intervalInMs: 60 * 1000
  });
  const result = limiter.check(10, uniqueIdentifier);
  if (result.isRateLimited) {
    throw new RateLimitExceededError();
  }
}

export const providers = [
  CredentialsProvider({
    id: IdentityProvider.Credentials,
    name: IdentityProvider.Credentials,
    credentials: {
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials) {
        console.error(`For some reason credentials are missing`);
        throw new InternalServerError();
      }

      if (!credentials.email || !credentials.password) {
        throw new IncorrectEmailOrPasswordError();
      }

      const result = logInSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectEmailOrPasswordError();
      }
      const parsedCredentials = result.data;

      const normalizedEmail = parsedCredentials.email.toLowerCase();
      await checkRateLimitAndThrowError(normalizedEmail);

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          organizationId: true,
          password: true,
          email: true,
          emailVerified: true,
          name: true
        }
      });

      if (!user || !user.password || !user.email) {
        throw new IncorrectEmailOrPasswordError();
      }

      const isCorrectPassword = await verifyPassword(
        parsedCredentials.password,
        user.password
      );
      if (!isCorrectPassword) {
        throw new IncorrectEmailOrPasswordError();
      }

      if (!isEmailVerified(user.emailVerified)) {
        throw new UnverifiedEmailError();
      }

      return {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name
      };
    }
  }),
  CredentialsProvider({
    id: IdentityProvider.TotpCode,
    name: IdentityProvider.TotpCode,
    credentials: {
      token: { label: 'Token', type: 'text' },
      totpCode: { label: 'TOTP code', type: 'text' }
    },
    async authorize(credentials) {
      if (!process.env.AUTH_SECRET) {
        console.error(
          'Missing encryption key; cannot proceed with TOTP code login.'
        );
        throw new InternalServerError();
      }

      if (!credentials) {
        console.error(`For some reason credentials are missing`);
        throw new InternalServerError();
      }

      if (!credentials.totpCode) {
        throw new IncorrectTotpCodeError();
      }

      const result = submitTotpCodeSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectTotpCodeError();
      }
      const parsedCredentials = result.data;
      const userId = symmetricDecrypt(
        parsedCredentials.token,
        process.env.AUTH_SECRET
      );
      const expiry = new Date(
        symmetricDecrypt(parsedCredentials.expiry, process.env.AUTH_SECRET)
      );
      if (!isValid(expiry) || isBefore(expiry, new Date())) {
        throw new RequestExpiredError();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          organizationId: true,
          password: true,
          email: true,
          emailVerified: true,
          name: true,
          authenticatorApp: {
            select: {
              secret: true,
              recoveryCodes: true
            }
          }
        }
      });
      if (!user || !user.email) {
        throw new InternalServerError();
      }

      await checkRateLimitAndThrowError(user.email);

      if (!user.authenticatorApp) {
        throw new InternalServerError();
      }

      const secret = symmetricDecrypt(
        user.authenticatorApp.secret,
        process.env.AUTH_SECRET
      );
      if (secret.length !== 32) {
        console.error(
          `Authenticator app secret decryption failed. Expected key with length 32 but got ${secret.length}`
        );
        throw new InternalServerError();
      }

      const authenticator = new Authenticator({
        createDigest,
        createRandomBytes,
        keyDecoder,
        keyEncoder,
        window: [1, 0]
      });
      const isValidToken = authenticator.check(
        parsedCredentials.totpCode,
        secret
      );
      if (!isValidToken) {
        throw new IncorrectTotpCodeError();
      }

      return {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name
      };
    }
  }),
  CredentialsProvider({
    id: IdentityProvider.RecoveryCode,
    name: IdentityProvider.RecoveryCode,
    credentials: {
      token: { label: 'Token', type: 'text' },
      recoveryCode: { label: 'Recovery code', type: 'text' }
    },
    async authorize(credentials) {
      if (!process.env.AUTH_SECRET) {
        console.error(
          'Missing encryption key; cannot proceed with TOTP code login.'
        );
        throw new InternalServerError();
      }

      if (!credentials) {
        console.error(`For some reason credentials are missing`);
        throw new InternalServerError();
      }

      if (!credentials.recoveryCode) {
        throw new IncorrectRecoveryCodeError();
      }

      const result = submitRecoveryCodeSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectRecoveryCodeError();
      }
      const parsedCredentials = result.data;
      const userId = symmetricDecrypt(
        parsedCredentials.token,
        process.env.AUTH_SECRET
      );
      const expiry = new Date(
        symmetricDecrypt(parsedCredentials.expiry, process.env.AUTH_SECRET)
      );
      if (!isValid(expiry) || isBefore(expiry, new Date())) {
        throw new RequestExpiredError();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          organizationId: true,
          password: true,
          email: true,
          emailVerified: true,
          name: true,
          authenticatorApp: {
            select: {
              recoveryCodes: true
            }
          }
        }
      });
      if (!user || !user.email) {
        throw new InternalServerError();
      }

      await checkRateLimitAndThrowError(user.email);

      if (!user.authenticatorApp) {
        throw new InternalServerError();
      }

      if (!user.authenticatorApp.recoveryCodes) {
        throw new MissingRecoveryCodesError();
      }

      const recoveryCodes = JSON.parse(
        symmetricDecrypt(
          user.authenticatorApp.recoveryCodes,
          process.env.AUTH_SECRET
        )
      );

      // Check if user-supplied code matches one
      const index = recoveryCodes.indexOf(
        parsedCredentials.recoveryCode.replaceAll('-', '')
      );
      if (index === -1) {
        throw new IncorrectRecoveryCodeError();
      }

      // Delete verified recoery code and re-encrypt remaining
      recoveryCodes[index] = null;
      await prisma.authenticatorApp.update({
        where: { userId: user.id },
        data: {
          recoveryCodes: symmetricEncrypt(
            JSON.stringify(recoveryCodes),
            process.env.AUTH_SECRET
          )
        },
        select: {
          id: true // SELECT NONE
        }
      });

      return {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name
      };
    }
  }),
  CredentialsProvider({
    id: IdentityProvider.EmailVerification,
    name: IdentityProvider.EmailVerification,
    credentials: {
      token: { label: 'Token', type: 'text' },
      expiry: { label: 'Expiry', type: 'text' }
    },
    async authorize(credentials) {
      if (!process.env.AUTH_SECRET) {
        console.error(
          'Missing encryption key; cannot proceed with email verification login.'
        );
        throw new InternalServerError();
      }

      if (!credentials) {
        throw new InternalServerError();
      }

      const result = submitEmailVerificationSchema.safeParse(credentials);
      if (!result.success) {
        throw new InternalServerError();
      }

      const parsedCredentials = result.data;
      let userId: string;
      let expiry: Date;
      try {
        userId = symmetricDecrypt(
          parsedCredentials.token,
          process.env.AUTH_SECRET
        );
        expiry = new Date(
          symmetricDecrypt(parsedCredentials.expiry, process.env.AUTH_SECRET)
        );
      } catch {
        throw new InternalServerError();
      }

      if (!isValid(expiry) || isBefore(expiry, new Date())) {
        throw new RequestExpiredError();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          organizationId: true,
          email: true,
          emailVerified: true,
          name: true
        }
      });

      if (!user?.email || !isEmailVerified(user.emailVerified)) {
        throw new UnverifiedEmailError();
      }

      return {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name
      };
    }
  }),
  GoogleProvider({
    id: IdentityProvider.Google,
    name: IdentityProvider.Google,
    clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
    // existing emails link only after password or totp proof
    allowDangerousEmailAccountLinking: false,
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      }
    }
  }),
  GitHubProvider({
    id: IdentityProvider.GitHub,
    name: IdentityProvider.GitHub,
    clientId: process.env.AUTH_GITHUB_CLIENT_ID as string,
    clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET as string,
    // existing emails link only after password or totp proof
    allowDangerousEmailAccountLinking: false,
    authorization: {
      params: {
        scope: 'read:user user:email'
      }
    },
    userinfo: {
      url: 'https://api.github.com/user',
      async request({
        tokens,
        provider
      }: {
        tokens: { access_token?: string };
        provider: { userinfo?: { url?: string } };
      }) {
        const profile = (await fetch(provider.userinfo!.url as string, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'User-Agent': 'humaner-auth'
          }
        }).then(async (res) => await res.json())) as {
          email?: string | null;
          email_verified?: boolean;
          [key: string]: unknown;
        };

        if (!profile.email) {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'User-Agent': 'humaner-auth',
              Accept: 'application/vnd.github+json'
            }
          });
          if (res.ok) {
            const emails = (await res.json()) as Array<{
              email: string;
              primary: boolean;
              verified: boolean;
            }>;
            const preferred =
              emails.find((e) => e.primary && e.verified) ??
              emails.find((e) => e.verified) ??
              emails.find((e) => e.primary) ??
              emails[0];
            if (preferred) {
              profile.email = preferred.email;
              profile.email_verified = preferred.verified;
            }
          }
        } else {
          profile.email_verified = true;
        }

        return profile;
      }
    }
  })
] satisfies NextAuthConfig['providers'];
