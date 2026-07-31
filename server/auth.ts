import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type HttpRequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  socket?: { remoteAddress?: string | null };
};

const COOKIE_NAME = "research_owner";
const SESSION_SECONDS = 12 * 60 * 60;

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function requestHeader(req: HttpRequestLike, name: string): string {
  const headers = req.headers || {};
  return firstHeader(headers[name.toLowerCase()] ?? headers[name]);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function expectedAccessKeyDigest(): Buffer | null {
  const configuredHash = process.env.OWNER_ACCESS_KEY_HASH?.trim();
  if (configuredHash && /^[a-f\d]{64}$/i.test(configuredHash)) return Buffer.from(configuredHash, "hex");
  const legacySecret = process.env.OWNER_ACCESS_KEY?.trim();
  return legacySecret ? sha256(legacySecret) : null;
}

function sessionSecret(): string | null {
  const value = process.env.SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function ownerAuthConfigured(): boolean {
  return Boolean(expectedAccessKeyDigest() && sessionSecret());
}

export function verifyOwnerAccessKey(candidate: string): boolean {
  const expected = expectedAccessKeyDigest();
  if (!expected || candidate.length < 12 || candidate.length > 256) return false;
  return timingSafeEqual(expected, sha256(candidate));
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createOwnerSessionToken(now = Date.now()): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("Owner sessions are not configured.");
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    role: "owner",
    exp: Math.floor(now / 1000) + SESSION_SECONDS,
    nonce: randomBytes(12).toString("base64url"),
  })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function parseCookies(req: HttpRequestLike): Record<string, string> {
  return requestHeader(req, "cookie").split(";").reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = value;
    return cookies;
  }, {});
}

export function isOwnerAuthenticated(req: HttpRequestLike, now = Date.now()): boolean {
  const secret = sessionSecret();
  const token = parseCookies(req)[COOKIE_NAME];
  if (!secret || !token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload, secret);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { v?: number; role?: string; exp?: number };
    return parsed.v === 1 && parsed.role === "owner" && typeof parsed.exp === "number" && parsed.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

function secureCookie(): boolean {
  return process.env.VERCEL === "1" || ["production", "preview"].includes(process.env.VERCEL_ENV || "");
}

export function ownerSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secureCookie() ? "; Secure" : ""}`;
}

export function clearedOwnerSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie() ? "; Secure" : ""}`;
}

export function requestFingerprint(req: HttpRequestLike): string {
  const forwarded = requestHeader(req, "x-forwarded-for").split(",")[0]?.trim();
  const ip = forwarded || requestHeader(req, "x-real-ip") || req.socket?.remoteAddress || "unknown";
  const userAgent = requestHeader(req, "user-agent").slice(0, 180);
  const pepper = sessionSecret() || process.env.AI_GATEWAY_API_KEY || "research-public-v1";
  return createHmac("sha256", pepper).update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

export function isTrustedMutationOrigin(req: HttpRequestLike): boolean {
  const originValue = requestHeader(req, "origin");
  if (!originValue) return true;
  let origin: URL;
  try {
    origin = new URL(originValue);
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (configuredOrigin) {
    try { allowed.add(new URL(configuredOrigin).host); } catch { /* configuration is validated by deployment checks */ }
  }
  for (const host of [requestHeader(req, "x-forwarded-host"), requestHeader(req, "host"), process.env.VERCEL_URL]) {
    if (host) allowed.add(host.replace(/^https?:\/\//, ""));
  }
  if (!secureCookie() && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) return true;
  return allowed.has(origin.host);
}

export function isLocalRequest(req: HttpRequestLike): boolean {
  if (secureCookie()) return false;
  const host = requestHeader(req, "host").split(":")[0];
  const remote = req.socket?.remoteAddress || "";
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host)
    || ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote);
}
