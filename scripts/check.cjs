// Regresiones de gavilanbe 64 sin navegador: datos, ficheros y coherencia entre piezas.
// La habitación 3D y la interacción se prueban en un navegador de verdad: npm run smoke.
const css = require('css-tree');
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f.split('?')[0]));

(async () => {
  const dev = read('g64/index.html'), html = read('index.html'), main = read('g64/main.js');
  const GAMES = new Function(read('data.js') + ';return GAMES')();
  const {EDITIONS, splitTitle} = await import(path.join(root, 'editions.js'));

  // CSS y JavaScript sin errores de sintaxis
  const cssErrors = [];
  css.parse(dev.match(/<style>([\s\S]*?)<\/style>/)[1], {onParseError: e => cssErrors.push(e.message)});
  assert.deepEqual(cssErrors, [], 'CSS sin errores');
  const sources = fs.readdirSync(path.join(root, 'g64')).filter(f => f.endsWith('.js'));
  for (const f of sources) await esbuild.transform(read('g64/' + f), {loader: 'js', format: 'esm'});

  // la colección
  assert.equal(new Set(GAMES.map(g => g.name)).size, GAMES.length, 'slugs únicos');
  for (const g of GAMES) {
    if (g.thumb) {                                // sin captura, la etiqueta se dibuja sola
      assert.ok(exists(g.thumb), `existe ${g.thumb}`);
      assert.ok(exists(`thumbs/s/${g.name}.webp`), `existe thumbs/s/${g.name}.webp (npm run thumbs)`);
    }
    assert.ok(/^https:\/\/github\.com\/gavilanbe\//.test(g.repo), `repo: ${g.name}`);
    assert.ok(['web', 'terminal'].includes(g.type), `tipo: ${g.name}`);
    if (g.type === 'web') assert.ok(/^https:\/\//.test(g.play), `enlace de juego: ${g.name}`);
    assert.ok(EDITIONS[g.model], `el modelo «${g.model}» de ${g.name} tiene edición en editions.js`);
    if (g.also) assert.ok(EDITIONS[g.also.model], `el segundo modelo de ${g.name} tiene edición`);
    assert.ok(g.title && g.tagline, `título y frase: ${g.name}`);
  }
  assert.ok(GAMES.filter(g => g.new).length <= 6, 'el NUEVO es solo para la última hornada');
  // la pared tiene sitio: seis filas por columna y como mucho lo que cabe en la pared del fondo
  const cols = Object.keys(EDITIONS).reduce((n, id) => n + Math.ceil(GAMES.filter(g => g.model === id).length / 6), 0);
  assert.ok(cols <= 17, `la colección cabe en la pared (${cols} columnas de 17): si no, hay que ampliar la estantería en g64/room.js`);

  const hex = /^#[0-9a-f]{6}$/i;
  for (const [id, e] of Object.entries(EDITIONS)) for (const k of ['plastic', 'studio', 'ink']) assert.ok(hex.test(e[k]), `${id}.${k}`);
  assert.deepEqual(splitTitle('🧅 CEBA'), {emoji: '🧅', label: 'CEBA', sub: '', full: 'CEBA'});
  assert.equal(splitTitle('🌱 SPROUT · y las 8 semillas').sub, 'y las 8 semillas');

  // la página y sus piezas
  const ids = [...dev.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  for (const [, id] of main.matchAll(/\$\('([\w-]+)'\)/g)) assert.ok(ids.includes(id), `g64/index.html tiene #${id}, que usa main.js`);
  for (const [, f] of [...html.matchAll(/url\((fonts\/[^)]+)\)/g), ...html.matchAll(/<link rel="(?:module)?preload" href="([^"]+)"/g), ...html.matchAll(/<script[^>]* src="([^"]+)"/g)]) assert.ok(exists(f), `existe ${f}`);
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og.jpg', 'classic/index.html', 'lib/g64/main.js']) assert.ok(exists(f), `existe ${f}`);
  assert.ok(!/\.\.\//.test(html.replace(/<style>[\s\S]*?<\/style>/, '')) && !/importmap/.test(html), 'el index de la raíz no depende de node_modules');
  // el paquete está al día con las fuentes (npm run bundle)
  const built = fs.statSync(path.join(root, 'lib/g64/main.js')).mtimeMs;
  for (const f of [...sources.map(f => 'g64/' + f), 'g64/index.html', 'editions.js']) assert.ok(fs.statSync(path.join(root, f)).mtimeMs <= built + 2000, `${f} es más nuevo que lib/g64: ejecuta npm run bundle`);

  console.log(`✔ ${GAMES.length} juegos, ${Object.keys(EDITIONS).length} ediciones, ${cols} columnas de pared: todo en su sitio.`);
})().catch(e => { console.error(e); process.exit(1); });
