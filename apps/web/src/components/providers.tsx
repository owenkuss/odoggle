"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "@/lib/player-context";
import { ConsentBanner } from "@/components/consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        <ConsentBanner />
        {children}
      </PlayerProvider>
    </SessionProvider>
  );
}
