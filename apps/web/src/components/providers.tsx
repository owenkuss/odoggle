"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleAccountSync } from "@/components/google-account-sync";
import { PlayerProvider } from "@/lib/player-context";
import { ConsentBanner } from "@/components/consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        <GoogleAccountSync />
        <ConsentBanner />
        {children}
      </PlayerProvider>
    </SessionProvider>
  );
}
