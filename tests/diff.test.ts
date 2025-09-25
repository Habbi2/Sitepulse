import assert from 'node:assert/strict';
import { computePillarDeltas, diffIssues } from '../lib/diff';

const prev: any = {
  scores: { performance: 50, accessibility: 60, seo: 70, security: 40, ux: 55 },
  overall: 55,
  metrics: {},
  issues: [
    { id: 'missing-title', category: 'seo', severity: 'high', why:'', fix:'', impactScore:9, estScoreGain:10 },
    { id: 'missing-csp', category: 'security', severity: 'medium', why:'', fix:'', impactScore:6, estScoreGain:8 }
  ]
};
const now: any = {
  scores: { performance: 55, accessibility: 62, seo: 65, security: 50, ux: 60 },
  overall: 58,
  metrics: {},
  issues: [
    { id: 'missing-csp', category: 'security', severity: 'medium', why:'', fix:'', impactScore:6, estScoreGain:8 },
    { id: 'low-alt-coverage', category: 'accessibility', severity: 'medium', why:'', fix:'', impactScore:6, estScoreGain:12 }
  ]
};

const deltas = computePillarDeltas(now, prev);
assert.equal(deltas.performance, 5);
assert.equal(deltas.security, 10);

const { added, resolved, unchanged } = diffIssues(now.issues, prev.issues);
assert.ok(added.find(i => i.id === 'low-alt-coverage'));
assert.ok(resolved.find(i => i.id === 'missing-title'));
assert.ok(unchanged.find(i => i.id === 'missing-csp'));

console.log('diff.test.ts passed');
