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
      <section className="text-center py-16 md:py-24">
        <p className="live-badge mb-8">
          {stats.activePlayers} players online
        </p>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight leading-none mb-6 text-hero">
          ODOGGLE
        </h1>
        <div className="flex items-center justify-center gap-4 mb-5">
          <span className="h-px w-12 bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden />
          <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-muted">
            The 1v1 Dog Battle Game
          </p>
          <span className="h-px w-12 bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden />
        </div>
        <p className="text-muted max-w-2xl mx-auto mb-10 text-base md:text-lg leading-relaxed">
          Random 1v1. Verify your PDL rating, win the match, climb the global ladder.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/arena" className="btn-arena inline-block">
            Enter Arena
          </Link>
          <Link href="/pricing" className="btn-accent inline-block">
            Unlock The Lab (Pro)
          </Link>
          <Link href="/leaderboard" className="btn-ghost inline-block">
            Leaderboard
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap justify-center gap-2 mb-16">
        {["Enter Arena", "Face-Off", "Climb ELO", "Pro: Lab PDL"].map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/20">→</span>}
            <span className="step-pill">{step}</span>
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
        <h2 className="section-title text-2xl mb-8 text-center text-gradient-accent">Three steps. One ladder.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Enter Arena", desc: "Free for everyone. Camera check on join, then ranked 1v1 matchmaking.", href: "/arena", accent: "arena" },
            { step: "02", title: "Compete & Climb", desc: "15-second face-off. Higher PDL wins when the timer ends. ELO updates.", href: "/arena", accent: "accent" },
            { step: "03", title: "Pro: The Lab", desc: "Lifetime Pro unlocks on-device PDL scans — symmetry, harmony, muzzle, coat, eyes.", href: "/pricing", accent: "pro" },
          ].map((s) => (
            <div
              key={s.step}
              className={`glass-card p-6 ${s.accent === "pro" ? "glass-card-pro" : ""}`}
            >
              <div className={`font-mono text-sm mb-2 ${s.accent === "pro" ? "text-pro-bright" : s.accent === "arena" ? "text-arena-bright" : "text-accent-bright"}`}>
                {s.step}
              </div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-muted text-sm mb-4">{s.desc}</p>
              <Link href={s.href} className="text-accent-bright text-sm hover:underline">
                Start now →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-8 mb-16">
        <h2 className="section-title text-xl mb-4">What is Odoggle?</h2>
        <p className="text-muted leading-relaxed">
          Odoggle is a live 1v1 face-off arena. Two strangers go camera-on for fifteen seconds,
          then the higher PDL rating wins and ELO is exchanged. Arena is free for everyone.
          Pro members unlock The Lab for on-device PDL scans — nothing uploaded. Win streaks climb the global ladder.
          Top 100 unlocks the Legend tier.
        </p>
      </section>

      <section>
        <h2 className="section-title text-xl mb-6">FAQ</h2>
        <div className="space-y-4 text-sm">
          {[
            { q: "How is PDL calculated?", a: "Dog facial keypoint analysis runs entirely in your browser. Five sub-scores combine into a 1–10 PDL. No frames are uploaded." },
            { q: "Do I need an account?", a: "No. ELO and PDL are saved locally by default. Connect Google on your profile to sync rank across devices." },
            { q: "Is it safe?", a: "Pet-owner gate, instant skip, mute and report. No raw video is logged — only match metadata for ELO." },
          ].map((f) => (
            <div key={f.q} className="glass-card p-5 border-white/5">
              <div className="font-semibold mb-1 text-accent-bright">{f.q}</div>
              <div className="text-muted">{f.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
