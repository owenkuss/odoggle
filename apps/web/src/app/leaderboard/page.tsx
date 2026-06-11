import { LeaderboardView } from "@/components/leaderboard-view";
import { apiUrl } from "@/lib/api";
import type { LeaderboardEntry } from "@odoggle/shared";

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(apiUrl("/api/leaderboard"), { next: { revalidate: 60 } });
    const data = await res.json();
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();
  return <LeaderboardView entries={entries} />;
}
