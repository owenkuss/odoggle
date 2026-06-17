"use client";

import { Suspense, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { describeAuthError } from "@/lib/auth-config";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { useGoogleAccount } from "@/components/google-account-provider";

function GoogleAccountCardInner() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { player } = usePlayer();
  const { linking, linkError, clearLinkError } = useGoogleAccount();
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);

  const urlError = describeAuthError(searchParams.get("error"));

  useEffect(() => {
    void fetch("/api/auth/status")
      .then((r) => r.json())
      .then((body: { configured?: boolean }) => setAuthConfigured(Boolean(body.configured)))
      .catch(() => setAuthConfigured(null));
  }, []);

  if (status === "loading") {
    return (
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-2">Google account</h2>
        <p className="text-muted text-sm">Checking sign-in status…</p>
      </div>
    );
  }

  if (authConfigured === false) {
    return (
      <div className="glass-card p-6 mb-6 border-amber-500/30">
        <h2 className="font-semibold mb-2">Google account</h2>
        <p className="text-muted text-sm">
          Google sign-in is not configured on this deployment yet. Add OAuth env vars in Vercel.
        </p>
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
        {urlError && (
          <p className="text-sm text-red-300 mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2">
            {urlError}
          </p>
        )}
        <GoogleSignInButton />
      </div>
    );
  }

  const email = session.user.email ?? "Google account";
  const linked = !player.isGuest && !linking;

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
      {urlError && (
        <p className="text-sm text-red-300 mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2">
          {urlError}
        </p>
      )}
      {linkError && (
        <p className="text-sm text-red-300 mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2">
          {linkError}{" "}
          <button type="button" onClick={clearLinkError} className="underline hover:text-red-200">
            Dismiss
          </button>
        </p>
      )}
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

export function GoogleAccountCard() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold mb-2">Google account</h2>
          <p className="text-muted text-sm">Loading…</p>
        </div>
      }
    >
      <GoogleAccountCardInner />
    </Suspense>
  );
}
