import type { RowDataPacket } from "mysql2";
import { requireUser } from "@/lib/security";
import { rows } from "@/lib/db";
import { noStore } from "@/lib/http";

interface User extends RowDataPacket { id:string;name:string;email:string;role:string; }
export async function GET(){
  const auth=await requireUser(); if(!auth) return noStore({ user:null },{status:401});
  const user=(await rows<User>("SELECT id,name,email,role FROM users WHERE id=? AND status='active' LIMIT 1",[auth.userId]))[0];
  return noStore({user:user||null});
}
