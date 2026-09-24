// Regresiones de gavilanbe POCKET (jsdom; la parte 3D se prueba en el navegador).
const {JSDOM, VirtualConsole} = require('jsdom');
const css = require('css-tree');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const ui = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

const cssErrors = [];
css.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1], {onParseError: e => cssErrors.push(e.message)});
assert.deepEqual(cssErrors, [], 'CSS sin errores');
JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);

function fixture({hash = '', storage = {}, width = 1440} = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Could not parse CSS/.test(e.message)) errors.push(e); });
  const dom = new JSDOM(html, {url: 'http://127.0.0.1:4173/' + hash, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc});
  const w = dom.window, d = w.document;
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem('pocket:' + k, JSON.stringify(v));
  w.matchMedia = q => ({matches: /max-width: 900px/.test(q) ? width <= 900 : false, addEventListener() {}, removeEventListener() {}});
  w.Element.prototype.scrollIntoView = () => {};
  const opened = [], copied = [];
  w.open = (...a) => { opened.push(a); return null; };
  Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: t => { copied.push(t); return Promise.resolve(); }}});
  w.eval(data + '\n;window.GAMES = GAMES;\n' + ui);
  return {dom, w, d, GB: w.GB, errors, opened, copied, GAMES: w.GAMES};
}
const key = (w, k, extra = {}) => w.document.dispatchEvent(new w.KeyboardEvent('keydown', {key: k, bubbles: true, cancelable: true, ...extra}));

// la colección
{
  const {d, w, GB, errors, GAMES} = fixture();
  const web = GAMES.filter(g => g.type === 'web'), term = GAMES.filter(g => g.type === 'terminal');
  assert.equal(d.querySelectorAll('#carts .item').length, web.length, 'un cartucho por juego web');
  assert.equal(d.querySelectorAll('#disks .ditem').length, term.length, 'un disquete por juego de terminal');
  assert.equal(new Set(GAMES.map(g => g.name)).size, GAMES.length, 'slugs únicos');
  const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  for (const g of GAMES) {
    assert.ok(fs.existsSync(path.join(root, g.thumb.split('?')[0])), `existe ${g.thumb}`);
    assert.ok(/^https:\/\/github\.com\/gavilanbe\//.test(g.repo), `repo: ${g.name}`);
    if (g.type === 'web') assert.ok(/^https:\/\//.test(g.play), `enlace de juego: ${g.name}`);
  }
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og.jpg', 'classic/index.html']) assert.ok(fs.existsSync(path.join(root, f)), `existe ${f}`);
  assert.equal(d.querySelectorAll('#chips .chip').length, new Set(GAMES.map(g => g.model)).size, 'una edición por modelo');
  assert.equal(d.querySelector('#h-count').textContent, String(GAMES.length));
  // arranca con el cartucho del día dentro y su ranura vacía
  assert.ok(GB.current && GB.current.type === 'web');
  assert.equal(d.querySelector('#now-title').textContent.includes(GB.current.label), true);
  assert.ok(d.querySelector(`.item[data-name="${GB.current.name}"]`).classList.contains('out'), 'el cartucho del día está fuera del estuche');
  assert.equal(d.querySelectorAll('.item.out, .ditem.out').length, 1);
  assert.ok(d.querySelector('#carts .item').querySelector('.stk-new') || !GAMES.find(g => g.name === d.querySelector('#carts .item').dataset.name).new, 'lo nuevo va primero');

  // búsqueda y filtros
  const q = d.querySelector('#q');
  const search = v => { q.value = v; q.dispatchEvent(new w.Event('input', {bubbles: true})); };
  const vis = () => [...d.querySelectorAll('#carts .item, #disks .ditem')].filter(x => !x.hidden).map(x => x.dataset.name);
  search('pokemon'); const a = vis(); assert.ok(a.length > 3);
  search('POKÉMON'); assert.deepEqual(vis(), a, 'sin tildes ni mayúsculas');
  search('pokemon terminal'); assert.ok(vis().length && vis().every(n => GAMES.find(g => g.name === n).type === 'terminal'), 'varias palabras');
  d.querySelector('#q-clear').click(); assert.equal(vis().length, GAMES.length);
  d.querySelector('.seg [data-type="terminal"]').click();
  assert.equal(d.querySelector('#sec-carts').hidden, true); assert.equal(d.querySelector('#sec-disks').hidden, false);
  d.querySelector('.seg [data-type="all"]').click();
  d.querySelector('.chip[data-e="fable"]').click();
  assert.ok(vis().every(n => GAMES.find(g => g.name === n).model === 'fable')); assert.equal(d.querySelector('.chip[data-e="fable"]').getAttribute('aria-pressed'), 'true');
  search('no-existe-este-juego'); assert.equal(d.querySelector('#empty').hidden, false);
  d.querySelector('#empty-reset').click(); assert.equal(vis().length, GAMES.length); assert.equal(GB.state.ed, null);
  assert.deepEqual(errors, []); w.close();
}

// meter cartuchos, jugar, disquetes, teclado
{
  const {d, w, GB, errors, opened, copied, GAMES} = fixture();
  const g = GAMES.find(x => x.name === 'invoca');
  d.querySelector('.item[data-name="invoca"] .cart').click();
  assert.equal(GB.current.name, 'invoca'); assert.equal(w.location.hash, '#/invoca');
  assert.ok(d.querySelector('.item[data-name="invoca"]').classList.contains('out'), 'sale del estuche');
  assert.equal(d.querySelectorAll('.item.out').length, 1, 'el anterior vuelve a su ranura');
  assert.equal(d.querySelector('#play').getAttribute('href'), g.play); assert.equal(d.querySelector('#play').getAttribute('rel'), 'noopener');
  assert.equal(d.querySelector('#now-cmd').hidden, true);
  // START desde el teclado abre el juego y lo marca
  key(w, 'Enter'); assert.equal(opened.length, 1); assert.equal(opened[0][0], g.play); assert.ok(opened[0][2].includes('noopener'));
  assert.ok(GB.played.has('invoca')); assert.equal(d.querySelector('.item[data-name="invoca"] .stk-done').hidden, false);
  assert.ok(JSON.parse(w.localStorage.getItem('pocket:played')).includes('invoca'));
  assert.match(d.querySelector('#prog-t').textContent, /^1 de /);
  // hojear
  key(w, 'ArrowRight'); assert.notEqual(GB.current.name, 'invoca'); key(w, 'ArrowLeft'); assert.equal(GB.current.name, 'invoca');
  d.querySelector('#next').click(); assert.notEqual(GB.current.name, 'invoca'); d.querySelector('#prev').click(); assert.equal(GB.current.name, 'invoca');
  // disquete
  const t = GAMES.find(x => x.type === 'terminal');
  d.querySelector(`.ditem[data-name="${t.name}"] .disk`).click();
  assert.equal(d.querySelector('#play').hidden, true); assert.equal(d.querySelector('#now-cmd').hidden, false);
  assert.ok(d.querySelector('#cmd-code').textContent.includes('git clone ' + t.repo));
  d.querySelector('#cmd-copy').click(); assert.ok(copied[0].startsWith('git clone ' + t.repo));
  key(w, 'Enter'); assert.equal(opened.length, 1, 'un disquete no abre pestañas');
  // sorpresa
  d.querySelector('#surprise').click(); assert.equal(GB.current.type, 'web');
  key(w, 'r'); assert.equal(GB.current.type, 'web');
  // atajo de búsqueda
  key(w, '/'); assert.equal(d.activeElement, d.querySelector('#q')); d.activeElement.blur();
  // color de la consola
  d.querySelector('#shells [data-shell="cereza"]').click();
  assert.equal(JSON.parse(w.localStorage.getItem('pocket:shell')), 'cereza');
  assert.equal(d.querySelector('#shells [data-shell="cereza"]').getAttribute('aria-pressed'), 'true');
  // Konami
  for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) key(w, k);
  assert.ok(d.querySelector('.toast'), 'edición dorada');
  assert.deepEqual(errors, []); w.close();
}

// móvil: la consola se abre a pantalla completa
{
  const {d, w, GB, errors} = fixture({width: 390});
  const player = d.querySelector('#player');
  assert.equal(player.classList.contains('deck'), false);
  d.querySelector('.item[data-name="chromara"] .cart').click();
  assert.ok(player.classList.contains('deck')); assert.ok(d.body.classList.contains('decked'));
  key(w, 'Escape'); assert.equal(player.classList.contains('deck'), false);
  assert.equal(GB.current.name, 'chromara');
  assert.deepEqual(errors, []); w.close();
}

// enlace directo y jugados guardados
{
  const {d, w, GB, errors} = fixture({hash: '#/wirefox', storage: {played: ['bitxo', 'no-existe'], shell: 'kiwi'}});
  assert.equal(GB.current.name, 'wirefox'); assert.ok(d.querySelector('.ditem[data-name="wirefox"]').classList.contains('out'));
  assert.equal(GB.played.size, 1, 'descarta juegos que ya no existen');
  assert.equal(d.querySelector('.item[data-name="bitxo"] .stk-done').hidden, false);
  assert.equal(GB.shell, 'kiwi');
  assert.deepEqual(errors, []); w.close();
}
console.log('PASS: estuche y cajón, miniaturas, ediciones, cartucho del día, búsqueda, filtros, meter cartuchos, START, jugados, hojear, disquetes, copiar, sorpresa, atajos, color de consola, Konami, móvil y enlaces directos.');
