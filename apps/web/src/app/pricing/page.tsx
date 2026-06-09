"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PRO_IS_LIFETIME, PRO_PRICE_USD } from "@odoggle/shared";
import { fetchPlayerProfile } from "@/lib/pro-sync";
import { usePlayer } from "@/lib/player-context";

function PricingContent() {
  const { player, setPro, claimProfile } = usePlayer();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("success") === "1";

  useEffect(() => {
    if (!justPaid) return;
    void (async () => {
      const remote = await fetchPlayerProfile(player.id);
      if (remote?.isPro) {
        claimProfile(remote);
      } else if (!player.isPro) {
        setPro(true);
      }
    })();
  }, [justPaid, player.id, player.isPro, setPro, claimProfile]);

  async function checkout() {
    const res = await fetch("/api/pro/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else if (data.demo) setPro(true);
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <h1 className="text-3xl font-bold mb-2">Odoggle Pro</h1>
      <p className="text-amber-400 text-sm font-semibold mb-2 uppercase tracking-wide">
        {PRO_IS_LIFETIME ? "Lifetime access" : "One-time upgrade"}
      </p>
      <p className="text-zinc-400 mb-8">One payment. No subscription. Yours forever.</p>

      {justPaid && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-sm">
          Payment received — lifetime Pro unlocked. Thank you!
        </div>
      )}

      <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-8">
        <div className="text-4xl font-bold text-amber-400 mb-1">${PRO_PRICE_USD}</div>
        <p className="text-xs text-zinc-500 mb-6">pay once · lifetime access</p>
        <ul className="text-left text-sm text-zinc-400 space-y-2 mb-8">
          <li>✓ <strong className="text-zinc-200">The Lab</strong> — unlimited on-device PDL scans</li>
          <li>✓ Extended PDL scan history on profile</li>
          <li>✓ Priority matchmaking queue</li>
          <li>✓ Pro badge on leaderboard</li>
          <li>✓ Support Odoggle development</li>
        </ul>
        {player.isPro ? (
          <div className="text-green-400 font-semibold">You have lifetime Pro</div>
        ) : (
          <button onClick={checkout} className="w-full bg-amber-500 text-black py-3 rounded-lg font-semibold">
            Get lifetime Pro
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-600 mt-6">14-day no-questions-asked refund.</p>
      <p className="text-xs text-zinc-600 mt-2">Arena, rooms, and spectating remain free.</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500 py-16">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
