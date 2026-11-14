// Mide el rendimiento sin límite de fotogramas y caza fotogramas negros.
// Uso: node scripts/perf.mjs [pocket|desk] [--cpu=4] [--w= --h= --dpr=]
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
const mode = process.argv[2] === 'desk' ? 'desk' : 'pocket';
const opt = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const W = +opt('w', mode === 'desk' ? 1440 : 390), H = +opt('h', mode === 'desk' ? 900 : 844), DPR = +opt('dpr', mode === 'desk' ? 2 : 3), CPU = +opt('cpu', 1);
const {server, base} = await serve();
const browser = await chromium.launch({args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit']});
const page = await browser.newPage({viewport: {width: W, height: H}, isMobile: mode === 'pocket', hasTouch: mode === 'pocket', deviceScaleFactor: DPR});
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => {
  window.__went = []; window.__g64Nav = u => window.__went.push(u);
  // tras cada fotograma lee unos píxeles del lienzo: si la media cae en picado, es un parpadeo
  const P = window.__perf = {n: 0, t0: 0, worst: 0, black: [], shots: [], lum: 0, probe: false, long: 0};
  const raf = window.requestAnimationFrame.bind(window); let prev = 0, gl = null, px = new Uint8Array(4);
  window.requestAnimationFrame = cb => raf(t => {
    const a = performance.now(); if (window.G64 && G64.room) { const i = G64.room.debug.renderer.info; i.autoReset = false; P.calls = i.render.calls; P.tris = i.render.triangles; i.reset(); } cb(t); if (P.sync && window.G64 && G64.room) { gl = gl || G64.room.debug.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } const b = performance.now();
    P.n++; if (prev) { const d = a - prev; if (d > P.worst) P.worst = d; if (d > 34) P.long++; } prev = a; P.cpu = (P.cpu || 0) + (b - a);
    if (P.probe && window.G64 && G64.room) { gl = gl || G64.room.debug.renderer.getContext(); let s = 0; const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      for (let i = 0; i < 9; i++) { gl.readPixels((w * (.2 + .3 * (i % 3))) | 0, (h * (.2 + .3 * ((i / 3) | 0))) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); s += px[0] + px[1] + px[2]; }
      s /= 27; if (P.lum > 14 && s < P.lum * .35) { P.black.push([P.n, P.lum | 0, s | 0, G64.room.station, +(b - a).toFixed(1)]); if (P.shots.length < 4) P.shots.push(G64.room.debug.renderer.domElement.toDataURL('image/jpeg', .7)); } P.lum = s; }
  });
});
if (CPU > 1) { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', {rate: CPU}); }
const T0 = Date.now(); await page.addInitScript(() => { window.__long = []; new PerformanceObserver(l => { for (const e of l.getEntries()) __long.push([e.startTime | 0, e.duration | 0]); }).observe({entryTypes: ['longtask']}); });
await page.goto(base + 'g64/?' + (mode === 'pocket' ? 'pocket' : 'desktop'));
await page.waitForFunction(() => window.G64 && G64.room, null, {timeout: 40000});
await page.waitForFunction(() => !document.querySelector('#boot').classList.contains('wait'), null, {timeout: 10000});
const wait = ms => page.waitForTimeout(ms);
console.log('carga', Date.now() - T0, 'ms; tareas largas:', JSON.stringify(await page.evaluate(() => __long)));
await page.evaluate(() => { __perf.sync = true; });
const measure = async (tag, ms = 2500, during) => {
  await page.evaluate(tag => { const P = __perf; P.n = 0; P.worst = 0; P.long = 0; P.cpu = 0; P.tag = tag; P.t0 = performance.now(); }, tag);
  if (during) await during(); await wait(ms);
  const r = await page.evaluate(() => { const P = __perf, d = performance.now() - P.t0, i = G64.room.debug.renderer.info; return {fps: P.n / d * 1000, cpu: P.cpu / P.n, worst: P.worst, long: P.long, calls: P.calls, tris: P.tris, tex: i.memory.textures, geo: i.memory.geometries, prog: i.programs.length, buf: [G64.room.debug.renderer.getContext().drawingBufferWidth, G64.room.debug.renderer.getContext().drawingBufferHeight]}; });
  console.log(tag.padEnd(10), `${r.fps.toFixed(0).padStart(4)} fps  coste ${r.cpu.toFixed(2)} ms  peor ${r.worst.toFixed(0)} ms  largos ${r.long}  llamadas ${r.calls}  tri ${r.tris}  tex ${r.tex}  prog ${r.prog}  ${r.buf.join('×')}`);
};
const probe = v => page.evaluate(v => { __perf.probe = v; __perf.lum = 0; }, v);
console.log(`${mode} ${W}×${H} @${DPR}  cpu÷${CPU}`);
await wait(1500); await measure('titulo');
await (mode === 'pocket' ? page.tap('#start') : page.click('#start')); await wait(3500); await measure('consola');
await page.evaluate(() => G64.room.go('wall')); await wait(1800); await measure('catalogo');
if (mode === 'pocket') await measure('scroll', 2500, () => page.evaluate(() => { let v = .3; const id = setInterval(() => { G64.room.debug.scroll = v; v += .05; if (v > 6) clearInterval(id); }, 16); }));
await measure('insertar', 4500, () => page.evaluate(() => G64.select(G64.byName.get('ceba'))));
// segunda pasada con la sonda de parpadeos (leer píxeles frena, por eso va aparte)
console.log('tareas largas después:', JSON.stringify(await page.evaluate(() => __long.filter(l => l[1] > 60)))); if (process.argv.includes('--noprobe')) { await browser.close(); server.close(); process.exit(0); }
await probe(true);
await page.evaluate(() => G64.room.go('wall')); await wait(1500);
if (mode === 'pocket') { await page.evaluate(() => { let v = .3; const id = setInterval(() => { G64.room.debug.scroll = v; v += .05; if (v > 6) clearInterval(id); }, 16); }); await wait(2500); }
await page.evaluate(() => G64.select(G64.byName.get('makinamon'))); await wait(5000);
await page.evaluate(() => G64.room.key(1)); await wait(2500); await page.evaluate(() => G64.room.go('wall')); await wait(1500); await page.evaluate(() => G64.room.go('tv')); await wait(1500);
const blacks = await page.evaluate(() => __perf.black);
console.log('parpadeos:', blacks.length, JSON.stringify(blacks.slice(0, 12)));
const shots = await page.evaluate(() => __perf.shots); const {writeFile, mkdir} = await import('node:fs/promises'); await mkdir('dist/perf', {recursive: true}); for (const [i, d] of shots.entries()) await writeFile(`dist/perf/${mode}-negro-${i}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
console.log(errors.length ? 'ERRORES:\n' + [...new Set(errors)].join('\n') : 'sin errores');
await browser.close(); server.close();
