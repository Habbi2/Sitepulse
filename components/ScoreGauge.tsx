interface ScoreGaugeProps { value: number; label?: string; }
export function ScoreGauge({ value, label = 'Overall' }: ScoreGaugeProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (normalized / 100) * circumference;
  const color = normalized >= 80 ? 'stroke-emerald-400' : normalized >= 60 ? 'stroke-sky-400' : normalized >= 40 ? 'stroke-amber-400' : 'stroke-rose-500';
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={110} height={110} className="rotate-[-90deg]">
        <circle cx={55} cy={55} r={42} className="stroke-neutral-800" strokeWidth={10} fill="none" />
        <circle cx={55} cy={55} r={42} className={`${color} transition-[stroke-dashoffset] duration-500`} strokeWidth={10} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="text-xl font-semibold tabular-nums">{normalized.toFixed(1)}</div>
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
    </div>
  );
}
