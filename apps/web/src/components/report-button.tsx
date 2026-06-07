"use client";

import { useState } from "react";
import type { ReportReason } from "@odoggle/shared";
import { apiFetch } from "@/lib/api";
import { usePlayer } from "@/lib/player-context";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "not_a_dog", label: "Not a dog" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "abuse", label: "Abuse / harassment" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

export function ReportButton({ matchId }: { matchId?: string }) {
  const { player } = usePlayer();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(reason: ReportReason) {
    await apiFetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterId: player.id, matchId, reason }),
    });
    setSent(true);
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-red-900/50 text-red-300 rounded-lg text-sm">
        Report
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold mb-4">Report match</h3>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => submit(r.value)}
                  className="w-full text-left px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} className="w-full mt-4 text-zinc-500 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {sent && <span className="text-xs text-green-400 ml-2">Reported</span>}
    </>
  );
}
