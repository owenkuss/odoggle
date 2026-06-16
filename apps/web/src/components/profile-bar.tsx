"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function ProfileBar() {
  const { data: session } = useSession();
  const { player } = usePlayer();

  return (
    <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/10 text-xs md:text-sm min-w-0">
      <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-90">
        <span className="text-zinc-200 font-medium truncate max-w-[5rem] sm:max-w-[7rem] md:max-w-[9rem]">
          {player.displayName}
        </span>
        <span className="text-accent-bright font-mono tabular-nums shrink-0">{player.elo}</span>
      </Link>
      {player.isPro && (
        <span className="hidden sm:inline text-pro-bright text-[10px] font-bold uppercase tracking-wide shrink-0">
          Pro
        </span>
      )}
      {session ? (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-muted hover:text-white shrink-0 px-1.5 sm:px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap"
          title={session.user?.email ?? "Signed in"}
        >
          <span className="hidden sm:inline">Sign out</span>
          <span className="sm:hidden" aria-label="Sign out">
            ↪
          </span>
        </button>
      ) : (
        <GoogleSignInButton
          className="text-muted hover:text-accent-bright shrink-0 px-1.5 sm:px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap bg-transparent border-0 font-normal"
          callbackUrl="/profile"
          label="Sign in"
        />
      )}
    </div>
  );
}
