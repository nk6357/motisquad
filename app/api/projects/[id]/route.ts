import { assertSameOrigin, requireUser } from "@/lib/security";
import { getDb } from "@/lib/db";
import { projectSchema } from "@/lib/validation";
import { apiError, noStore } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
  try{await assertSameOrigin(request);const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});await rateLimit(`projects:${auth.userId}`,20,60);const {id}=await params,input=projectSchema.parse(await request.json());
    const [result]=await getDb().execute<import("mysql2").ResultSetHeader>("UPDATE projects SET name=?,category=?,title=?,description=?,specialization=?,level=?,format=?,team_size=?,published=? WHERE id=? AND owner_id=?",[input.name,input.category,input.title,input.description,input.specialization,input.level,input.format,input.teamSize,input.published,id,auth.userId]);
    if(result.affectedRows===0)return noStore({error:"Проект не найден или недоступен"},{status:404});return noStore({ok:true});
  }catch(error){return apiError(error)}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  try{await assertSameOrigin(request);const auth=await requireUser();if(!auth)return noStore({error:"Требуется вход"},{status:401});await rateLimit(`projects:${auth.userId}`,20,60);const {id}=await params;
    const [result]=await getDb().execute<import("mysql2").ResultSetHeader>("UPDATE projects SET active=0,published=0 WHERE id=? AND owner_id=?",[id,auth.userId]);
    if(result.affectedRows===0)return noStore({error:"Проект не найден или недоступен"},{status:404});return noStore({ok:true});
  }catch(error){return apiError(error)}
}
