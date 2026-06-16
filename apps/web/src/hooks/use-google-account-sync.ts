"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-context";
import { apiFetch } from "@/lib/api";
import { getAccountId } from "@/lib/google-account";

export function useGoogleAccountSync() {
  const { data: session, status } = useSession();
  const { player, claimProfile } = usePlayer();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const accountId = getAccountId(session);
    if (!accountId) return;

    const alreadyLinked = player.id === accountId && !player.isGuest;
    if (alreadyLinked || syncingRef.current) return;

    syncingRef.current = true;

    (async () => {
      try {
        const shouldMerge =
          player.isGuest || player.id.startsWith("guest_") || player.id !== accountId;

        if (shouldMerge) {
          const res = await fetch("/api/player/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId: player.id }),
          });
          if (res.ok) {
            claimProfile({ ...(await res.json()), isGuest: false });
            return;
          }
        }

        const remote = await apiFetch(`/api/player/${encodeURIComponent(accountId)}`);
        if (remote.ok) {
          claimProfile({ ...(await remote.json()), isGuest: false });
        }
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [status, session, player.id, player.isGuest, claimProfile]);
}
