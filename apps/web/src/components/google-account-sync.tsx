"use client";

import { useGoogleAccountSync } from "@/hooks/use-google-account-sync";

/** Keeps local player profile in sync after Google sign-in. */
export function GoogleAccountSync() {
  useGoogleAccountSync();
  return null;
}
