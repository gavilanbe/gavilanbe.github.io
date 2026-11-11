// Regresiones de gavilanbe POCKET sin navegador: datos, ficheros y coherencia entre piezas.
// El plató 3D y la interacción se prueban en el navegador: npm run smoke.
const css = require('css-tree');
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f.split('?')[0]));

(async () => {
  const html = read('index.html'), app = read('app.js'), stage = read('stage.js');
  const GAMES = new Function(read('data.js') + ';return GAMES')();
  const {EDITIONS, SHELLS, splitTitle} = await import(path.join(root, 'editions.js'));

  // CSS y JavaScript sin errores de sintaxis
  const cssErrors = [];
  css.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1], {onParseError: e => cssErrors.push(e.message)});
  assert.deepEqual(cssErrors, [], 'CSS sin errores');
  for (const f of ['app.js', 'stage.js', 'editions.js']) await esbuild.transform(read(f), {loader: 'js', format: 'esm'});

  // la colección
  assert.equal(new Set(GAMES.map(g => g.name)).size, GAMES.length, 'slugs únicos');
  const manifest = JSON.parse(read('carts/manifest.json'));
  for (const g of GAMES) {
    if (g.thumb) {                                // sin captura, la etiqueta se dibuja sola
      assert.ok(exists(g.thumb), `existe ${g.thumb}`);
      assert.ok(exists(`thumbs/s/${g.name}.webp`), `existe thumbs/s/${g.name}.webp (npm run thumbs)`);
    }
    assert.ok(exists(`carts/${g.name}.webp`) && manifest[g.name], `cartucho horneado de ${g.name} (npm run carts)`);
    assert.ok(/^https:\/\/github\.com\/gavilanbe\//.test(g.repo), `repo: ${g.name}`);
    assert.ok(['web', 'terminal'].includes(g.type), `tipo: ${g.name}`);
    if (g.type === 'web') assert.ok(/^https:\/\//.test(g.play), `enlace de juego: ${g.name}`);
    assert.ok(EDITIONS[g.model], `el modelo «${g.model}» de ${g.name} tiene edición en editions.js`);
    if (g.also) assert.ok(EDITIONS[g.also.model], `el segundo modelo de ${g.name} tiene edición`);
    assert.ok(g.title && g.tagline, `título y frase: ${g.name}`);
  }
  for (const k of Object.keys(manifest)) assert.ok(GAMES.some(g => g.name === k), `carts/manifest.json no tiene restos: ${k}`);
  const news = GAMES.filter(g => g.new);
  assert.ok(news.length <= 6, 'el NUEVO es solo para la última hornada');

  // ediciones y carcasas bien formadas
  const hex = /^#[0-9a-f]{6}$/i;
  for (const [id, e] of Object.entries(EDITIONS)) for (const k of ['plastic', 'studio', 'ink']) assert.ok(hex.test(e[k]), `${id}.${k}`);
  for (const s of SHELLS) for (const k of ['body', 'face', 'pad', 'ab']) assert.ok(hex.test(s[k]), `carcasa ${s.id}.${k}`);
  assert.deepEqual(splitTitle('🧅 CEBA'), {emoji: '🧅', label: 'CEBA', sub: '', full: 'CEBA'});
  assert.equal(splitTitle('🌱 SPROUT · y las 8 semillas').sub, 'y las 8 semillas');
  assert.equal(splitTitle('🎱 Bingo Español (90 bolas)').label, 'Bingo Español');
  assert.equal(splitTitle('Sin emoji').label, 'Sin emoji');

  // la página y sus piezas
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  const made = [...app.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);   // los que app.js crea él mismo
  for (const [, id] of app.matchAll(/\$\('#([\w-]+)'/g)) assert.ok(ids.includes(id) || made.includes(id), `index.html tiene #${id}, que usa app.js`);
  for (const [, f] of [...html.matchAll(/url\((fonts\/[^)]+)\)/g), ...html.matchAll(/<link rel="(?:module)?preload" href="([^"]+)"/g), ...html.matchAll(/<script[^>]* src="([^"]+)"/g)]) assert.ok(exists(f), `existe ${f}`);
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og.jpg', 'classic/index.html', 'scripts/bake.html']) assert.ok(exists(f), `existe ${f}`);

  // three.js empaquetado en casa (lib/): exporta todo lo que usa el plató (si no, `npm run vendor`)
  const vendor = read('lib/three.pocket.js');
  const exported = new Set([...vendor.matchAll(/export\s*\{([^}]*)\}/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop())));
  const used = new Set([...stage.matchAll(/\bTHREE\.([A-Za-z_]\w*)/g)].map(m => m[1]).concat([...stage.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/lib\/three\.pocket\.js'/g)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean))));
  assert.deepEqual([...used].filter(n => !exported.has(n)), [], 'lib/three.pocket.js exporta lo que usa stage.js (npm run vendor)');

  console.log(`✔ ${GAMES.length} juegos, ${Object.keys(EDITIONS).length} ediciones: todo en su sitio.`);
})().catch(e => { console.error(e); process.exit(1); });
