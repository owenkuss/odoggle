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
    <div className="fixed bottom-0 inset-x-0 glass-card rounded-none border-x-0 border-b-0 p-4 z-50 flex flex-wrap gap-4 items-center justify-between text-sm">
      <p className="text-muted">We use minimal analytics. Accept or decline (Google Consent Mode v2).</p>
      <div className="flex gap-2">
        <button
          onClick={() => { localStorage.setItem("odoggle_consent", "accepted"); setShow(false); }}
          className="btn-accent px-4 py-2 text-sm"
        >
          Accept
        </button>
        <button
          onClick={() => { localStorage.setItem("odoggle_consent", "declined"); setShow(false); }}
          className="btn-ghost px-4 py-2 text-sm"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
