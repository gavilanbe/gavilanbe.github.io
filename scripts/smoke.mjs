// Prueba de humo en un navegador de verdad: carga la página, mete un cartucho, filtra, busca y pulsa START.
// Uso: npm run smoke   (deja capturas en dist/smoke/ con --shots)
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, extname, normalize} from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'};
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    if (p.endsWith('/')) p += 'index.html';
    res.writeHead(200, {'content-type': MIME[extname(p)] || 'application/octet-stream'}); res.end(await readFile(join(root, p)));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const shots = process.argv.includes('--shots') ? join(root, 'dist/smoke') : null;
if (shots) await mkdir(shots, {recursive: true});
const browser = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']});

for (const [name, viewport, mobile] of [['escritorio', {width: 1440, height: 900}, false], ['movil', {width: 390, height: 844}, true]]) {
  const page = await browser.newPage({viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1});
  const errors = [], missing = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
  await page.addInitScript(() => { window.__went = []; window.__pocketNav = u => window.__went.push(u); });
  await page.goto(base);
  await page.waitForFunction(() => window.POCKET && window.POCKET.stage, null, {timeout: 30000});
  await page.waitForTimeout(2600);
  const n = await page.evaluate(() => GAMES.length);
  assert.equal(await page.locator('.cart').count(), n, 'un cartucho por juego');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'sin desbordes a lo ancho');
  assert.equal(await page.locator('.cart.out').count(), 1, 'el cartucho de la consola deja su hueco');
  if (shots) await page.screenshot({path: join(shots, `${name}-1-portada.png`)});

  // meter un cartucho desde el catálogo
  const first = await page.evaluate(() => POCKET.current.name);
  const target = await page.evaluate(() => POCKET.games.find(g => g.web && g !== POCKET.current && g.model === 'fable').name);
  const cell = page.locator(`.cart[data-name="${target}"]`);
  await cell.scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
  mobile ? await cell.tap() : await cell.click();
  await page.waitForFunction(() => !POCKET.stage.busy, null, {timeout: 8000});
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(() => POCKET.current.name), target, 'el cartucho elegido está en la consola');
  assert.equal(await page.evaluate(() => POCKET.stage.game.name), target, 'y el plató lo tiene dentro');
  assert.equal(await page.locator(`.cart[data-name="${first}"].out`).count(), 0, 'el anterior vuelve a su sitio');
  assert.equal(await page.evaluate(() => location.hash.slice(1)), target, 'enlace directo al juego');
  if (shots) await page.screenshot({path: join(shots, `${name}-2-dentro.png`)});

  // START abre el juego
  await page.locator('#play').click();
  await page.waitForFunction(() => window.__went.length > 0, null, {timeout: 6000});
  assert.match(await page.evaluate(() => window.__went[0]), new RegExp(`/${target}/`), 'START lleva al juego');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})));
  if (mobile) await page.locator('#sheet-x').tap();
  await page.waitForTimeout(500);

  // filtros y búsqueda
  await page.locator('.chip[data-ed="opus-4.6"]').click();
  const want = await page.evaluate(() => GAMES.filter(g => g.model === 'opus-4.6' || (g.also && g.also.model === 'opus-4.6')).length);
  assert.equal(await page.locator('.cart:not([hidden])').count(), want, 'filtro por modelo');
  await page.locator('.chip[data-ed="all"]').click();
  await page.locator('#q').fill('zzzz no existe');
  assert.equal(await page.locator('#empty').isVisible(), true, 'aviso de búsqueda vacía');
  await page.locator('#q').fill('terminal');
  assert.ok(await page.locator('.cart:not([hidden])').count() >= await page.evaluate(() => GAMES.filter(g => g.type !== 'web').length), 'buscar «terminal»');
  await page.locator('#q').fill('');

  assert.deepEqual(errors, [], `${name}: sin errores en consola`);
  assert.deepEqual(missing, [], `${name}: sin ficheros que falten`);
  await page.close();
  console.log(`✔ ${name}`);
}
await browser.close(); server.close();
