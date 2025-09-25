import assert from 'node:assert/strict';
import { takeToken } from '../lib/rate-limit';

const KEY = 'test-key';
let okCount = 0;
for (let i=0;i<10;i++) {
  const r = takeToken(KEY);
  if (r.ok) okCount++; else { break; }
}
assert.ok(okCount <= 8, 'should not allow more than CAP tokens initially');

console.log('rate-limit.test.ts passed');
