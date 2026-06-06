import pg from "pg";
import { SCHEMA_SQL } from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let ready = false;

export function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): pg.Pool | null {
  if (!isDbEnabled()) return null;
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function initDb(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (ready) return true;
  await p.query(SCHEMA_SQL);
  ready = true;
  console.log("Postgres schema ready");
  return true;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    ready = false;
  }
}
