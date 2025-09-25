import type { Report, Issue, PillarScores } from '../types/report';

export interface PillarDeltas extends Partial<PillarScores> {
  performance: number;
  accessibility: number;
  seo: number;
  security: number;
  ux: number;
  overall: number;
}

export function computePillarDeltas(now: Report, prev: Report): PillarDeltas {
  return {
    performance: round(now.scores.performance - prev.scores.performance),
    accessibility: round(now.scores.accessibility - prev.scores.accessibility),
    seo: round(now.scores.seo - prev.scores.seo),
    security: round(now.scores.security - prev.scores.security),
    ux: round(now.scores.ux - prev.scores.ux),
    overall: round(now.overall - prev.overall)
  };
}

export interface IssueDiff { added: Issue[]; resolved: Issue[]; unchanged: Issue[] }

export function diffIssues(now: Issue[], prev: Issue[]): IssueDiff {
  const prevMap = new Map(prev.map(i => [i.id, i]));
  const added: Issue[] = [];
  const unchanged: Issue[] = [];
  for (const i of now) {
    if (!prevMap.has(i.id)) added.push(i); else unchanged.push(i);
  }
  const nowIds = new Set(now.map(i=>i.id));
  const resolved = prev.filter(i => !nowIds.has(i.id));
  return { added, resolved, unchanged };
}

export function deltaClass(delta: number) {
  if (delta > 0.5) return 'text-emerald-400';
  if (delta < -0.5) return 'text-rose-400';
  return 'text-neutral-400';
}

function round(v: number) { return Math.round(v * 10) / 10; }
