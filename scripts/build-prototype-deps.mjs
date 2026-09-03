import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const builds = [
  ['markmap-common'],
  ['markmap-html-parser'],
  ['markmap-view', 'es'],
  ['markmap-lib', 'browserEs'],
];

for (const [name, target] of builds) {
  const cwd = resolve(root, 'packages', name);
  const typeResult = spawnSync(process.execPath, [tsc], {
    cwd,
    stdio: 'inherit',
  });
  if (typeResult.error) throw typeResult.error;
  if (typeResult.status !== 0) process.exit(typeResult.status ?? 1);

  const env = { ...process.env };
  if (target) env.TARGET = target;
  else delete env.TARGET;
  const result = spawnSync(process.execPath, [vite, 'build'], {
    cwd,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
