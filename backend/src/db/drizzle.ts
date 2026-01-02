import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please update your .env file.");
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool);
export type DbClient = typeof db;

export async function closeDb() {
  await pool.end();
}
