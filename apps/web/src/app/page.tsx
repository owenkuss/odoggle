import Link from "next/link";
import { StatCard } from "@/components/ui";
import { apiUrl } from "@/lib/api";

async function getStats() {
  try {
    const res = await fetch(apiUrl("/api/stats"), { next: { revalidate: 30 } });
    return res.json();
  } catch {
    return { totalMatches: 0, activePlayers: 0, countries: 0, hoursPerDay: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="max-w-5xl mx-auto">
      <section className="text-center py-16 md:py-20">
        <p className="text-amber-400 text-sm mb-6 uppercase tracking-widest">
          Live · {stats.activePlayers} dogs online
        </p>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight leading-none mb-6 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
          ODOGGLE
        </h1>
        <div className="flex items-center justify-center gap-4 mb-5">
          <span className="h-px w-12 bg-zinc-700" aria-hidden />
          <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-zinc-400">
            The 1v1 Dog Battle Game
          </p>
          <span className="h-px w-12 bg-zinc-700" aria-hidden />
        </div>
        <p className="text-zinc-500 max-w-2xl mx-auto mb-10 text-base md:text-lg leading-relaxed">
          Random 1v1 dog face battle arena. Verify your PDL rating, win the bark off, climb the global top dog ladder.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/arena" className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg">
            Enter Arena
          </Link>
          <Link href="/pricing" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-lg">
            Unlock The Lab (Pro)
          </Link>
          <Link href="/leaderboard" className="border border-zinc-700 hover:border-zinc-500 px-6 py-3 rounded-lg">
            Leaderboard
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap justify-center gap-2 mb-16 text-xs text-zinc-600">
        {["Enter Arena", "Bark Battle", "Climb ELO", "Pro: Lab PDL"].map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <span className="text-zinc-700">→</span>}
            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">{step}</span>
          </span>
        ))}
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
            { step: "01", title: "Enter Arena", desc: "Free for everyone. Camera check on join, then ranked 1v1 matchmaking.", href: "/arena" },
            { step: "02", title: "Bark Battle & Climb", desc: "15-second face-off. Higher PDL wins when the timer ends. ELO updates.", href: "/arena" },
            { step: "03", title: "Pro: The Lab", desc: "Lifetime Pro unlocks on-device PDL scans — symmetry, harmony, muzzle, coat, eyes.", href: "/pricing" },
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
          then the higher PDL rating wins and ELO is exchanged. Arena is free for everyone.
          Pro members unlock The Lab for on-device PDL scans — nothing uploaded. Win streaks climb the global ladder.
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
