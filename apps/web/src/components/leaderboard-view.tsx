"use client";

import Link from "next/link";
import { RANK_TIERS, formatEloBand, getRankTier, type LeaderboardEntry } from "@odoggle/shared";
import { usePlayer } from "@/lib/player-context";

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const tier = getRankTier(entry.elo);
  const heights = { 1: "pt-8 pb-6", 2: "pt-6 pb-5", 3: "pt-5 pb-4" };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div
      className={`glass-card flex-1 min-w-0 text-center ${heights[place]} ${
        place === 1 ? "border-amber-500/40 shadow-[var(--glow-amber)] scale-[1.02] z-10" : ""
      }`}
    >
      <div className="text-2xl mb-1">{medals[place]}</div>
      <div className="text-xs text-muted uppercase tracking-widest mb-1">#{entry.rank}</div>
      <div className="font-bold truncate px-2">{entry.displayName}</div>
      <div className="text-xs text-muted mt-1">
        {tier.emoji} {tier.title}
      </div>
      <div className="text-2xl font-black stat-value mt-2 tabular-nums">{entry.elo}</div>
      <div className="text-xs text-muted mt-1">
        {entry.wins}W · {entry.losses}L
        {entry.pdl != null && <span className="ml-1">· PDL {entry.pdl.toFixed(1)}</span>}
      </div>
    </div>
  );
}

function RankRow({ entry, highlight }: { entry: LeaderboardEntry; highlight?: boolean }) {
  const tier = getRankTier(entry.elo);

  return (
    <tr
      className={`border-b border-white/5 transition-colors ${
        highlight ? "bg-amber-500/10" : "hover:bg-white/[0.03]"
      } ${entry.isTopDog ? "border-l-2 border-l-amber-500/50" : ""}`}
    >
      <td className="p-3 sm:p-4 font-mono text-muted tabular-nums w-12">{entry.rank}</td>
      <td className="p-3 sm:p-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate max-w-[10rem] sm:max-w-none">{entry.displayName}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-muted whitespace-nowrap">
            {tier.emoji} {tier.title}
          </span>
          {entry.isTopDog && (
            <span className="text-[10px] font-bold uppercase text-accent-bright">Top 100</span>
          )}
          {entry.isPro && (
            <span className="text-[10px] font-bold uppercase text-pro-bright">Pro</span>
          )}
        </div>
      </td>
      <td className="p-3 sm:p-4 text-right tabular-nums hidden md:table-cell">
        {entry.pdl != null ? (
          <span className="text-accent-bright font-medium">{entry.pdl.toFixed(1)}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="p-3 sm:p-4 text-right text-muted tabular-nums hidden sm:table-cell">
        {entry.wins}-{entry.losses}
      </td>
      <td className="p-3 sm:p-4 text-right text-muted tabular-nums hidden lg:table-cell">
        {winRate(entry.wins, entry.losses)}
      </td>
      <td className="p-3 sm:p-4 text-right font-bold tabular-nums">
        <span className="stat-value text-lg">{entry.elo}</span>
      </td>
    </tr>
  );
}

export function LeaderboardView({ entries }: { entries: LeaderboardEntry[] }) {
  const { player } = usePlayer();
  const myEntry = entries.find((e) => e.id === player.id);
  const myTier = getRankTier(player.elo);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-4xl mx-auto">
      <section className="text-center mb-10">
        <p className="live-badge mb-4 inline-flex">{entries.length} ranked dogs</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-hero mb-2">
          Global Rank
        </h1>
        <p className="text-muted">Top 100 Top Dogs · ELO ladder · updated after every match</p>
        <div className="flex gap-3 justify-center flex-wrap mt-6">
          <Link href="/arena" className="btn-arena">
            Enter Arena
          </Link>
          <Link href="/profile" className="btn-ghost">
            Your profile
          </Link>
        </div>
      </section>

      <section className="glass-card p-6 mb-8">
        <h2 className="section-title text-lg mb-4 text-gradient-accent">Your standing</h2>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-sm text-muted">Playing as</div>
            <div className="font-bold text-lg">{player.displayName}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Tier</div>
            <div className="font-semibold">
              {myTier.emoji} {myTier.title}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">ELO</div>
            <div className="text-2xl font-black stat-value tabular-nums">{player.elo}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted">Record</div>
            <div className="font-mono tabular-nums">
              {player.wins}W · {player.losses}L
            </div>
          </div>
          {myEntry ? (
            <div className="text-center">
              <div className="text-sm text-muted">Ladder</div>
              <div className="text-xl font-bold text-accent-bright">#{myEntry.rank}</div>
            </div>
          ) : (
            <div className="text-sm text-muted max-w-[12rem]">
              Win ranked arena matches to appear on the board
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="section-title text-lg mb-4 text-center text-muted">Rank tiers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {RANK_TIERS.map((tier) => (
            <div
              key={tier.title}
              className={`glass-card p-3 text-center text-xs ${
                player.elo >= tier.minElo && player.elo <= tier.maxElo
                  ? "border-accent/40 ring-1 ring-amber-500/20"
                  : ""
              }`}
            >
              <div className="text-xl mb-1">{tier.emoji}</div>
              <div className="font-semibold text-zinc-200">{tier.title}</div>
              <div className="text-muted mt-1 leading-tight">{formatEloBand(tier)}</div>
            </div>
          ))}
        </div>
      </section>

      {entries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🐕</div>
          <h2 className="text-xl font-bold mb-2">No ranked players yet</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Be the first on the ladder — enter the arena, win bark battles, and claim #1.
          </p>
          <Link href="/arena" className="btn-accent inline-block">
            Start climbing →
          </Link>
        </div>
      ) : (
        <>
          {top3.length >= 3 && (
            <section className="mb-8">
              <h2 className="section-title text-lg mb-4 text-center text-muted">Top dogs</h2>
              <div className="flex gap-3 items-end max-w-2xl mx-auto">
                <PodiumCard entry={top3[1]} place={2} />
                <PodiumCard entry={top3[0]} place={1} />
                <PodiumCard entry={top3[2]} place={3} />
              </div>
            </section>
          )}

          <section className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="border-b border-white/10 text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-3 sm:p-4">#</th>
                    <th className="text-left p-3 sm:p-4">Player</th>
                    <th className="text-right p-3 sm:p-4 hidden md:table-cell">PDL</th>
                    <th className="text-right p-3 sm:p-4 hidden sm:table-cell">W-L</th>
                    <th className="text-right p-3 sm:p-4 hidden lg:table-cell">Win%</th>
                    <th className="text-right p-3 sm:p-4">ELO</th>
                  </tr>
                </thead>
                <tbody>
                  {(top3.length >= 3 ? rest : entries).map((e) => (
                    <RankRow key={e.id} entry={e} highlight={e.id === player.id} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
