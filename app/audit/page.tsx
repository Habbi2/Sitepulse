"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AuditPageProps { searchParams: { url?: string; prev?: string } }

export default function AuditEntryPage({ searchParams }: AuditPageProps) {
  const initialUrl = searchParams.url || '';
  const initialPrev = searchParams.prev || '';
  const [url, setUrl] = useState(initialUrl);
  const [prev, setPrev] = useState(initialPrev);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const autoRan = useRef(false);
  const router = useRouter();

  async function runAudit(target: string, previous?: string) {
    setError(null); setHint(null); setLoading(true);
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: target, previousId: previous || undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || data.error || 'Error'); setHint(data.error?.hint || null); }
      else { router.push(`/report/${data.id}${previous ? `?prev=${previous}` : ''}`); }
    } catch {
      setError('Network error');
    } finally { setLoading(false); }
  }

  // Auto-run if URL was supplied from landing page
  useEffect(() => {
    if (initialUrl && !autoRan.current) {
      autoRan.current = true;
      runAudit(initialUrl, initialPrev || undefined);
    }
  }, [initialUrl, initialPrev]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    runAudit(url, prev || undefined);
  }

  const showForm = !initialUrl || error; // hide form if auto-run succeeded/in progress

  return (
    <main className="mx-auto max-w-xl py-14 px-6 flex flex-col gap-8">
      <Link href="/" className="text-sm text-sky-400">← Back</Link>
      <h1 className="text-2xl font-semibold tracking-tight">Run an Audit</h1>
      {initialUrl && !error && (
        <div className="text-sm text-neutral-400 font-mono break-all">Target: <span className="text-sky-300">{initialUrl}</span>{loading && ' • auditing…'}</div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-neutral-400">Site URL</span>
            <input value={url} onChange={e=>setUrl(e.target.value)} required placeholder="https://example.com" className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-600" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-neutral-500">Previous Report ID (optional for diff)</span>
            <input value={prev} onChange={e=>setPrev(e.target.value)} placeholder="previous report id" className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-600" />
          </label>
          <button disabled={loading} className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded px-5 py-2 text-sm font-medium text-white">{loading ? 'Auditing…' : 'Run Audit'}</button>
          {error && <div className="text-sm text-rose-400 space-y-1"><p>{error}</p>{hint && <p className="text-xs text-neutral-400">Hint: {hint}</p>}</div>}
        </form>
      )}
      <p className="text-xs text-neutral-600 leading-relaxed">Report link will be copyable from the results page (cache TTL ~10 minutes). Provide a previous report id to prepare diff view.</p>
    </main>
  );
}

