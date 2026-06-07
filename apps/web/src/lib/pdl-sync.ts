import type { PdlResult } from "@odoggle/shared";
import { apiFetch } from "@/lib/api";

export async function syncPdlToServer(playerId: string, pdl: PdlResult): Promise<void> {
  try {
    await apiFetch("/api/player/pdl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, pdl }),
    });
  } catch {
    /* offline / server down — localStorage is source of truth */
  }
}
