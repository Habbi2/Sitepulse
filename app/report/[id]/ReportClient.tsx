"use client";
import { useEffect, useState } from 'react';
import { ScoreGauge } from '../../../components/ScoreGauge';
import { PillarBars } from '../../../components/PillarBars';
import { IssueList } from '../../../components/IssueList';
import type { Report, Issue } from '../../../types/report';
import { computePillarDeltas, diffIssues, deltaClass } from '../../../lib/diff';

export function ReportClient({ id, prevId }: { id: string; prevId?: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [prevReport, setPrevReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const current = await fetch(`/api/report/${id}`).then(r=>r.json());
        if (current.error) throw new Error(current.error.message || current.error);
        if (cancelled) return;
        setReport(current as Report);
        if (prevId) {
          const prev = await fetch(`/api/report/${prevId}`).then(r=>r.json());
            if (!cancelled) {
              if (!prev.error) setPrevReport(prev as Report);
            }
        }
      } catch (e:any) {
        if (!cancelled) setError(e.message || 'Load error');
      }
    }
    load();
    return ()=> { cancelled = true; };
  }, [id, prevId]);
  if (error) return <p className="text-sm text-rose-400">{error}</p>;
  if (!report) return <p className="text-sm text-neutral-400">Loading…</p>;
  const pillarDeltas = prevReport ? computePillarDeltas(report, prevReport) : null;
  const issueDiff = prevReport ? diffIssues(report.issues as Issue[], prevReport.issues as Issue[]) : null;
  return (
    <div className="grid md:grid-cols-3 gap-10 items-start">
      <div className="md:col-span-1 flex flex-col gap-8">
        <ScoreGauge value={report.overall} />
  {pillarDeltas && <OverallDelta delta={pillarDeltas.overall} />}
        <PillarBars scores={report.scores} />
  {pillarDeltas && <DeltaPillars deltas={pillarDeltas} />}
        <ShareBlock id={report.id} />
      </div>
      <div className="md:col-span-2 flex flex-col gap-6">
        <h2 className="text-sm uppercase tracking-wide text-neutral-400 flex items-center gap-3">Top Issues {issueDiff && <IssueDiffSummary diff={issueDiff} />}</h2>
        {issueDiff && <IssueChangeList diff={issueDiff} />}
        <IssueList issues={report.issues as Issue[] } />
      </div>
    </div>
  );
}

function ShareBlock({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wide text-neutral-500">Share</h3>
      <button onClick={() => navigator.clipboard.writeText(window.location.origin + '/report/' + id)} className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded px-3 py-2 text-neutral-300 text-left">Copy Link</button>
      <p className="text-[10px] text-neutral-500">Link valid ~10 minutes (in-memory).</p>
    </div>
  );
}

function OverallDelta({ delta }: { delta: number }) {
  return <span className={`text-xs font-medium ${deltaClass(delta)}`}>Overall Δ {delta >=0 ? '+' : ''}{delta.toFixed(1)}</span>;
}

import type { PillarDeltas } from '../../../lib/diff';

function DeltaPillars({ deltas }: { deltas: PillarDeltas }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wide text-neutral-500">Pillar Δ</h3>
      <ul className="text-[11px] flex flex-col gap-1">
        {Object.entries(deltas).filter(([k])=>k!== 'overall').map(([k,v]) => <li key={k} className={deltaClass(v)}>{k}: {v >=0 ? '+' : ''}{v.toFixed(1)}</li>)}
      </ul>
    </div>
  );
}
interface IssueDiff { added: Issue[]; resolved: Issue[]; unchanged: Issue[] }
function IssueDiffSummary({ diff }: { diff: IssueDiff }) {
  const { added, resolved } = diff;
  return <span className="text-[10px] text-neutral-500">(+{resolved.length} resolved / {added.length} new)</span>;
}

function IssueChangeList({ diff }: { diff: IssueDiff }) {
  if (!diff.added.length && !diff.resolved.length) return null;
  return (
    <div className="flex flex-col gap-2 text-[11px]">
      {diff.resolved.length > 0 && <div className="text-emerald-400">Resolved: {diff.resolved.map(i=>i.id).join(', ')}</div>}
      {diff.added.length > 0 && <div className="text-rose-400">New: {diff.added.map(i=>i.id).join(', ')}</div>}
    </div>
  );
}
