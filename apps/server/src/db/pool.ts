import pg from "pg";
import { SCHEMA_SQL } from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let ready = false;
let dbAvailable = false;

export function isDbEnabled(): boolean {
  return dbAvailable;
}

export function getPool(): pg.Pool | null {
  if (!dbAvailable) return null;
  return pool;
}

export async function initDb(): Promise<boolean> {
  if (ready) return dbAvailable;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("Postgres disabled (no DATABASE_URL) — using in-memory storage");
    ready = true;
    return false;
  }

  const candidate = new Pool({ connectionString: url });
  try {
    await candidate.query(SCHEMA_SQL);
    pool = candidate;
    dbAvailable = true;
    ready = true;
    console.log("Postgres schema ready");
    return true;
  } catch (err) {
    await candidate.end().catch(() => {});
    pool = null;
    dbAvailable = false;
    ready = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `Postgres unavailable (${msg}) — using in-memory storage. ` +
        "Install Docker and run npm run db:up, or remove DATABASE_URL from apps/server/.env"
    );
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  dbAvailable = false;
  ready = false;
}
