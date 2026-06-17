import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getApiBase, wakeServer } from "@/lib/api";
import { getAccountId } from "@/lib/google-account";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in with Google first" }, { status: 401 });
  }

  const accountId = getAccountId(session);
  if (!accountId) {
    return NextResponse.json({ error: "Missing Google account id" }, { status: 400 });
  }

  const body = (await req.json()) as { guestId?: string };
  const guestId = body.guestId?.trim();
  if (!guestId) {
    return NextResponse.json({ error: "guestId required" }, { status: 400 });
  }

  const displayName = session.user.name ?? session.user.email ?? "Player";

  try {
    await wakeServer();
    const base = getApiBase();
    const mergeUrl = base.startsWith("http")
      ? `${base}/api/player/merge`
      : `${base}/player/merge`;

    const res = await fetch(mergeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId,
        accountId,
        displayName,
        googleId: accountId,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const raw = await res.text();
      let message = "Merge failed";
      try {
        const err = JSON.parse(raw) as { error?: string };
        message = err.error ?? message;
      } catch {
        if (raw) message = raw;
      }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const merged = await res.json();
    return NextResponse.json({ ...merged, isGuest: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach game server" },
      { status: 502 }
    );
  }
}
