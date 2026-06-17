"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleAccountProvider } from "@/components/google-account-provider";
import { PlayerProvider } from "@/lib/player-context";
import { ConsentBanner } from "@/components/consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <PlayerProvider>
        <GoogleAccountProvider>
          <ConsentBanner />
          {children}
        </GoogleAccountProvider>
      </PlayerProvider>
    </SessionProvider>
  );
}
