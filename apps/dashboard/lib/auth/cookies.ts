import { getBaseUrl } from '@/lib/urls/get-base-url';

const secure = new URL(getBaseUrl()).protocol === 'https:';

export class AuthCookies {
  public static CallbackUrl = secure
    ? '__Secure-authjs.callback-url'
    : 'authjs.callback-url';
  public static CsrfToken = secure
    ? '__Host-authjs.csrf-token'
    : 'authjs.csrf-token';
  public static SessionToken = secure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}
