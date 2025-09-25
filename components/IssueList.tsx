import { Issue } from '../types/report';

interface IssueListProps { issues: Issue[] }
export function IssueList({ issues }: IssueListProps) {
  if (!issues.length) return <p className="text-sm text-neutral-500">No issues detected 🎉</p>;
  return (
    <ol className="flex flex-col gap-4">
      {issues.slice(0, 20).map(issue => (
        <li key={issue.id} className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/40 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded bg-neutral-800 uppercase tracking-wide text-neutral-400">{issue.category}</span>
            <span className={`text-xs px-2 py-1 rounded ${sevColor(issue.severity)}`}>{issue.severity}</span>
            <span className="ml-auto text-xs text-neutral-500">+{issue.estScoreGain} est</span>
          </div>
          <h3 className="font-medium text-sm">{labelFromId(issue.id)}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">{issue.why}</p>
          <div className="text-xs text-sky-300 font-mono break-words">{issue.fix}</div>
        </li>
      ))}
    </ol>
  );
}

function sevColor(sev: string) {
  switch (sev) {
    case 'high': return 'bg-rose-600/30 text-rose-300';
    case 'medium': return 'bg-amber-600/30 text-amber-300';
    default: return 'bg-neutral-700/40 text-neutral-300';
  }
}
function labelFromId(id: string) {
  return id.replace(/[-_]/g, ' ');
}
