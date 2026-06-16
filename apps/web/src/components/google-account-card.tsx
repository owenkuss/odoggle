"use client";

import { signOut, useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function GoogleAccountCard() {
  const { data: session, status } = useSession();
  const { player } = usePlayer();

  if (status === "loading") {
    return (
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-2">Google account</h2>
        <p className="text-muted text-sm">Checking sign-in status…</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-2">Google account</h2>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Connect Google to save your ELO, wins, and ladder rank across devices.
        </p>
        <GoogleSignInButton />
      </div>
    );
  }

  const email = session.user.email ?? "Google account";
  const linked = !player.isGuest;

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold mb-1">Google account</h2>
          <p className="text-sm text-zinc-200 truncate">{email}</p>
          {session.user.name && session.user.name !== email && (
            <p className="text-xs text-muted truncate">{session.user.name}</p>
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded shrink-0 ${
            linked ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {linked ? "Connected" : "Linking…"}
        </span>
      </div>
      <p className="text-muted text-sm mb-4">
        {linked
          ? "Your rank syncs to this account. Sign in on any device to pick up where you left off."
          : "Saving your current progress to this Google account…"}
      </p>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/profile" })}
        className="text-sm text-muted hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
