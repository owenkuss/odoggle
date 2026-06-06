export default function AcceptableUsePage() {
  return (
    <article className="max-w-2xl mx-auto text-zinc-400 text-sm leading-relaxed space-y-4">
      <h1 className="text-2xl font-bold text-white">Acceptable Use</h1>
      <p>Odoggle is for filming dogs only. Prohibited uses include:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Showing humans instead of dogs in the arena</li>
        <li>Harassment, hate speech, or threatening behavior</li>
        <li>Deliberate mistreatment or distress of animals on camera</li>
        <li>Attempting to manipulate ELO or PDL scores</li>
        <li>Automated bots or fake match participation</li>
      </ul>
      <p>Use the report button during matches. Reports store metadata only — no video.</p>
    </article>
  );
}
