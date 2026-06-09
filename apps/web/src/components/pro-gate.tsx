"use client";

import Link from "next/link";
import { PRO_PRICE_USD } from "@odoggle/shared";
import { usePlayer } from "@/lib/player-context";

export function ProGate({ children }: { children: React.ReactNode }) {
  const { player } = usePlayer();

  if (player.isPro) return <>{children}</>;

  return (
    <div className="glass-card glass-card-pro p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-pro-bright mb-2">Pro only</p>
      <h2 className="text-xl font-bold mb-3">The Lab requires Odoggle Pro</h2>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        PDL scans run on-device in The Lab — symmetry, harmony, muzzle, coat, and eye alertness.
        Unlock with a one-time <strong className="text-white">lifetime</strong> upgrade. Arena stays free.
      </p>
      <ul className="text-left text-sm text-muted space-y-2 mb-8 max-w-sm mx-auto">
        <li>✓ Unlimited Lab PDL scans</li>
        <li>✓ Scan history on your profile</li>
        <li>✓ Priority matchmaking queue</li>
        <li>✓ Pro badge on leaderboard</li>
      </ul>
      <Link href="/pricing" className="btn-pro inline-block w-full max-w-xs">
        Get lifetime Pro — ${PRO_PRICE_USD}
      </Link>
      <p className="text-xs text-muted mt-4">One payment. Yours forever. No subscription.</p>
      <Link href="/arena" className="block text-muted hover:text-accent-bright text-sm mt-6 transition-colors">
        Continue to free Arena →
      </Link>
    </div>
  );
}
