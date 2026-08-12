import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
for (const statement of sql.split(/;\s*(?:\n|$)/).map((part) => part.trim()).filter(Boolean)) await connection.query(statement);
await connection.query("DELETE FROM rate_limits WHERE window_start < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)");
await connection.query("DELETE FROM auth_challenges WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)");
await connection.end();
console.log("Database schema is ready.");
