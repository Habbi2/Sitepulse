export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl py-16 px-6 flex flex-col gap-10">
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
    </main>
  );
}
