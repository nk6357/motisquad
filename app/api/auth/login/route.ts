import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { loginSchema } from "@/lib/validation";
import { assertSameOrigin, hashSensitive, makeCode, requestFingerprint, verifyPassword } from "@/lib/security";
import { getDb, rows } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { sendCode } from "@/lib/email";
import { apiError, noStore } from "@/lib/http";

interface UserRow extends RowDataPacket { id:string;email:string;password_hash:string;email_verified_at:Date|null;status:string; }
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request); const { ipHash }=await requestFingerprint(); await rateLimit(`login:${ipHash}`,10,900);
    const input=loginSchema.parse(await request.json()); await rateLimit(`login-email:${input.email}`,6,900);
    const user=(await rows<UserRow>("SELECT id,email,password_hash,email_verified_at,status FROM users WHERE email=? LIMIT 1",[input.email]))[0];
    const valid=user ? await verifyPassword(input.password,user.password_hash) : await verifyPassword(input.password,"$2b$12$KIXQ4flF0KfMEcAVPcMJLuC5vF2y9HRoh52lP5yV2Yb2e4uTZ8W6q");
    if (!user || !valid || user.status!=="active") return noStore({ error:"Неверная почта или пароль" },{ status:401 });
    const challengeId=randomUUID(), code=makeCode(), purpose=user.email_verified_at?"login":"verify";
    await getDb().execute("UPDATE auth_challenges SET consumed_at=UTC_TIMESTAMP() WHERE user_id=? AND consumed_at IS NULL",[user.id]);
    await getDb().execute("INSERT INTO auth_challenges (id,user_id,purpose,code_hash,expires_at) VALUES (?,?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE))",[challengeId,user.id,purpose,hashSensitive(code,getEnv().EMAIL_CODE_PEPPER)]);
    await sendCode(user.email,code,purpose);
    return noStore({ challengeId,email:user.email,next:"verify" });
  } catch(error){ return apiError(error); }
}
