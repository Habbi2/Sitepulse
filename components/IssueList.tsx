import { Issue } from '../types/report';
import { useState } from 'react';

interface IssueListProps { issues: Issue[]; initial?: number }
export function IssueList({ issues, initial = 8 }: IssueListProps) {
  if (!issues.length) return <p className="text-sm text-neutral-500">No issues detected 🎉</p>;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? issues : issues.slice(0, initial);
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-4" aria-label="Issue list">
        {visible.map(issue => {
          const accent = borderAccent(issue.severity);
          return (
            <li
              key={issue.id}
              className={`relative group border rounded-lg p-4 bg-neutral-900/50 flex flex-col gap-2 hb-card glass transition-colors focus-within:ring-2 focus-within:ring-sky-500/40 outline-none ${accent}`}
              tabIndex={0}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2 py-1 rounded bg-neutral-800 uppercase tracking-wide text-neutral-400 font-medium">{issue.category}</span>
                <span className={`text-[10px] px-2 py-1 rounded font-medium ${sevColor(issue.severity)}`}>{issue.severity}</span>
                <span className="ml-auto text-[10px] text-neutral-500">+{issue.estScoreGain} est</span>
              </div>
              <h3 className="font-medium text-sm gradient-text leading-snug">{labelFromId(issue.id)}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{issue.why}</p>
              <div className="text-[11px] text-sky-300 font-mono break-words select-text">{issue.fix}</div>
              <span className="absolute inset-0 rounded-lg pointer-events-none border border-neutral-800/60 group-hover:border-sky-500/40 transition-colors" />
            </li>
          );
        })}
      </ol>
      {issues.length > initial && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="self-start text-[11px] px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `Show all (${issues.length})`}
        </button>
      )}
    </div>
  );
}

function sevColor(sev: string) {
  switch (sev) {
    case 'high': return 'bg-rose-600/30 text-rose-300';
    case 'medium': return 'bg-amber-600/30 text-amber-300';
    default: return 'bg-neutral-700/40 text-neutral-300';
  }
}
function borderAccent(sev: string) {
  switch (sev) {
    case 'high': return 'border-rose-600/40';
    case 'medium': return 'border-amber-500/30';
    default: return 'border-neutral-800';
  }
}
function labelFromId(id: string) {
  return id.replace(/[-_]/g, ' ');
}
