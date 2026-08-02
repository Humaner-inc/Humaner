import { getBaseUrl } from '@/lib/urls/get-base-url';

const secure = new URL(getBaseUrl()).protocol === 'https:';

/**
 * Parent-domain cookie so marketing (humaner.io) can recognize app sessions
 * (app.humaner.io). Host-only in local/dev and non-humaner hosts.
 */
function resolveSharedCookieDomain(): string | undefined {
  try {
    const host = new URL(getBaseUrl()).hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost')) {
      return undefined;
    }
    if (host === 'humaner.io' || host.endsWith('.humaner.io')) {
      return '.humaner.io';
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export class AuthCookies {
  public static isSecure = secure;

  /** `.humaner.io` in production; undefined for host-only cookies. */
  public static domain = resolveSharedCookieDomain();

  public static CallbackUrl = secure
    ? '__Secure-authjs.callback-url'
    : 'authjs.callback-url';
  public static CsrfToken = secure
    ? '__Host-authjs.csrf-token'
    : 'authjs.csrf-token';
  public static SessionToken = secure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  public static sessionCookieOptions(expires?: Date): {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax';
    path: '/';
    domain?: string;
    expires?: Date;
  } {
    return {
      httpOnly: true,
      secure: AuthCookies.isSecure,
      sameSite: 'lax',
      path: '/',
      ...(AuthCookies.domain ? { domain: AuthCookies.domain } : {}),
      ...(expires ? { expires } : {})
    };
  }
}
