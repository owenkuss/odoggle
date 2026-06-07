import type { PdlResult } from "@odoggle/shared";

const HISTORY_KEY = "odoggle_pdl_history";
const MAX = 10;

export function loadPdlHistory(): PdlResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as PdlResult[];
  } catch {
    return [];
  }
}

export function appendPdlHistory(pdl: PdlResult): void {
  const history = loadPdlHistory().filter((h) => h.scannedAt !== pdl.scannedAt);
  history.unshift(pdl);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX)));
}
