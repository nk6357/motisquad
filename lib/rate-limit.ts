import { getDb } from "./db";
import { getEnv } from "./env";
import { hashSensitive } from "./security";

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const hashed = hashSensitive(key, getEnv().IP_HASH_SECRET);
  await getDb().execute(`INSERT INTO rate_limits (rate_key,window_start,hits) VALUES (?,UTC_TIMESTAMP(),1)
    ON DUPLICATE KEY UPDATE hits=IF(window_start<TIMESTAMPADD(SECOND,-?,UTC_TIMESTAMP()),1,hits+1),window_start=IF(window_start<TIMESTAMPADD(SECOND,-?,UTC_TIMESTAMP()),UTC_TIMESTAMP(),window_start)`, [hashed,windowSeconds,windowSeconds]);
  const [result] = await getDb().execute<import("mysql2/promise").RowDataPacket[]>("SELECT hits,window_start FROM rate_limits WHERE rate_key=?", [hashed]);
  if (Number(result[0]?.hits || 0) > limit) throw new Error("RATE_LIMITED");
}
