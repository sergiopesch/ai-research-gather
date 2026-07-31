import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  createOwnerSessionToken,
  isOwnerAuthenticated,
  isTrustedMutationOrigin,
  ownerAuthConfigured,
  verifyOwnerAccessKey,
} from './auth.js';

const original = {
  OWNER_ACCESS_KEY_HASH: process.env.OWNER_ACCESS_KEY_HASH,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_ORIGIN: process.env.APP_ORIGIN,
  VERCEL: process.env.VERCEL,
};

beforeEach(() => {
  const accessKey = 'research_test-owner-access-key';
  process.env.OWNER_ACCESS_KEY_HASH = createHash('sha256').update(accessKey).digest('hex');
  process.env.SESSION_SECRET = 'a-test-session-secret-that-is-longer-than-thirty-two-characters';
  process.env.APP_ORIGIN = 'https://research.example';
  delete process.env.VERCEL;
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
});
