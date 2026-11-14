// Qué pesa en la escena: triángulos y mallas por pieza. Uso: node scripts/audit.mjs [pocket|desk]
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
const mode = process.argv[2] === 'desk' ? 'desk' : 'pocket';
const {server, base} = await serve();
const browser = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: mode === 'desk' ? {width: 1440, height: 900} : {width: 390, height: 844}});
await page.goto(base + 'g64/?' + (mode === 'pocket' ? 'pocket' : 'desktop'));
await page.waitForFunction(() => window.G64 && G64.room, null, {timeout: 40000});
const r = await page.evaluate(() => {
  const sc = G64.room.debug.scene, rows = []; let total = 0, meshes = 0, casters = 0, castTris = 0;
  const tris = o => { const g = o.geometry; return g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0; };
  sc.traverse(o => { if (!o.isMesh && !o.isPoints) return; const t = tris(o); total += t; meshes++; if (o.castShadow) { casters++; castTris += t; }
    let p = o, path = []; while (p && p !== sc) { path.unshift(p.name || p.type[0]); p = p.parent; }
    rows.push([t | 0, o.material.type.replace('Mesh', '').replace('Material', ''), o.castShadow ? 'S' : '-', path.join('/'), o.geometry.uuid.slice(0, 4)]); });
  rows.sort((a, b) => b[0] - a[0]);
  const byGeo = {}; for (const r of rows) { const k = r[4]; byGeo[k] = byGeo[k] || [0, 0, r[0], r[1], r[3]]; byGeo[k][0] += r[0]; byGeo[k][1]++; }
  return {total, meshes, casters, castTris, top: Object.values(byGeo).sort((a, b) => b[0] - a[0]).slice(0, 28)};
});
console.log(mode, 'triángulos', r.total | 0, 'mallas', r.meshes, 'con sombra', r.casters, 'tri con sombra', r.castTris | 0);
for (const t of r.top) console.log(String(t[0]).padStart(8), 'x' + String(t[1]).padEnd(3), String(t[2]).padStart(7), t[3].padEnd(9), t[4]);
await browser.close(); server.close();
