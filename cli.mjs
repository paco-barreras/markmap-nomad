#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = `Usage: markmap-nomad <input.md|input.yaml> [-o output.html]`;

function parseArgs(args) {
  let input;
  let output;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '-h' || argument === '--help') return;
    if (argument === '-o' || argument === '--output') {
      output = args[++index];
      if (!output) throw new Error(`${argument} requires a file path`);
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (input) {
      throw new Error('Provide one input file');
    } else {
      input = argument;
    }
  }

  if (!input) throw new Error('Provide an input file');
  const extension = extname(input).toLowerCase();
  const sourceType =
    extension === '.yaml' || extension === '.yml'
      ? 'yaml'
      : extension === '.md' || extension === '.markdown'
        ? 'markdown'
        : undefined;
  if (!sourceType) {
    throw new Error('Input must be Markdown (.md) or YAML (.yaml)');
  }

  return {
    input: resolve(input),
    output: resolve(
      output || join(dirname(input), `${basename(input, extension)}.html`),
    ),
    sourceType,
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    return '&gt;';
  });
}

function serializeForScript(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function createHtml({ title, source, sourceType, script, style }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
      html, body, #mindmap { width: 100%; height: 100%; margin: 0; }
      ${style}
    </style>
  </head>
  <body>
    <div id="mindmap"></div>
    <script>
${script.replaceAll('</script', '<\\/script')}
MarkmapNomad.createMindMap({ target: '#mindmap', ${sourceType}: ${serializeForScript(source)} })
  .catch((error) => {
    console.error(error);
    document.body.textContent = 'Unable to render mind map: ' + error.message;
  });
    </script>
  </body>
</html>
`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    console.log(usage);
    return;
  }

  const packageRoot = dirname(fileURLToPath(import.meta.url));
  const [source, script, style] = await Promise.all([
    readFile(options.input, 'utf8'),
    readFile(join(packageRoot, 'dist/index.iife.js'), 'utf8'),
    readFile(join(packageRoot, 'dist/style.css'), 'utf8'),
  ]);
  const title = basename(options.input, extname(options.input));
  const html = createHtml({ ...options, title, source, script, style });

  await mkdir(dirname(options.output), { recursive: true });
  await writeFile(options.output, html, 'utf8');
  console.log(options.output);
}

main().catch((error) => {
  console.error(`markmap-nomad: ${error.message}`);
  console.error(usage);
  process.exitCode = 1;
});
