"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePlayer } from "@/lib/player-context";
import { apiFetch, wakeServer } from "@/lib/api";
import { getAccountId } from "@/lib/google-account";

interface GoogleAccountState {
  linking: boolean;
  linkError: string | null;
  clearLinkError: () => void;
}

const GoogleAccountContext = createContext<GoogleAccountState>({
  linking: false,
  linkError: null,
  clearLinkError: () => {},
});

export function GoogleAccountProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { player, claimProfile } = usePlayer();
  const syncingRef = useRef(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const accountId = getAccountId(session);
    if (!accountId) return;

    const alreadyLinked = player.id === accountId && !player.isGuest;
    if (alreadyLinked || syncingRef.current) return;

    syncingRef.current = true;
    setLinking(true);
    setLinkError(null);

    (async () => {
      try {
        const shouldMerge =
          player.isGuest || player.id.startsWith("guest_") || player.id !== accountId;

        if (shouldMerge) {
          await wakeServer();
          const res = await fetch("/api/player/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId: player.id }),
          });

          if (res.ok) {
            claimProfile({ ...(await res.json()), isGuest: false });
            return;
          }

          let message = "Could not save your rank to Google. Try again.";
          try {
            const body = (await res.json()) as { error?: string };
            if (body.error) message = body.error;
          } catch {
            /* non-json error body */
          }
          setLinkError(message);
        }

        await wakeServer();
        const remote = await apiFetch(`/api/player/${encodeURIComponent(accountId)}`);
        if (remote.ok) {
          claimProfile({ ...(await remote.json()), isGuest: false });
          setLinkError(null);
        }
      } catch {
        setLinkError("Network error while linking account. Try again.");
      } finally {
        syncingRef.current = false;
        setLinking(false);
      }
    })();
  }, [status, session, player.id, player.isGuest, claimProfile]);

  return (
    <GoogleAccountContext.Provider
      value={{ linking, linkError, clearLinkError: () => setLinkError(null) }}
    >
      {children}
    </GoogleAccountContext.Provider>
  );
}

export function useGoogleAccount() {
  return useContext(GoogleAccountContext);
}
