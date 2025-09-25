import type { PillarScores } from '../types/report';

interface PillarBarsProps { scores: PillarScores }
export function PillarBars({ scores }: PillarBarsProps) {
  const entries: [keyof PillarScores, number][] = [
    ['performance', scores.performance],
    ['accessibility', scores.accessibility],
    ['seo', scores.seo],
    ['security', scores.security],
    ['ux', scores.ux]
  ];
  return (
    <div className="grid gap-3">
      {entries.map(([k,v]) => {
        const color = v >= 80 ? 'bg-emerald-500/70' : v >= 60 ? 'bg-sky-500/70' : v >= 40 ? 'bg-amber-500/70' : 'bg-rose-600/70';
        return (
          <div key={k} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs uppercase tracking-wide text-neutral-400"><span>{k}</span><span>{v.toFixed(1)}</span></div>
            <div className="h-2 rounded bg-neutral-800 overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
