/** Backend base for REST calls. Browser dev uses same-origin proxy to avoid CORS. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    return "/api/backend";
  }
  const direct =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_PROXY_TARGET ??
    "http://localhost:3001";
  return direct.replace(/\/$/, "");
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
