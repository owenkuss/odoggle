"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ProfileBar } from "@/components/profile-bar";
import { usePlayer } from "@/lib/player-context";

const LINKS = [
  { href: "/lab", label: "The Lab", proOnly: true },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/room", label: "Rooms" },
  { href: "/profile", label: "Profile" },
  { href: "/pricing", label: "Pro" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { player } = usePlayer();

  return (
    <header className="theme-nav sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 md:px-6 py-3">
        <Link
          href="/"
          className="text-base md:text-lg font-black tracking-tight text-hero uppercase shrink-0 hover:opacity-90 transition-opacity"
        >
          ODOGGLE
        </Link>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1 ${
                pathname === l.href ? "nav-link-active" : "nav-link"
              }`}
            >
              {l.label}
              {l.proOnly && !player.isPro && (
                <span className="text-[9px] font-bold text-pro-bright uppercase">Pro</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <ProfileBar />
          <button
            type="button"
            className="lg:hidden text-muted hover:text-white p-2 rounded-md hover:bg-white/5"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-white/6 px-4 pb-4 pt-2 grid grid-cols-2 gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`py-2.5 px-3 rounded-md inline-flex items-center gap-1 ${
                pathname === l.href ? "nav-link-active" : "nav-link"
              }`}
            >
              {l.label}
              {l.proOnly && !player.isPro && (
                <span className="text-[9px] font-bold text-pro-bright uppercase">Pro</span>
              )}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
