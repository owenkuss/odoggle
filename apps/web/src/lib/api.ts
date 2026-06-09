/** Backend base for REST calls. Browser dev uses same-origin proxy to avoid CORS. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    if (isOdoggleProductionHost()) return "https://api.odoggle.com";
    return "/api/backend";
  }
  const direct =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_PROXY_TARGET ??
    "http://localhost:3001";
  return direct.replace(/\/$/, "");
}

function isOdoggleProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "odoggle.com" || host === "www.odoggle.com";
}

/** WebSocket URL for realtime matchmaking. Must point at the game server, not the Next.js proxy. */
export function getSignalUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl?.startsWith("https://")) {
    return `${apiUrl.replace(/^https:\/\//, "wss://").replace(/\/$/, "")}/signal`;
  }
  if (apiUrl?.startsWith("http://")) {
    return `${apiUrl.replace(/^http:\/\//, "ws://").replace(/\/$/, "")}/signal`;
  }

  if (typeof window !== "undefined" && isOdoggleProductionHost()) {
    return "wss://api.odoggle.com/signal";
  }

  return "ws://localhost:3001/signal";
}

/** Wake a sleeping Render instance before opening WebSocket. */
export async function wakeServer(): Promise<void> {
  try {
    await fetch(apiUrl("/health"), { cache: "no-store" });
  } catch {
    /* server may still be waking */
  }
}

/** Build a full URL for an `/api/...` path on the Odoggle server. */
export function apiUrl(path: string): string {
  const base = getApiBase();
  const suffix = path.startsWith("/api/") ? path.slice(4) : path.startsWith("/") ? path : `/${path}`;

  if (base.startsWith("http")) {
    return `${base}/api${suffix}`;
  }
  return `${base}${suffix}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
