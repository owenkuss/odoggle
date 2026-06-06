import type { ReportReason } from "@odoggle/shared";
import { v4 as uuidv4 } from "uuid";
import { getPool } from "./pool";

export interface StoredReport {
  id: string;
  reporterId: string;
  matchId?: string;
  reason: ReportReason;
  details?: string;
  createdAt: number;
}

const memoryReports: StoredReport[] = [];

export async function persistReport(input: {
  reporterId: string;
  matchId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<StoredReport> {
  const report: StoredReport = {
    id: uuidv4(),
    reporterId: input.reporterId,
    matchId: input.matchId,
    reason: input.reason,
    details: input.details,
    createdAt: Date.now(),
  };

  memoryReports.push(report);

  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO reports (id, reporter_id, match_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [report.id, report.reporterId, report.matchId ?? null, report.reason, report.details ?? null]
    );
  }

  return report;
}

export function getReports(): StoredReport[] {
  return [...memoryReports];
}
