import Link from "next/link";

export function Footer() {
  return (
    <footer className="theme-footer px-6 py-8 mt-16 text-sm text-muted">
      <div className="max-w-5xl mx-auto flex flex-wrap gap-4 justify-between">
        <span className="text-gradient-accent font-semibold">© {new Date().getFullYear()} Odoggle</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/terms" className="transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors">
            Privacy
          </Link>
          <Link href="/acceptable-use" className="transition-colors">
            Acceptable Use
          </Link>
          <Link href="/cookies" className="transition-colors">
            Cookies
          </Link>
          <Link href="/refund" className="transition-colors">
            Refund
          </Link>
          <Link href="/about" className="transition-colors">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function GateModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-md p-8">
        <h2 className="text-xl font-bold mb-4 text-gradient-accent">Pet owner acknowledgment</h2>
        <p className="text-muted mb-6 text-sm leading-relaxed">
          Odoggle is for filming your dog only. By continuing you confirm you are the pet owner or
          have permission to film the dog, and you agree to our Terms and Privacy Policy. Camera
          frames stay on your device — nothing is uploaded or recorded.
        </p>
        <button onClick={onAccept} className="btn-accent w-full">
          I agree — enable camera
        </button>
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl stat-value">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export function PdlBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-accent-bright font-medium">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full pdl-bar-fill rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
