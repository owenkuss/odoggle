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
      <h1 className="text-3xl font-bold mb-2 text-hero">Odoggle Pro</h1>
      <p className="text-pro-bright text-sm font-semibold mb-2 uppercase tracking-wide">
        {PRO_IS_LIFETIME ? "Lifetime access" : "One-time upgrade"}
      </p>
      <p className="text-muted mb-8">One payment. No subscription. Yours forever.</p>

      {justPaid && (
        <div className="mb-6 glass-card border-teal/30 text-teal p-4 text-sm">
          Payment received — lifetime Pro unlocked. Thank you!
        </div>
      )}

      <div className="glass-card glass-card-pro p-8">
        <div className="text-4xl font-bold stat-value mb-1">${PRO_PRICE_USD}</div>
        <p className="text-xs text-muted mb-6">pay once · lifetime access</p>
        <ul className="text-left text-sm text-muted space-y-2 mb-8">
          <li>✓ <strong className="text-zinc-200">The Lab</strong> — unlimited on-device PDL scans</li>
          <li>✓ Extended PDL scan history on profile</li>
          <li>✓ Priority matchmaking queue</li>
          <li>✓ Pro badge on leaderboard</li>
          <li>✓ Support Odoggle development</li>
        </ul>
        {player.isPro ? (
          <div className="text-teal font-semibold">You have lifetime Pro</div>
        ) : (
          <button onClick={checkout} className="btn-pro w-full">
            Get lifetime Pro
          </button>
        )}
      </div>
      <p className="text-xs text-muted mt-6">14-day no-questions-asked refund.</p>
      <p className="text-xs text-muted mt-2">Arena and private rooms remain free.</p>
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
