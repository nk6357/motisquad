import type { RowDataPacket } from "mysql2";
import { assertSameOrigin, requireUser } from "@/lib/security";
import { getDb, rows } from "@/lib/db";
import { profileSchema } from "@/lib/validation";
import { apiError, noStore } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(){
  const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});
  const profile=(await rows<RowDataPacket>("SELECT u.name,u.email,u.role,p.specialization,p.level,p.format,p.bio,p.stack,p.published FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=? LIMIT 1",[auth.userId]))[0];
  return noStore({profile});
}
export async function PUT(request:Request){
  try{await assertSameOrigin(request);const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});
    await rateLimit(`profile:${auth.userId}`,30,60);const input=profileSchema.parse(await request.json());
    if(input.role!==auth.role)return noStore({error:"Роль аккаунта нельзя изменить через профиль"},{status:403});
    const connection=await getDb().getConnection();try{await connection.beginTransaction();
      await connection.execute("UPDATE users SET name=? WHERE id=?",[input.name,auth.userId]);
      await connection.execute(`INSERT INTO profiles (user_id,specialization,level,format,bio,stack,published) VALUES (?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE specialization=VALUES(specialization),level=VALUES(level),format=VALUES(format),bio=VALUES(bio),stack=VALUES(stack),published=VALUES(published)`,[auth.userId,input.specialization,input.level,input.format,input.bio,input.stack,input.published]);
      await connection.commit();}catch(error){await connection.rollback();throw error}finally{connection.release()}
    return noStore({ok:true});
  }catch(error){return apiError(error)}
}
