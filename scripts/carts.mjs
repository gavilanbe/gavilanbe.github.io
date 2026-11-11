// Hornea los cartuchos del catálogo: carts/<slug>.webp, un render 3D de cada uno con su etiqueta
// (el mismo modelo y la misma luz que el plató, stage.js). Solo rehace los que han cambiado.
// Uso: npm run carts            (los nuevos o cambiados)
//      npm run carts -- --all   (todos; hace falta si cambia el modelo 3D o la etiqueta)
//      npm run carts -- ceba glup
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join, extname, normalize} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'};
const server = createServer(async (req, res) => {
  try {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const body = await readFile(join(root, p));
    res.writeHead(200, {'content-type': MIME[extname(p)] || 'application/octet-stream'}); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const args = process.argv.slice(2), all = args.includes('--all'), only = args.filter(a => !a.startsWith('--'));
const GAMES = new Function(await readFile(join(root, 'data.js'), 'utf8') + ';return GAMES')();
const out = join(root, 'carts'), manifestPath = join(out, 'manifest.json');
await mkdir(out, {recursive: true});
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
const editions = await readFile(join(root, 'editions.js'), 'utf8');
const sig = async g => createHash('sha1').update(JSON.stringify([g.title, g.model, g.also || null, g.type, !!g.new, !!g.wip])).update(editions).update(await readFile(join(root, g.thumb)).catch(() => '')).digest('hex').slice(0, 12);

const todo = [];
for (const g of GAMES) { const s = await sig(g); if (only.length ? only.includes(g.name) : all || manifest[g.name] !== s) todo.push([g, s]); }
if (!todo.length) { console.log('Cartuchos al día.'); server.close(); process.exit(0); }

const browser = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']});
const page = await browser.newPage();
page.on('pageerror', e => { console.error(String(e)); process.exitCode = 1; });
await page.goto(base + '/scripts/bake.html');
await page.waitForFunction('window.ready', null, {timeout: 60000});
for (const [g, s] of todo) {
  const url = await page.evaluate(n => window.bake(n), g.name);
  await writeFile(join(out, g.name + '.webp'), Buffer.from(url.split(',')[1], 'base64'));
  manifest[g.name] = s;
  process.stdout.write('.');
}
for (const k of Object.keys(manifest)) if (!GAMES.some(g => g.name === k)) delete manifest[k];
await writeFile(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
await browser.close(); server.close();
console.log(`\n${todo.length} cartuchos horneados en carts/.`);
