// Captura una pieza suelta del taller: node scripts/lab-shot.mjs handheld [yaw] [pitch] [d]
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
const [a = 'handheld', yaw = '0.3', pitch = '0.25', d = '1'] = process.argv.slice(2);
const {server, base} = await serve();
const b = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const p = await b.newPage({viewport: {width: 900, height: 1000}, deviceScaleFactor: 1});
p.on('pageerror', e => console.log('ERR', String(e))); p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
await p.goto(`${base}g64/lab.html?a=${a}&yaw=${yaw}&pitch=${pitch}&d=${d}`);
await p.waitForFunction(() => window.ready, null, {timeout: 20000}).catch(() => console.log('no ready'));
await p.screenshot({path: `dist/lab-${a}.png`});
await b.close(); server.close(); console.log(`dist/lab-${a}.png`);
