import { assertSameOrigin, rotateSession } from "@/lib/security";
import { apiError, noStore } from "@/lib/http";
export async function POST(request:Request){try{await assertSameOrigin(request);const session=await rotateSession();return session?noStore({ok:true}):noStore({error:"Сессия истекла"},{status:401});}catch(error){return apiError(error)}}
