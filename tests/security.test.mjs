import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("security controls are present",async()=>{
  const [security,auth,profile,project,env]=await Promise.all([read("lib/security.ts"),read("app/api/auth/login/route.ts"),read("app/api/profile/route.ts"),read("app/api/projects/[id]/route.ts"),read(".env.example")]);
  assert.match(security,/bcrypt\.hash\(value, 12\)/);
  assert.match(security,/httpOnly:true/);assert.match(security,/sameSite:"strict"/);assert.match(security,/setExpirationTime\("15m"\)/);
  assert.match(security,/refresh_token_hash/);assert.match(security,/UPDATE sessions SET refresh_token_hash/);
  assert.match(auth,/rateLimit/);assert.match(profile,/WHERE u\.id=\?/);assert.match(project,/WHERE id=\? AND owner_id=\?/);
  assert.match(env,/AUTH_SECRET/);assert.doesNotMatch(env,/motisquad_access|actual-password/);
});

test("public counters come from SQL",async()=>{
  const page=await read("app/page.tsx"),route=await read("app/api/public/route.ts");
  assert.doesNotMatch(page,/<strong>128<\/strong>|<strong>406<\/strong>/);
  assert.match(route,/COUNT\(\*\) count FROM projects/);assert.match(route,/COUNT\(\*\) count FROM profiles/);
});
