import Link from "next/link";
import { StatCard } from "@/components/ui";

async function getStats() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${base}/api/stats`, { next: { revalidate: 30 } });
    return res.json();
  } catch {
    return { totalMatches: 0, activePlayers: 0, countries: 0, hoursPerDay: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="max-w-5xl mx-auto">
      <section className="text-center py-16">
        <p className="text-amber-400 text-sm mb-2">Live · {stats.activePlayers} dogs online</p>
        <h1 className="text-5xl font-bold mb-4">Odoggle</h1>
        <p className="text-xl text-zinc-400 mb-2">The 1v1 Dog Battle Game.</p>
        <p className="text-zinc-500 max-w-2xl mx-auto mb-8">
          Random 1v1 dog face battle arena. Verify your PDL rating, win the bark off, climb the global top dog ladder.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/camera-check" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-lg">
            Start Camera Check
          </Link>
          <Link href="/leaderboard" className="border border-zinc-700 hover:border-zinc-500 px-6 py-3 rounded-lg">
            View Leaderboard
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <StatCard label="Total matches" value={stats.totalMatches} />
        <StatCard label="Active players" value={stats.activePlayers} />
        <StatCard label="Countries" value={stats.countries} />
        <StatCard label="Hours / day" value={stats.hoursPerDay} />
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">How the bark battle works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Camera Check", desc: "Quick lighting + framing test. Make sure your dog is battle-ready.", href: "/camera-check" },
            { step: "02", title: "Solo PDL Scan", desc: "Symmetry, harmony, muzzle, coat and eye alertness graded on-device in The Lab.", href: "/lab" },
            { step: "03", title: "Bark Battle & Climb", desc: "Random 1v1. Audience votes in real time. Win streaks earn ELO.", href: "/arena" },
          ].map((s) => (
            <div key={s.step} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-amber-400 font-mono text-sm mb-2">{s.step}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-zinc-500 text-sm mb-4">{s.desc}</p>
              <Link href={s.href} className="text-amber-400 text-sm hover:underline">Start now →</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-16">
        <h2 className="text-xl font-bold mb-4">What is Odoggle?</h2>
        <p className="text-zinc-400 leading-relaxed">
          Odoggle is a live 1v1 dog face-off arena. Two strangers go camera-on for fifteen seconds,
          the audience votes on who won the bark battle, and ELO is exchanged. Every match starts with
          a private PDL rating scan in The Lab — on-device, nothing uploaded. Win streaks climb the global ladder.
          Top 100 unlocks the Top Dog tier.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-6">FAQ</h2>
        <div className="space-y-4 text-sm">
          {[
            { q: "How is PDL calculated?", a: "Dog facial keypoint analysis runs entirely in your browser. Five sub-scores combine into a 1–10 PDL. No frames are uploaded." },
            { q: "Do I need an account?", a: "No. ELO and PDL are saved locally by default. Link Google for a portable rank." },
            { q: "Is it safe?", a: "Pet-owner gate, instant skip, mute and report. No raw video is logged — only match metadata for ELO." },
          ].map((f) => (
            <div key={f.q} className="border-b border-zinc-800 pb-4">
              <div className="font-semibold mb-1">{f.q}</div>
              <div className="text-zinc-500">{f.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
