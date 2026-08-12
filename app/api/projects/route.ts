import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { assertSameOrigin, requireUser } from "@/lib/security";
import { getDb, rows } from "@/lib/db";
import { projectSchema } from "@/lib/validation";
import { apiError, noStore } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(){const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});const projects=await rows<RowDataPacket>("SELECT id,name,category,title,description,specialization,level,format,team_size teamSize,published,active FROM projects WHERE owner_id=? ORDER BY updated_at DESC",[auth.userId]);return noStore({projects})}
export async function POST(request:Request){
  try{await assertSameOrigin(request);const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});if(auth.role!=="founder")return noStore({error:"Публиковать проекты могут только основатели"},{status:403});
    await rateLimit(`projects:${auth.userId}`,20,60);const input=projectSchema.parse(await request.json()),id=randomUUID();
    await getDb().execute("INSERT INTO projects (id,owner_id,name,category,title,description,specialization,level,format,team_size,published) VALUES (?,?,?,?,?,?,?,?,'Удалённо',?,?)",[id,auth.userId,input.name,input.category,input.title,input.description,input.specialization,input.level,input.teamSize,input.published]);
    return noStore({id},{status:201});
  }catch(error){return apiError(error)}
}
