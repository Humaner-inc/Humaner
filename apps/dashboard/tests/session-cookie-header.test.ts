import { describe, expect, it } from 'vitest';

import {
  expireParentDomainSessionSetCookie,
  expireParentDomainSessionSetCookies,
  expireSessionChunkSetCookies,
  isOpaqueSessionToken,
  isSessionCookieChunkName,
  sanitizeSessionCookieHeader,
  SESSION_COOKIE_BASE_NAMES
} from '@/lib/auth/session-cookie-header';

const SESSION = '__Secure-authjs.session-token';
const UUID = '11111111-1111-4111-8111-111111111111';
const FRESH_UUID = '22222222-2222-4222-8222-222222222222';
const JWT_CHUNK = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIn0..chunk';

describe('sanitizeSessionCookieHeader', () => {
  it('keeps a UUID session token', () => {
    const result = sanitizeSessionCookieHeader(
      `${SESSION}=${UUID}; other=1`,
      SESSION
    );
    expect(result.sessionToken).toBe(UUID);
    expect(result.cookieHeader).toContain(`${SESSION}=${UUID}`);
    expect(result.droppedChunkNames).toEqual([]);
  });

  it('drops leftover JWT chunks that Auth.js would concatenate onto the UUID', () => {
    const result = sanitizeSessionCookieHeader(
      `${SESSION}=${UUID}; ${SESSION}.0=${JWT_CHUNK}; ${SESSION}.1=more`,
      SESSION
    );
    expect(result.sessionToken).toBe(UUID);
    expect(result.cookieHeader).toBe(`${SESSION}=${UUID}`);
    expect(result.droppedChunkNames).toEqual([`${SESSION}.0`, `${SESSION}.1`]);
  });

  it('prefers the UUID when host-only JWT and parent-domain UUID share a name', () => {
    const result = sanitizeSessionCookieHeader(
      `${SESSION}=${JWT_CHUNK}; ${SESSION}=${UUID}`,
      SESSION
    );
    expect(result.sessionToken).toBe(UUID);
    expect(result.cookieHeader).toBe(`${SESSION}=${UUID}`);
  });

  it('does not treat a JWT leftover as a signed-in session', () => {
    const result = sanitizeSessionCookieHeader(
      `${SESSION}=${JWT_CHUNK}; ${SESSION}.0=${JWT_CHUNK}`,
      SESSION
    );
    expect(result.sessionToken).toBeNull();
    expect(isOpaqueSessionToken(result.sessionToken ?? '')).toBe(false);
    expect(result.droppedChunkNames).toEqual([`${SESSION}.0`]);
  });

  it('finds a secure UUID even when asked to scan both cookie names', () => {
    const result = sanitizeSessionCookieHeader(
      `authjs.session-token=${JWT_CHUNK}; ${SESSION}=${UUID}`,
      SESSION_COOKIE_BASE_NAMES
    );
    expect(result.sessionToken).toBe(UUID);
    expect(result.cookieHeader).toContain(`${SESSION}=${UUID}`);
    expect(result.cookieHeader).not.toContain(
      `authjs.session-token=${JWT_CHUNK}`
    );
  });

  it('returns no token when the header is missing', () => {
    const result = sanitizeSessionCookieHeader(null, SESSION_COOKIE_BASE_NAMES);
    expect(result.sessionToken).toBeNull();
    expect(result.cookieHeader).toBeNull();
    expect(result.hadDuplicateSessionValues).toBe(false);
  });

  it('flags duplicate session values and keeps the freshest (last) UUID', () => {
    // Stale parent-domain UUID sent first, fresh host-only UUID sent last.
    const result = sanitizeSessionCookieHeader(
      `${SESSION}=${UUID}; ${SESSION}=${FRESH_UUID}`,
      SESSION
    );
    expect(result.sessionToken).toBe(FRESH_UUID);
    expect(result.hadDuplicateSessionValues).toBe(true);
  });

  it('does not flag a single session value as duplicate', () => {
    const result = sanitizeSessionCookieHeader(`${SESSION}=${UUID}`, SESSION);
    expect(result.hadDuplicateSessionValues).toBe(false);
  });
});

describe('session cookie helpers', () => {
  it('identifies chunk cookie names', () => {
    expect(isSessionCookieChunkName(`${SESSION}.0`, SESSION)).toBe(true);
    expect(isSessionCookieChunkName(SESSION, SESSION)).toBe(false);
    expect(isSessionCookieChunkName(`${SESSION}foo`, SESSION)).toBe(false);
  });

  it('emits host-only and Domain expires for leftover chunks', () => {
    const headers = expireSessionChunkSetCookies(SESSION, {
      secure: true,
      domain: '.humaner.io'
    });
    expect(
      headers.some(
        (h) => h.startsWith(`${SESSION}.0=`) && !h.includes('Domain=')
      )
    ).toBe(true);
    expect(
      headers.some(
        (h) => h.startsWith(`${SESSION}.0=`) && h.includes('Domain=.humaner.io')
      )
    ).toBe(true);
  });

  it('expires the parent-domain base session cookie', () => {
    const header = expireParentDomainSessionSetCookie(SESSION, {
      secure: true,
      domain: '.humaner.io'
    });
    expect(header.startsWith(`${SESSION}=`)).toBe(true);
    expect(header).toContain('Domain=.humaner.io');
    expect(header).toContain('Max-Age=0');
  });

  it('expires leftover parent-domain cookies for every known session name', () => {
    const headers = expireParentDomainSessionSetCookies({
      secure: true,
      domain: '.humaner.io'
    });
    expect(headers).toHaveLength(SESSION_COOKIE_BASE_NAMES.length);
    expect(
      headers.every(
        (header) =>
          header.includes('Domain=.humaner.io') && header.includes('Max-Age=0')
      )
    ).toBe(true);
  });
});
