// Dynamic test discovery & execution for *.test.ts files using native ESM dynamic imports.
// Keeps harness minimal while avoiding manual import maintenance.
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testDir = __dirname; // tests directory
const entries = readdirSync(testDir);
const testFiles = entries
	.filter(f => /\.test\.ts$/.test(f) && f !== 'run-all.ts')
	.sort();

if (testFiles.length === 0) {
	console.warn('No test files found.');
}

let passCount = 0;
let failCount = 0;

for (const file of testFiles) {
	const url = pathToFileURL(join(testDir, file)).href;
	try {
		await import(url);
		passCount++;
		console.log(`✔ ${file}`);
	} catch (err) {
		failCount++;
		console.error(`✖ ${file}`);
		console.error(err);
	}
}

console.log(`\nTest files: ${testFiles.length}, Passed: ${passCount}, Failed: ${failCount}`);
if (failCount > 0) {
	process.exitCode = 1;
}
