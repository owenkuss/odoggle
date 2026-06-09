"use client";

import Link from "next/link";
import { PRO_PRICE_USD } from "@odoggle/shared";
import { usePlayer } from "@/lib/player-context";

export function ProGate({ children }: { children: React.ReactNode }) {
  const { player } = usePlayer();

  if (player.isPro) return <>{children}</>;

  return (
    <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Pro only</p>
      <h2 className="text-xl font-bold mb-3">The Lab requires Odoggle Pro</h2>
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        PDL scans run on-device in The Lab — symmetry, harmony, muzzle, coat, and eye alertness.
        Unlock with a one-time <strong className="text-white">lifetime</strong> upgrade. Arena and
        voting stay free.
      </p>
      <ul className="text-left text-sm text-zinc-500 space-y-2 mb-8 max-w-sm mx-auto">
        <li>✓ Unlimited Lab PDL scans</li>
        <li>✓ Scan history on your profile</li>
        <li>✓ Priority matchmaking queue</li>
        <li>✓ Pro badge on leaderboard</li>
      </ul>
      <Link
        href="/pricing"
        className="inline-block w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg"
      >
        Get lifetime Pro — ${PRO_PRICE_USD}
      </Link>
      <p className="text-xs text-zinc-600 mt-4">One payment. Yours forever. No subscription.</p>
      <Link href="/arena" className="block text-zinc-500 hover:text-zinc-300 text-sm mt-6">
        Continue to free Arena →
      </Link>
    </div>
  );
}
