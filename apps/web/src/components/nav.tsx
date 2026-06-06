"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/lab", label: "The Lab" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/spectate", label: "Vote" },
  { href: "/room", label: "Private Room" },
  { href: "/profile", label: "Profile" },
  { href: "/pricing", label: "Pro" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 px-4 md:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-amber-400 shrink-0">
          Odoggle
        </Link>

        <nav className="hidden md:flex gap-4 text-sm text-zinc-400">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "text-white" : "hover:text-white"}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden text-zinc-400 hover:text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="md:hidden mt-4 pb-2 flex flex-col gap-2 text-sm border-t border-zinc-800 pt-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`py-2 px-2 rounded ${pathname === l.href ? "text-amber-400 bg-zinc-900" : "text-zinc-400"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
