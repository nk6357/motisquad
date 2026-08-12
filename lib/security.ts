import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getEnv } from "./env";
import { getDb, rows } from "./db";
import type { RowDataPacket } from "mysql2";

const ACCESS_COOKIE = "motisquad_access";
const REFRESH_COOKIE = "motisquad_refresh";
const encoder = new TextEncoder();

export function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function hashSensitive(value: string, secret: string) { return sha256(`${secret}:${value}`); }
export function makeCode() { return String(randomInt(0, 1_000_000)).padStart(6, "0"); }
export function makeToken() { return randomBytes(48).toString("base64url"); }
export async function hashPassword(value: string) { return bcrypt.hash(value, 12); }
export async function verifyPassword(value: string, hash: string) { return bcrypt.compare(value, hash); }
export function constantEqual(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function signAccessToken(userId: string, role: string, sessionId: string) {
  return new SignJWT({ role, sid: sessionId }).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setIssuer("motisquad").setAudience("motisquad-web").setIssuedAt().setExpirationTime("15m")
    .sign(encoder.encode(getEnv().AUTH_SECRET));
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, encoder.encode(getEnv().AUTH_SECRET), { issuer: "motisquad", audience: "motisquad-web" });
  return { userId: result.payload.sub!, role: String(result.payload.role), sessionId: String(result.payload.sid) };
}

export async function requestFingerprint() {
  const h = await headers(); const env = getEnv();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = h.get("user-agent") || "unknown";
  return { ipHash: hashSensitive(ip, env.IP_HASH_SECRET), userAgentHash: sha256(ua).slice(0, 64) };
}

export async function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(getEnv().APP_URL).origin;
  if (!origin || origin !== expected) throw new Error("INVALID_ORIGIN");
}

export async function createSession(userId: string, role: string) {
  const sessionId = randomUUID(); const refresh = makeToken(); const { ipHash, userAgentHash } = await requestFingerprint();
  await getDb().execute("INSERT INTO sessions (id,user_id,refresh_token_hash,ip_hash,user_agent_hash,expires_at) VALUES (?,?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 DAY))", [sessionId,userId,sha256(refresh),ipHash,userAgentHash]);
  await setSessionCookies(await signAccessToken(userId, role, sessionId), `${sessionId}.${refresh}`);
}

async function setSessionCookies(access: string, refresh: string) {
  const jar = await cookies(); const secure = getEnv().NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, access, { httpOnly:true, secure, sameSite:"strict", path:"/", maxAge:900 });
  jar.set(REFRESH_COOKIE, refresh, { httpOnly:true, secure, sameSite:"strict", path:"/api/auth", maxAge:60*60*24*30 });
}

export async function clearSessionCookies() {
  const jar = await cookies(); jar.delete(ACCESS_COOKIE); jar.delete(REFRESH_COOKIE);
}

interface SessionRow extends RowDataPacket { user_id:string; role:string; refresh_token_hash:string; revoked_at:Date|null; expires_at:Date; }
export async function rotateSession() {
  const jar = await cookies(); const raw = jar.get(REFRESH_COOKIE)?.value;
  if (!raw) return null;
  const [sessionId, token] = raw.split("."); if (!sessionId || !token) return null;
  const found = await rows<SessionRow>("SELECT s.user_id,s.refresh_token_hash,s.revoked_at,s.expires_at,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? LIMIT 1", [sessionId]);
  const session = found[0];
  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date() || !constantEqual(session.refresh_token_hash, sha256(token))) {
    if (sessionId) await getDb().execute("UPDATE sessions SET revoked_at=UTC_TIMESTAMP() WHERE id=?", [sessionId]);
    await clearSessionCookies(); return null;
  }
  const next = makeToken(); await getDb().execute("UPDATE sessions SET refresh_token_hash=?,last_used_at=UTC_TIMESTAMP() WHERE id=?", [sha256(next),sessionId]);
  await setSessionCookies(await signAccessToken(session.user_id,session.role,sessionId),`${sessionId}.${next}`);
  return { userId:session.user_id, role:session.role, sessionId };
}

export async function requireUser() {
  const jar = await cookies(); const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const auth = await verifyAccessToken(token);
    const found = await rows<RowDataPacket & { id:string }>("SELECT id FROM sessions WHERE id=? AND user_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP() LIMIT 1", [auth.sessionId,auth.userId]);
    return found[0] ? auth : null;
  } catch { return null; }
}

export async function revokeCurrentSession() {
  const jar = await cookies(); const raw = jar.get(REFRESH_COOKIE)?.value; const sessionId = raw?.split(".")[0];
  if (sessionId) await getDb().execute("UPDATE sessions SET revoked_at=UTC_TIMESTAMP() WHERE id=?", [sessionId]);
  await clearSessionCookies();
}
