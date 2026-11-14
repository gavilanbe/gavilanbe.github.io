// Capturas de la versión de bolsillo en tamaño de teléfono, para revisarla a ojo → dist/pocket/*.png
// Uso: node scripts/pocket-shot.mjs [escena…] [--w=390 --h=844] [--built]
// Escenas: title tv wall scroll insert swap shell term launch
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {serve} from './serve.mjs';
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), want = s => !args.length || args.includes(s);
const opt = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const W = +opt('w', 390), H = +opt('h', 844), {server, base, root} = await serve(), out = join(root, 'dist/pocket');
await mkdir(out, {recursive: true});
const browser = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: W, height: H}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => { window.__went = []; window.__g64Nav = u => window.__went.push(u); });
const shot = n => page.screenshot({path: join(out, n + '.png')}), wait = ms => page.waitForTimeout(ms);
await page.goto(base + (process.argv.includes('--built') ? '' : 'g64/') + '?pocket' + opt('hash', ''));
await page.waitForFunction(() => window.G64 && G64.room, null, {timeout: 40000});
await page.waitForFunction(() => !document.querySelector('#boot').classList.contains('wait'), null, {timeout: 10000});
if (want('title')) await shot('01-title');
await page.tap('#start'); await wait(600); if (want('title')) await shot('02-start');
await wait(3200); if (want('tv')) await shot('03-tv');
if (want('swap')) { await page.evaluate(() => G64.room.key(1)); for (const [i, t] of [140, 120, 140, 500, 1600].entries()) { await wait(t); await shot('04-swap-' + i); } }
if (want('shell')) { for (const n of ['tinta', 'mandarina', 'menta', 'lila']) { const p = await page.evaluate(() => { const c = G64.room.debug.con, v = c.userData.parts.select.getWorldPosition(new c.position.constructor()); return null; }); await page.evaluate(() => 0); await page.touchscreen.tap(W * .425, H * .58); await wait(700); await shot('05-shell-' + n); } }
if (want('wall') || want('scroll') || want('insert')) {
  await page.tap('[data-act="b"]'); await wait(1500); if (want('wall')) await shot('06-wall');
  if (want('scroll')) { await page.evaluate(() => { G64.room.debug.scroll = 3.1; }); await wait(600); await shot('07-scroll'); await page.evaluate(() => { G64.room.debug.scroll = G64.room.debug.max; }); await wait(600); await shot('07-scroll-end'); await page.evaluate(() => { G64.room.debug.scroll = .6; }); await wait(500); }
  if (want('insert')) { await page.touchscreen.tap(W * .72, H * .3); let t = 0; for (const [i, m] of [120, 330, 600, 900, 1150, 1330, 1420, 1520, 1800, 2400, 3300, 4600].entries()) { await wait(m - t); t = m; await shot(`08-insert-${String(i).padStart(2, '0')}`); } }
}
if (want('term')) { await page.evaluate(() => G64.select(G64.byName.get('bingo'))); await wait(2600); await shot('09-term'); }
if (want('launch')) { await page.evaluate(() => { G64.room.go('tv'); G64.select(G64.byName.get('ceba')); }); await wait(2800); await page.tap('[data-act="a"]'); for (const [i, t] of [300, 300, 250].entries()) { await wait(t); await shot('10-launch-' + i); } console.log('abre:', await page.evaluate(() => window.__went)); }
console.log(errors.length ? 'ERRORES:\n' + [...new Set(errors)].join('\n') : 'sin errores', '→', out);
await browser.close(); server.close();
