import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  createOwnerSessionToken,
  isOwnerAuthenticated,
  isLocalRequest,
  isTrustedMutationOrigin,
  ownerAuthConfigured,
  verifyOwnerAccessKey,
} from './auth.js';

const original = {
  OWNER_ACCESS_KEY_HASH: process.env.OWNER_ACCESS_KEY_HASH,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_ORIGIN: process.env.APP_ORIGIN,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NODE_ENV: process.env.NODE_ENV,
};

beforeEach(() => {
  const accessKey = 'research_test-owner-access-key';
  process.env.OWNER_ACCESS_KEY_HASH = createHash('sha256').update(accessKey).digest('hex');
  process.env.SESSION_SECRET = 'a-test-session-secret-that-is-longer-than-thirty-two-characters';
  process.env.APP_ORIGIN = 'https://research.example';
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  Object.entries(original).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
});

describe('owner authentication', () => {
  it('verifies the configured digest without storing the raw access key', () => {
    expect(ownerAuthConfigured()).toBe(true);
    expect(verifyOwnerAccessKey('research_test-owner-access-key')).toBe(true);
    expect(verifyOwnerAccessKey('research_wrong-access-key')).toBe(false);
  });

  it('accepts a signed unexpired HttpOnly session token and rejects tampering', () => {
    const token = createOwnerSessionToken(1_900_000_000_000);
    const request = { headers: { cookie: `research_owner=${token}` } };
    expect(isOwnerAuthenticated(request, 1_900_000_000_000)).toBe(true);
    expect(isOwnerAuthenticated({ headers: { cookie: `research_owner=${token}x` } }, 1_900_000_000_000)).toBe(false);
    expect(isOwnerAuthenticated(request, 1_900_100_000_000)).toBe(false);
  });

  it('rejects cross-origin mutations', () => {
    expect(isTrustedMutationOrigin({ headers: { origin: 'https://research.example', host: 'research.example' } })).toBe(true);
    expect(isTrustedMutationOrigin({ headers: { origin: 'https://attacker.example', host: 'research.example' } })).toBe(false);
  });

  it('requires a direct loopback peer and loopback host for local privileges', () => {
    expect(isLocalRequest({ headers: { host: 'localhost:3001' }, socket: { remoteAddress: '203.0.113.9' } })).toBe(false);
    expect(isLocalRequest({ headers: { host: 'research.example' }, socket: { remoteAddress: '127.0.0.1' } })).toBe(false);
    expect(isLocalRequest({ headers: { host: 'localhost:3001' } })).toBe(false);
    expect(isLocalRequest({ headers: { host: 'localhost:3001' }, socket: { remoteAddress: '127.0.0.1' } })).toBe(true);
    expect(isLocalRequest({ headers: { host: '[::1]:3001' }, socket: { remoteAddress: '::1' } })).toBe(true);
  });

  it('does not grant local privileges to forwarded or production requests', () => {
    const request = { headers: { host: 'localhost:3001' }, socket: { remoteAddress: '127.0.0.1' } };
    for (const name of ['forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-real-ip']) {
      expect(isLocalRequest({ ...request, headers: { ...request.headers, [name]: '127.0.0.1' } })).toBe(false);
    }
    process.env.NODE_ENV = 'production';
    expect(isLocalRequest(request)).toBe(false);
    process.env.NODE_ENV = 'test';
    process.env.VERCEL = '1';
    expect(isLocalRequest(request)).toBe(false);
  });
});
