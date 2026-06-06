export default function PrivacyPage() {
  return (
    <article className="max-w-2xl mx-auto text-zinc-400 text-sm leading-relaxed space-y-4">
      <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      <p>Odoggle is privacy-first by design.</p>
      <p><strong className="text-white">Camera data:</strong> PDL scans run entirely in your browser. We do not upload, store, or transmit camera frames.</p>
      <p><strong className="text-white">Video calls:</strong> WebRTC streams go directly between participants. We operate only the signaling channel.</p>
      <p><strong className="text-white">Match data:</strong> We store match outcomes (win/loss), ELO changes, and optional display names for leaderboard purposes.</p>
      <p><strong className="text-white">Google sign-in:</strong> If you link a profile, we receive your name and email from Google OAuth.</p>
      <p><strong className="text-white">Analytics:</strong> EEA/UK/CH visitors receive opt-in consent via Google Consent Mode v2.</p>
    </article>
  );
}
