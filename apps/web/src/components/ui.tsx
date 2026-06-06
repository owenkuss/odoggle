import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-amber-400">
        Odoggle
      </Link>
      <nav className="flex gap-4 text-sm text-zinc-400">
        <Link href="/lab" className="hover:text-white">The Lab</Link>
        <Link href="/arena" className="hover:text-white">Arena</Link>
        <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
        <Link href="/spectate" className="hover:text-white">Vote</Link>
        <Link href="/room" className="hover:text-white">Private Room</Link>
        <Link href="/pricing" className="hover:text-white">Pro</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-6 py-8 mt-16 text-sm text-zinc-500">
      <div className="max-w-5xl mx-auto flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} Odoggle</span>
        <div className="flex gap-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/acceptable-use">Acceptable Use</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/refund">Refund</Link>
          <Link href="/about">About</Link>
        </div>
      </div>
    </footer>
  );
}

export function GateModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md">
        <h2 className="text-xl font-bold mb-4">Pet owner acknowledgment</h2>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
          Odoggle is for filming your dog only. By continuing you confirm you are the pet owner or
          have permission to film the dog, and you agree to our Terms and Privacy Policy. Camera
          frames stay on your device — nothing is uploaded or recorded.
        </p>
        <button
          onClick={onAccept}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg"
        >
          I agree — enable camera
        </button>
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-amber-400">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

export function PdlBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-400">{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
