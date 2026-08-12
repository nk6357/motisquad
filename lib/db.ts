import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { getEnv } from "./env";

let pool: Pool | undefined;

export function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      uri: getEnv().DATABASE_URL,
      connectionLimit: 8,
      enableKeepAlive: true,
      charset: "utf8mb4",
      timezone: "Z",
      decimalNumbers: true,
    });
  }
  return pool;
}

export async function rows<T extends RowDataPacket>(sql: string, values: unknown[] = []) {
  const [result] = await getDb().execute<T[]>(sql, values);
  return result;
}
