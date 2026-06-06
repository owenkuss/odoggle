async function getLeaderboard() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${base}/api/leaderboard`, { next: { revalidate: 60 } });
    const data = await res.json();
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">Global Rank</h1>
      <p className="text-zinc-500 text-center mb-8">Top 100 Top Dogs</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-zinc-500">
            <tr>
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Player</th>
              <th className="text-right p-4">ELO</th>
              <th className="text-right p-4">W-L</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-zinc-600">No ranked players yet. Be the first!</td></tr>
            )}
            {entries.map((e: { rank: number; displayName: string; elo: number; wins: number; losses: number; isTopDog: boolean; isPro: boolean }) => (
              <tr key={e.rank} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="p-4 font-mono">{e.rank}</td>
                <td className="p-4">
                  {e.displayName}
                  {e.isTopDog && <span className="ml-2 text-xs text-amber-400">Top Dog</span>}
                  {e.isPro && <span className="ml-2 text-xs text-purple-400">Pro</span>}
                </td>
                <td className="p-4 text-right font-bold">{e.elo}</td>
                <td className="p-4 text-right text-zinc-500">{e.wins}-{e.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
