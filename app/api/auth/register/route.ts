import { randomUUID } from "node:crypto";
import { registerSchema } from "@/lib/validation";
import { assertSameOrigin, hashPassword, hashSensitive, makeCode, requestFingerprint } from "@/lib/security";
import { getDb, rows } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { sendCode } from "@/lib/email";
import { apiError, noStore } from "@/lib/http";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request); const { ipHash } = await requestFingerprint(); await rateLimit(`register:${ipHash}`,5,3600);
    const input = registerSchema.parse(await request.json()); await rateLimit(`register-email:${input.email}`,3,3600);
    const existing = await rows<RowDataPacket & { id:string }>("SELECT id FROM users WHERE email=? LIMIT 1",[input.email]);
    if (existing[0]) return noStore({ error:"Аккаунт с этой почтой уже существует" },{ status:409 });
    const userId=randomUUID(), challengeId=randomUUID(), code=makeCode();
    const connection=await getDb().getConnection();
    try { await connection.beginTransaction();
      await connection.execute("INSERT INTO users (id,email,password_hash,name,role) VALUES (?,?,?,?,?)",[userId,input.email,await hashPassword(input.password),input.name,input.role]);
      await connection.execute("INSERT INTO auth_challenges (id,user_id,purpose,code_hash,expires_at) VALUES (?,?,'verify',?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE))",[challengeId,userId,hashSensitive(code,getEnv().EMAIL_CODE_PEPPER)]);
      await sendCode(input.email,code,"verify");
      await connection.commit();
    } catch(error){ await connection.rollback(); throw error; } finally { connection.release(); }
    return noStore({ challengeId, email:input.email, next:"verify" },{ status:201 });
  } catch(error){ return apiError(error); }
}
