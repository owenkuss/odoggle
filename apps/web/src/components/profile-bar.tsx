"use client";

import Link from "next/link";
import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-context";
import { apiFetch } from "@/lib/api";

export function ProfileBar() {
  const { data: session } = useSession();
  const { player, claimProfile } = usePlayer();

  useEffect(() => {
    if (!session?.user?.email) return;
    const accountId = (session.user as { id?: string }).id ?? session.user.email;
    const displayName = session.user.name ?? session.user.email ?? "Player";

    async function merge() {
      const res = await apiFetch("/api/player/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: player.id,
          accountId,
          displayName,
        }),
      });
      if (!res.ok) return;
      const merged = await res.json();
      claimProfile({ ...merged, isGuest: false });
    }

    if (player.isGuest || player.id.startsWith("guest_")) {
      void merge();
    }
  }, [session, player.id, player.isGuest, claimProfile]);

  return (
    <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs md:text-sm">
      <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-90">
        <span className="text-zinc-200 font-medium truncate max-w-[7rem] md:max-w-[9rem]">
          {player.displayName}
        </span>
        <span className="text-accent-bright font-mono tabular-nums shrink-0">{player.elo}</span>
      </Link>
      {player.isPro && (
        <span className="text-pro-bright text-[10px] font-bold uppercase tracking-wide shrink-0">Pro</span>
      )}
      {session ? (
        <button
          onClick={() => signOut()}
          className="text-muted hover:text-white shrink-0 px-2 py-1 rounded hover:bg-white/5"
        >
          Sign out
        </button>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="text-muted hover:text-accent-bright shrink-0 px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap"
        >
          Claim
        </button>
      )}
    </div>
  );
}
