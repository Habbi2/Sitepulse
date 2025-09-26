export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl py-16 px-6 flex flex-col gap-12">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-emerald-400 text-transparent bg-clip-text">SitePulse</h1>
        <p className="text-neutral-300">Instant multi-pillar website score: performance • accessibility • SEO • security • UX</p>
      </header>
      <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
        <form className="flex flex-col sm:flex-row gap-4" action="/audit" method="get">
          <input name="url" required placeholder="https://example.com" className="flex-1 bg-neutral-800/70 border border-neutral-700 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button className="px-6 py-3 rounded bg-sky-600 hover:bg-sky-500 transition text-sm font-medium">Audit</button>
        </form>
        <p className="mt-4 text-xs text-neutral-500">MVP fast mode: HTML only. Deep JS render coming soon.</p>
      </section>
      <section className="prose prose-invert max-w-none text-sm leading-relaxed">
        <h2 className="text-xl font-semibold tracking-tight mb-3">About</h2>
        <p><strong>SitePulse</strong> delivers a fast, explainable snapshot of a page&apos;s holistic quality. Instead of a monolithic single score with opaque deductions, it breaks results into five weighted pillars so you can see exactly where to focus next.</p>
        <ul className="list-disc pl-5 space-y-1 marker:text-sky-400">
          <li><span className="font-medium text-sky-300">Performance</span> – HTML fetch timing, payload & structural efficiency signals.</li>
          <li><span className="font-medium text-sky-300">Accessibility</span> – semantic structure, alt coverage heuristics, language & viewport basics.</li>
          <li><span className="font-medium text-sky-300">SEO</span> – title quality, description, canonical, indexation hints, meta hygiene.</li>
          <li><span className="font-medium text-sky-300">Security</span> – HTTPS, core defensive headers, mixed content detection.</li>
          <li><span className="font-medium text-sky-300">UX</span> – basic interaction & metadata hints (dup titles, excessive inline JS weight soon).</li>
        </ul>
        <p className="mt-4">Every issue surfaced ties to an actual deduction, including low‑severity optimization hints—no unexplained score drops. Diffing lets you validate incremental fixes without waiting on a full headless crawl.</p>
        <p className="mt-4">Planned enhancements include external resource weight probes, an optional JS render phase, and historical trend storage. For CSP generation and stricter security baselining see the companion <span className="text-sky-400">AutoCSP</span> tool.</p>
        <p className="mt-4 text-neutral-500 text-xs">Design collaboration & aesthetic inspiration by <a href="https://habbiwebdesign.com" className="underline decoration-sky-500/50 hover:decoration-sky-400" target="_blank" rel="noopener noreferrer">Habbi Web Design</a>.</p>
      </section>
    </main>
  );
}
