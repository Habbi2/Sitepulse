#!/usr/bin/env node
import { execSync } from 'node:child_process';

const tests = [
  'tests/scoring.test.mjs',
  'tests/issues.test.mjs',
  'tests/diff.test.mjs',
  'tests/rate-limit.test.mjs'
];
let failed = 0;
for (const file of tests) {
  try {
    execSync(`node ${file}`, { stdio: 'inherit' });
  } catch (e) {
    failed++;
  }
}
if (failed) {
  console.error(`\n${failed} test file(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll test files passed.');
}
