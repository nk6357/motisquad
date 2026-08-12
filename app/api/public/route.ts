import type { RowDataPacket } from "mysql2";
import { rows } from "@/lib/db";
import { apiError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestFingerprint } from "@/lib/security";

interface CountRow extends RowDataPacket { count:number }
interface ProjectRow extends RowDataPacket { id:string;name:string;category:string;title:string;description:string;specialization:string;level:string;format:string;teamSize:number;createdAt:Date }
interface ProfileRow extends RowDataPacket { id:string;name:string;role:string;specialization:string;level:string;format:string;bio:string;stack:string;updatedAt:Date }

export async function GET(request:Request){
  try{
    const {ipHash}=await requestFingerprint();await rateLimit(`public:${ipHash}`,120,60);
    const url=new URL(request.url), specialization=url.searchParams.get("specialization"), level=url.searchParams.get("level"), format=url.searchParams.get("format");
    const filters:string[]=[], values:unknown[]=[];
    if(specialization&&specialization!=="Любая роль"&&specialization!=="Любая специализация"){filters.push("specialization=?");values.push(specialization)}
    if(level){filters.push("level=?");values.push(level)} if(format){filters.push("format=?");values.push(format)}
    const projectWhere=`published=1 AND active=1${filters.length?` AND ${filters.join(" AND ")}`:""}`;
    const profileWhere=`p.published=1 AND u.status='active'${filters.length?` AND ${filters.map(f=>`p.${f}`).join(" AND ")}`:""}`;
    const [[projectCount],[talentCount],projects,profiles]=await Promise.all([
      rows<CountRow>("SELECT COUNT(*) count FROM projects WHERE published=1 AND active=1"),
      rows<CountRow>("SELECT COUNT(*) count FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.published=1 AND u.status='active' AND u.role='talent'"),
      rows<ProjectRow>(`SELECT id,name,category,title,description,specialization,level,format,team_size teamSize,created_at createdAt FROM projects WHERE ${projectWhere} ORDER BY updated_at DESC LIMIT 30`,values),
      rows<ProfileRow>(`SELECT u.id,u.name,u.role,p.specialization,p.level,p.format,p.bio,p.stack,p.updated_at updatedAt FROM profiles p JOIN users u ON u.id=p.user_id WHERE ${profileWhere} ORDER BY p.updated_at DESC LIMIT 30`,values),
    ]);
    return Response.json({stats:{projects:Number(projectCount.count),talent:Number(talentCount.count)},projects,profiles},{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=60"}});
  }catch(error){return apiError(error)}
}
