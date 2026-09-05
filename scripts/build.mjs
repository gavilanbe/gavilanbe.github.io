import {readFile, mkdir, cp, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {Script} from 'node:vm';

// Optional static packaging; index.html still works without a build step.
const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(join(root, 'index.html'), 'utf8');
for (const [i, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
  if (match[1].trim()) new Script(match[1], {filename: `inline-${i}.js`});
}
new Script(await readFile(join(root, 'data.js'), 'utf8'), {filename: 'data.js'});
const output = join(root, 'dist');
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const name of ['index.html', 'data.js', 'thumbs', 'assets', 'apple-touch-icon.png']) {
  await cp(join(root, name), join(output, name), {recursive: true});
}
console.log('Static site validated and packaged in dist/.');
