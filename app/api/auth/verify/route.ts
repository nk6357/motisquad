import type { RowDataPacket } from "mysql2";
import { verifySchema } from "@/lib/validation";
import { assertSameOrigin, constantEqual, createSession, hashSensitive, requestFingerprint } from "@/lib/security";
import { getDb, rows } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, noStore } from "@/lib/http";

interface Challenge extends RowDataPacket { user_id:string;code_hash:string;attempts:number;expires_at:Date;consumed_at:Date|null;name:string;role:string; }
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request); const { ipHash }=await requestFingerprint(); await rateLimit(`verify:${ipHash}`,12,900);
    const input=verifySchema.parse(await request.json());
    const challenge=(await rows<Challenge>("SELECT c.user_id,c.code_hash,c.attempts,c.expires_at,c.consumed_at,u.name,u.role FROM auth_challenges c JOIN users u ON u.id=c.user_id WHERE c.id=? LIMIT 1",[input.challengeId]))[0];
    if (!challenge || challenge.consumed_at || new Date(challenge.expires_at)<=new Date() || challenge.attempts>=5) return noStore({ error:"Код истёк. Запросите новый." },{status:400});
    if (!constantEqual(challenge.code_hash,hashSensitive(input.code,getEnv().EMAIL_CODE_PEPPER))) {
      await getDb().execute("UPDATE auth_challenges SET attempts=attempts+1 WHERE id=?",[input.challengeId]);
      return noStore({ error:"Неверный код" },{status:400});
    }
    const connection=await getDb().getConnection();
    try { await connection.beginTransaction();
      await connection.execute("UPDATE auth_challenges SET consumed_at=UTC_TIMESTAMP() WHERE id=? AND consumed_at IS NULL",[input.challengeId]);
      await connection.execute("UPDATE users SET email_verified_at=COALESCE(email_verified_at,UTC_TIMESTAMP()) WHERE id=?",[challenge.user_id]); await connection.commit();
    } catch(error){ await connection.rollback(); throw error; } finally { connection.release(); }
    await createSession(challenge.user_id,challenge.role);
    return noStore({ user:{ id:challenge.user_id,name:challenge.name,role:challenge.role } });
  } catch(error){ return apiError(error); }
}
