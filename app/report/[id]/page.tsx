import Link from 'next/link';
import { ReportClient } from './ReportClient';

export default function ReportPage({ params, searchParams }: { params: { id: string }; searchParams: { prev?: string } }) {
  const { id } = params;
  const prev = searchParams.prev;
  return (
    <main className="mx-auto max-w-6xl py-10 px-6 flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-sky-400">← Back</Link>
        <span className="text-xs font-mono text-neutral-500">{id.slice(0,8)}</span>
        {prev && <span className="text-xs text-neutral-600">Comparing to {prev.slice(0,8)}</span>}
      </div>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Report</h1>
      </header>
      <ReportClient id={id} prevId={prev} />
    </main>
  );
}
