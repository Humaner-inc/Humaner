import { describe, expect, it } from 'vitest';

import {
  expireSessionChunkSetCookies,
  isOpaqueSessionToken,
  isSessionCookieChunkName,
  sanitizeSessionCookieHeader
} from '@/lib/auth/session-cookie-header';

const SESSION = '__Secure-authjs.session-token';
const UUID = '11111111-1111-4111-8111-111111111111';
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
    expect(isOpaqueSessionToken(result.sessionToken ?? '')).toBe(false);
    expect(result.droppedChunkNames).toEqual([`${SESSION}.0`]);
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
});
