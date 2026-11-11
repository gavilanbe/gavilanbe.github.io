// Prueba de humo en un navegador de verdad sobre la página publicada (index.html + lib/g64):
// título, START, coger un cartucho de la lista, buscar, y START abre el juego.
// Uso: npm run smoke   (con -- --shots deja capturas en dist/smoke/)
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, extname, normalize} from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'};
const server = createServer(async (req, res) => {
  try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, ''); if (p.endsWith('/')) p += 'index.html'; res.writeHead(200, {'content-type': MIME[extname(p)] || 'application/octet-stream'}); res.end(await readFile(join(root, p))); }
  catch { res.writeHead(404); res.end(); }
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
  await page.addInitScript(() => { window.__went = []; window.__g64Nav = u => window.__went.push(u); });
  await page.goto(base);
  await page.waitForFunction(() => window.G64 && G64.room, null, {timeout: 40000});
  await page.waitForFunction(() => !document.querySelector('#boot').classList.contains('wait'), null, {timeout: 10000});
  assert.equal(await page.evaluate(() => document.body.classList.contains('intro')), true, 'empieza en la pantalla de título');
  if (shots) await page.screenshot({path: join(shots, `${name}-1-titulo.png`)});
  mobile ? await page.tap('#start') : await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.body.classList.contains('intro'), null, {timeout: 5000});
  await page.waitForTimeout(4500);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'sin desbordes a lo ancho');
  const first = await page.evaluate(() => G64.current.name);
  if (shots) await page.screenshot({path: join(shots, `${name}-2-habitacion.png`)});

  // buscar y coger un cartucho de la lista
  await page.locator('#open-list').click();
  await page.locator('#q').fill('zzzz no existe');
  assert.equal(await page.locator('.none').count(), 1, 'aviso de búsqueda vacía');
  await page.locator('#q').fill('glup');
  assert.equal(await page.locator('.row').count(), 1, 'la búsqueda encuentra el juego');
  await page.locator('.row').click();
  await page.waitForTimeout(4200);
  assert.equal(await page.evaluate(() => G64.current.name), 'glup', 'el cartucho elegido está en la consola');
  assert.notEqual(first, 'glup');
  assert.equal(await page.evaluate(() => G64.room.station), 'tv', 'la cámara va a la tele');
  assert.equal(await page.evaluate(() => location.hash.slice(1)), 'glup', 'enlace directo al juego');
  if (mobile === false) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  if (shots) await page.screenshot({path: join(shots, `${name}-3-consola.png`)});

  // las vistas y START
  await page.locator('.tabs button[data-go="wall"]').click(); await page.waitForTimeout(1600);
  assert.equal(await page.evaluate(() => G64.room.station), 'wall');
  if (shots) await page.screenshot({path: join(shots, `${name}-4-coleccion.png`)});
  await page.locator('.tabs button[data-go="tv"]').click(); await page.waitForTimeout(1200);
  await page.locator('#play').click();
  await page.waitForFunction(() => window.__went.length > 0, null, {timeout: 6000});
  assert.match(await page.evaluate(() => window.__went[0]), /\/glup\//, 'START lleva al juego');

  assert.deepEqual(errors, [], `${name}: sin errores en consola`);
  assert.deepEqual(missing, [], `${name}: sin ficheros que falten`);
  await page.close();
  console.log(`✔ ${name}`);
}
await browser.close(); server.close();
