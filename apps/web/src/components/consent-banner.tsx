"use client";

import { useEffect, useState } from "react";

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const region = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eea = /^(Europe\/|Atlantic\/(Azores|Canary|Madeira))/i.test(region);
    if (eea && !localStorage.getItem("odoggle_consent")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-700 p-4 z-50 flex flex-wrap gap-4 items-center justify-between text-sm">
      <p className="text-zinc-400">We use minimal analytics. Accept or decline (Google Consent Mode v2).</p>
      <div className="flex gap-2">
        <button
          onClick={() => { localStorage.setItem("odoggle_consent", "accepted"); setShow(false); }}
          className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold"
        >
          Accept
        </button>
        <button
          onClick={() => { localStorage.setItem("odoggle_consent", "declined"); setShow(false); }}
          className="border border-zinc-600 px-4 py-2 rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
