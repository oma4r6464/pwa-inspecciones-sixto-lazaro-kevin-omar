import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['src', 'tests', 'scripts', 'docs', '.github/workflows'];
const files = ['README.md', 'package.json', 'playwright.config.ts'];
const secretPatterns = [/AKIA[0-9A-Z]{16}/, /gh[pousr]_[A-Za-z0-9_]{20,}/, /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/, /sk-[A-Za-z0-9]{20,}/];
const conflictMarkers = [/^<<<<<<< /m, /^=======$/m, /^>>>>>>> /m];

function collect(directory) {
  const absolute = join(root, directory);
  if (!statSync(absolute, { throwIfNoEntry: false })) return;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) collect(relative(root, path));
    else files.push(relative(root, path));
  }
}

for (const directory of roots) collect(directory);
const uniqueFiles = [...new Set(files)];
const failures = [];
for (const file of uniqueFiles) {
  const content = readFileSync(join(root, file), 'utf8');
  if (conflictMarkers.some((pattern) => pattern.test(content))) failures.push(`${file}: conflict marker`);
  if (secretPatterns.some((pattern) => pattern.test(content))) failures.push(`${file}: possible secret`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Lint estructural: PASS (${uniqueFiles.length} archivos revisados)`);
}
