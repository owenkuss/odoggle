"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PRO_PRICE_USD } from "@odoggle/shared";
import { usePlayer } from "@/lib/player-context";

function PricingContent() {
  const { player, setPro } = usePlayer();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("success") === "1";

  useEffect(() => {
    if (justPaid && !player.isPro) setPro(true);
  }, [justPaid, player.isPro, setPro]);

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
      <h1 className="text-3xl font-bold mb-4">Odoggle Pro</h1>
      <p className="text-zinc-400 mb-8">One-time upgrade. No subscription.</p>

      {justPaid && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-sm">
          Payment received — Pro unlocked. Thank you!
        </div>
      )}

      <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-8">
        <div className="text-4xl font-bold text-amber-400 mb-2">${PRO_PRICE_USD}</div>
        <ul className="text-left text-sm text-zinc-400 space-y-2 mb-8">
          <li>✓ Priority matchmaking queue</li>
          <li>✓ Extended PDL scan history</li>
          <li>✓ Pro badge on leaderboard</li>
          <li>✓ Support Odoggle development</li>
        </ul>
        {player.isPro ? (
          <div className="text-green-400 font-semibold">You have Pro</div>
        ) : (
          <button onClick={checkout} className="w-full bg-amber-500 text-black py-3 rounded-lg font-semibold">
            Upgrade to Pro
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-600 mt-6">14-day no-questions-asked refund.</p>
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
