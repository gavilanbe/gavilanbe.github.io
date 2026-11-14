// Capturas de escritorio de la habitación: node scripts/desk-shot.mjs [ancho] [alto] → dist/desk/
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {serve} from './serve.mjs';
const [W = '1440', H = '900'] = process.argv.slice(2), {server, base, root} = await serve(), out = join(root, 'dist/desk');
await mkdir(out, {recursive: true});
const b = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const p = await b.newPage({viewport: {width: +W, height: +H}});
p.on('pageerror', e => console.log('ERR', String(e)));
await p.goto(base + 'g64/?desktop'); await p.waitForFunction(() => window.G64 && G64.room, null, {timeout: 40000});
await p.waitForFunction(() => !document.querySelector('#boot').classList.contains('wait')); await p.keyboard.press('Enter'); await p.waitForTimeout(4000);
const shot = n => p.screenshot({path: join(out, `${W}-${n}.png`)});
await shot('1-hero');
await p.locator('.tabs button[data-go="wall"]').click(); await p.waitForTimeout(2200); await shot('2-wall');
await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1800); await shot('3-wall-left');
for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1800); await shot('4-wall-right');
await p.locator('.tabs button[data-go="tv"]').click(); await p.waitForTimeout(2000); await shot('5-tv');
await b.close(); server.close();
