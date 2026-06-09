import { apiFetch } from "@/lib/api";
import type { PlayerProfile } from "@odoggle/shared";

/** Pull Pro status (and full profile) from server after checkout or on load. */
export async function fetchPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  try {
    const res = await apiFetch(`/api/player/${playerId}`);
    if (!res.ok) return null;
    return (await res.json()) as PlayerProfile;
  } catch {
    return null;
  }
}
