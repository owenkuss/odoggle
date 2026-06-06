import type { PdlResult } from "@odoggle/shared";

export async function syncPdlToServer(playerId: string, pdl: PdlResult): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    await fetch(`${base}/api/player/pdl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, pdl }),
    });
  } catch {
    /* offline / server down — localStorage is source of truth */
  }
}
