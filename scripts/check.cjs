// Regresiones del observatorio: se ejecuta con `npm test` (jsdom, sin navegador).
const {JSDOM, VirtualConsole} = require('jsdom');
const css = require('css-tree');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

const cssErrors = [];
css.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1], {onParseError: e => cssErrors.push(e.message)});
assert.deepEqual(cssErrors, [], 'CSS sin errores');

function fixture({hash = '', storage = {}} = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Could not parse CSS|Not implemented: HTMLCanvasElement/.test(e.message)) errors.push(e); });
  const dom = new JSDOM(html, {url: 'http://127.0.0.1:4173/' + hash, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc});
  const w = dom.window, d = w.document;
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem('obs:' + k, JSON.stringify(v));
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.confirm = () => true;
  w.Element.prototype.scrollIntoView = () => {}; w.scrollTo = () => {};
  const copied = [];
  Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: t => { copied.push(t); return Promise.resolve(); }}});
  w.eval(data + '\n;window.GAMES = GAMES;\n' + source);
  return {dom, w, d, obs: w.__obs, errors, copied, GAMES: w.GAMES};
}
const key = (w, k, extra = {}) => w.document.dispatchEvent(new w.KeyboardEvent('keydown', {key: k, bubbles: true, cancelable: true, ...extra}));

// catálogo y datos
{
  const {d, w, obs, errors, GAMES} = fixture();
  const cards = d.querySelectorAll('#grid .card');
  assert.equal(cards.length, GAMES.length, 'una tarjeta por juego');
  assert.equal(new Set(GAMES.map(g => g.name)).size, GAMES.length, 'slugs únicos');
  const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  for (const g of GAMES) {
    assert.ok(fs.existsSync(path.join(root, g.thumb.split('?')[0])), `existe la miniatura ${g.thumb}`);
    assert.ok(/^https:\/\/github\.com\/gavilanbe\//.test(g.repo), `repo válido: ${g.name}`);
    if (g.type === 'web') assert.ok(/^https:\/\//.test(g.play), `enlace de juego: ${g.name}`);
  }
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og.jpg', 'classic/index.html']) assert.ok(fs.existsSync(path.join(root, f)), `existe ${f}`);
  const models = new Set(GAMES.map(g => g.model));
  assert.equal(d.querySelectorAll('.ccard').length, models.size, 'una carta por constelación');
  assert.equal(d.querySelectorAll('#legend button').length, models.size);
  assert.equal(d.querySelectorAll('#chips .chip').length, models.size);
  assert.ok(d.querySelector('#hero-count').textContent.length > 3, 'el número del titular va en letras');
  assert.ok(d.querySelector('#daily-title').textContent.length > 1, 'estrella del día');
  // web: botón Jugar; terminal: Código
  const web = GAMES.find(g => g.type === 'web'), term = GAMES.find(g => g.type === 'terminal');
  assert.equal(d.querySelector(`.card[data-name="${web.name}"] [data-play]`).getAttribute('href'), web.play);
  assert.equal(d.querySelector(`.card[data-name="${term.name}"] [data-play]`), null);
  assert.ok(GAMES.find(g => g.name === cards[0].dataset.name).new, 'las novas brillan primero');

  // búsqueda sin tildes y con varias palabras
  const q = d.querySelector('#q');
  const search = v => { q.value = v; q.dispatchEvent(new w.Event('input', {bubbles: true})); };
  const visible = () => [...d.querySelectorAll('#grid .card')].filter(c => !c.hidden).map(c => c.dataset.name);
  search('pokemon'); const a = visible(); assert.ok(a.length > 3);
  search('POKÉMON'); assert.deepEqual(visible(), a, 'búsqueda insensible a tildes y mayúsculas');
  search('pokemon terminal'); assert.ok(visible().length > 0 && visible().every(n => GAMES.find(g => g.name === n).type === 'terminal'), 'varias palabras');
  assert.equal(d.querySelector('#q-clear').hidden, false);
  d.querySelector('#q-clear').click(); assert.equal(q.value, ''); assert.equal(visible().length, GAMES.length);
  // tipo y constelación
  d.querySelector('.seg [data-type="terminal"]').click();
  assert.ok(visible().every(n => GAMES.find(g => g.name === n).type === 'terminal'));
  assert.equal(d.querySelector('.seg [data-type="terminal"]').getAttribute('aria-pressed'), 'true');
  d.querySelector('.chip[data-m="opus-4.8"]').click();
  assert.ok(visible().every(n => { const g = GAMES.find(x => x.name === n); return g.type === 'terminal' && g.model === 'opus-4.8'; }));
  assert.equal(d.querySelector('.chip[data-m="opus-4.8"]').getAttribute('aria-pressed'), 'true');
  search('no-existe-este-juego'); assert.equal(visible().length, 0); assert.equal(d.querySelector('#empty').hidden, false);
  d.querySelector('#empty-reset').click();
  assert.equal(visible().length, GAMES.length, 'despejar restablece todo'); assert.equal(obs.state.model, null); assert.equal(obs.state.type, 'all');
  // ordenar A→Z
  const sort = d.querySelector('#sort'); sort.value = 'az'; sort.dispatchEvent(new w.Event('change'));
  const labels = visible().map(n => obs.games.find(g => g.name === n).label);
  assert.deepEqual(labels, [...labels].sort((x, y) => x.localeCompare(y, 'es')), 'orden alfabético');
  // la carta de constelación filtra el catálogo
  d.querySelector('.ccard [data-act="list"]').click(); assert.ok(obs.state.model);
  assert.deepEqual(errors, []); w.close();
}

// ficha, teclado, bitácora y logros
{
  const {d, w, obs, errors, copied, GAMES} = fixture();
  const ficha = d.querySelector('#ficha');
  const btn = d.querySelector('#grid .card h3 button'); btn.focus(); btn.click();
  const name = btn.closest('.card').dataset.name, g = GAMES.find(x => x.name === name);
  assert.ok(ficha.classList.contains('open')); assert.equal(ficha.getAttribute('aria-hidden'), 'false');
  assert.ok(d.querySelector('#main').hasAttribute('inert'), 'el fondo queda inerte');
  assert.ok(d.querySelector('#f-title').textContent.includes(obs.current.label));
  assert.equal(w.location.hash, '#/' + name, 'enlace profundo');
  assert.equal(d.activeElement, d.querySelector('#f-close'));
  assert.ok(d.querySelector('#f-fig svg'), 'carta de localización');
  assert.ok(d.querySelector('.toast'), 'aviso de logro'); assert.ok(obs.log.feats.first);
  key(w, 'Tab', {shiftKey: true}); assert.ok(ficha.contains(d.activeElement), 'el foco no sale de la ficha');
  key(w, 'ArrowRight'); assert.notEqual(obs.current.name, name); key(w, 'ArrowLeft'); assert.equal(obs.current.name, name);
  assert.equal(g.type, 'web');
  const play = d.querySelector('#f-play'); assert.equal(play.getAttribute('href'), g.play); assert.equal(play.getAttribute('rel'), 'noopener');
  play.addEventListener('click', e => e.preventDefault());
  play.dispatchEvent(new w.MouseEvent('click', {bubbles: true, cancelable: true}));
  assert.ok(obs.log.played.has(name), 'queda jugado'); assert.ok(obs.log.feats.play);
  d.querySelector('#f-share').click(); assert.ok(copied[0].endsWith('#/' + name));
  key(w, 'Escape'); assert.equal(ficha.classList.contains('open'), false); assert.equal(d.activeElement, btn, 'el foco vuelve');
  assert.equal(d.querySelector('#main').hasAttribute('inert'), false); assert.equal(w.location.hash, '');
  assert.equal(d.querySelector(`.card[data-name="${name}"] .seen`).hidden, false, 'marca de jugado');
  // terminal: comando de instalación
  const t = GAMES.find(x => x.type === 'terminal'); obs.open(obs.games.find(x => x.name === t.name));
  assert.equal(d.querySelector('#f-play').hidden, true); assert.equal(d.querySelector('#f-term').hidden, false);
  assert.ok(d.querySelector('#f-cmd').textContent.includes('git clone ' + t.repo)); assert.ok(obs.log.feats.pulsar);
  d.querySelector('#f-copy').click(); assert.ok(copied[1].startsWith('git clone'));
  d.querySelector('.fbg').click(); assert.equal(ficha.classList.contains('open'), false, 'clic fuera cierra');
  // deseo (sin canvas abre directamente)
  d.querySelector('#wish').click(); assert.ok(ficha.classList.contains('open')); assert.equal(obs.current.type, 'web'); assert.ok(obs.log.feats.wish);
  key(w, 'Escape');
  key(w, '/'); assert.equal(d.activeElement, d.querySelector('#q'));
  d.activeElement.blur(); key(w, 'r'); assert.ok(ficha.classList.contains('open')); key(w, 'Escape');
  for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) key(w, k);
  assert.ok(obs.log.feats.konami, 'código Konami');
  assert.ok(JSON.parse(w.localStorage.getItem('obs:seen')).includes(name));
  assert.equal(d.querySelector('#ring-n').textContent, String(obs.log.seen.size));
  assert.ok(d.querySelectorAll('.feat.got').length >= 5);
  d.querySelector('#log-reset').click(); assert.equal(obs.log.seen.size, 0); assert.equal(d.querySelectorAll('.feat.got').length, 0);
  assert.deepEqual(errors, []); w.close();
}

// enlace profundo al cargar y bitácora guardada
{
  const {d, w, obs, errors} = fixture({hash: '#/invoca', storage: {played: ['invoca', 'no-existe'], seen: ['invoca']}});
  assert.ok(d.querySelector('#ficha').classList.contains('open')); assert.equal(obs.current.name, 'invoca');
  assert.equal(obs.log.played.size, 1, 'descarta juegos que ya no existen');
  assert.equal(d.querySelector('.card[data-name="invoca"] .seen').hidden, false);
  assert.deepEqual(errors, []); w.close();
}
console.log('PASS: catálogo, miniaturas, búsqueda con tildes y varias palabras, filtros, orden, cartas, ficha, foco, hojear, jugar, terminal, copiar, deseo, atajos, Konami, bitácora y enlaces profundos.');
