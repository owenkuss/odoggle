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
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2 text-sm">
      <span className="text-zinc-400">{player.displayName}</span>
      <Link href="/profile" className="text-zinc-600 hover:text-amber-400 text-xs">
        {player.elo} ELO
      </Link>
      {player.isPro && <span className="text-purple-400 text-xs">Pro</span>}
      {session ? (
        <button onClick={() => signOut()} className="text-zinc-500 hover:text-white text-xs">
          Sign out
        </button>
      ) : (
        <button onClick={() => signIn("google")} className="text-zinc-500 hover:text-white text-xs">
          Claim profile
        </button>
      )}
    </div>
  );
}
