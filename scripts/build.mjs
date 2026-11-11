import { readFile, mkdir, writeFile, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['worker/api.js', 'worker/ui.js', 'worker/index.js'];
const source = [];
for (const file of files) {
  let text = await readFile(root + file, 'utf8');
  // Dependency-free modules are combined into one portable Worker ES module.
  if (file === 'worker/index.js') text = text.replace(/^import .* from '\.\/(ui|api)\.js';\r?\n/gm, '');
  source.push('// Source: ' + file + '\n' + text);
}
await rm(root + 'dist', { recursive: true, force: true });
await mkdir(root + 'dist/server', { recursive: true });
await mkdir(root + 'dist/.openai', { recursive: true });
await writeFile(root + 'dist/server/index.js', source.join('\n\n'));
await copyFile(root + '.openai/hosting.json', root + 'dist/.openai/hosting.json');
console.log('Built portable ScopePay Worker.');
