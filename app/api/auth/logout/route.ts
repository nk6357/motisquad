import { assertSameOrigin, revokeCurrentSession } from "@/lib/security";
import { apiError, noStore } from "@/lib/http";
export async function POST(request:Request){try{await assertSameOrigin(request);await revokeCurrentSession();return noStore({ok:true});}catch(error){return apiError(error)}}
