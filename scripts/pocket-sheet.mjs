// Hoja de contactos con las capturas de dist/pocket: node scripts/pocket-sheet.mjs [prefijo] [columnas]
import {chromium} from 'playwright';
import {readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const dir = join(fileURLToPath(new URL('../', import.meta.url)), 'dist/pocket'), [pre = '', cols = '6'] = process.argv.slice(2);
const files = (await readdir(dir)).filter(f => f.endsWith('.png') && f.startsWith(pre) && !f.startsWith('sheet')).sort();
const b = await chromium.launch(), p = await b.newPage({viewport: {width: 260 * +cols, height: 100}});
const data = {}; for (const f of files) data[f] = (await readFile(join(dir, f))).toString('base64');
await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;font:11px monospace;color:#fff">${files.map(f => `<div><img src="data:image/png;base64,${data[f]}" style="width:100%;display:block">${f}</div>`).join('')}</body>`);
await p.waitForLoadState('networkidle'); await p.screenshot({path: join(dir, `sheet-${pre || 'all'}.png`), fullPage: true}); await b.close(); console.log(`dist/pocket/sheet-${pre || 'all'}.png`);
