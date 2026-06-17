/** Shared cookie domain so sessions work on odoggle.com and www.odoggle.com. */
export function getAuthCookieDomain(): string | undefined {
  const raw =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!raw) return undefined;

  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) {
      return undefined;
    }
    const bare = host.startsWith("www.") ? host.slice(4) : host;
    return bare.includes(".") ? `.${bare}` : undefined;
  } catch {
    return undefined;
  }
}

export function getMissingAuthEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID?.trim()) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET?.trim()) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.NEXTAUTH_SECRET?.trim()) missing.push("NEXTAUTH_SECRET");
  return missing;
}

export function isGoogleAuthConfigured(): boolean {
  return getMissingAuthEnv().length === 0;
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET.",
  AccessDenied: "Access was denied. Try another Google account.",
  OAuthSignin: "Could not start Google sign-in. Check OAuth redirect URIs in Google Cloud Console.",
  OAuthCallback: "Google callback failed. Add both https://odoggle.com and https://www.odoggle.com callback URLs.",
  OAuthCreateAccount: "Could not create account. Try again.",
  Callback: "Sign-in callback failed. Try again.",
  Default: "Sign-in failed. Try again.",
};

export function describeAuthError(code: string | null | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
}
