// Regresiones de gavilanbe POCKET (jsdom; el plató 3D se prueba en el navegador).
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
assert.ok(fs.existsSync(path.join(root, 'pocket3d.js')), 'existe el plató 3D');

function fixture({hash = '', storage = {}} = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Could not parse CSS/.test(e.message)) errors.push(e); });
  const dom = new JSDOM(html, {url: 'http://127.0.0.1:4173/' + hash, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc});
  const w = dom.window, d = w.document;
  for (const [k, v] of Object.entries(storage)) w.localStorage.setItem('pocket:' + k, JSON.stringify(v));
  w.Element.prototype.scrollIntoView = () => {};
  const went = [], copied = [];
  w.__pocketNav = u => went.push(u);
  Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: t => { copied.push(t); return Promise.resolve(); }}});
  w.eval(data + '\n;window.GAMES = GAMES;\n' + ui);
  d.querySelector('#consola').getBoundingClientRect = () => ({top: 0, bottom: 900, left: 0, right: 1440, width: 1440, height: 900});
  return {dom, w, d, GB: w.GB, errors, went, copied, GAMES: w.GAMES};
}
const key = (w, k, extra = {}) => w.document.dispatchEvent(new w.KeyboardEvent('keydown', {key: k, bubbles: true, cancelable: true, ...extra}));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // colección, revista y álbum
  {
    const {d, w, GB, errors, GAMES} = fixture();
    const web = GAMES.filter(g => g.type === 'web'), term = GAMES.filter(g => g.type !== 'web');
    assert.equal(new Set(GAMES.map(g => g.name)).size, GAMES.length, 'slugs únicos');
    const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
    assert.equal(new Set(ids).size, ids.length, 'ids únicos');
    for (const g of GAMES) {
      assert.ok(fs.existsSync(path.join(root, g.thumb.split('?')[0])), `existe ${g.thumb}`);
      assert.ok(/^https:\/\/github\.com\/gavilanbe\//.test(g.repo), `repo: ${g.name}`);
      if (g.type === 'web') assert.ok(/^https:\/\//.test(g.play), `enlace de juego: ${g.name}`);
    }
    for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og.jpg', 'classic/index.html']) assert.ok(fs.existsSync(path.join(root, f)), `existe ${f}`);
    assert.equal(d.querySelectorAll('#bento-web .rv').length, web.length, 'una ficha por cartucho');
    assert.equal(d.querySelectorAll('#bento-term .rv').length, term.length, 'una ficha por disquete');
    assert.equal(d.querySelectorAll('#stickers .stk').length, GAMES.length, 'una pegatina por juego');
    assert.equal(d.querySelectorAll('#chips .chip').length, new Set(GAMES.map(g => g.model)).size);
    assert.equal(GB.lists.cart.length, web.length); assert.equal(GB.lists.disk.length, term.length);
    assert.ok(GB.lists.cart[0].new, 'lo nuevo va primero en la cinta');
    // arranca con un cartucho dentro y enfocado
    assert.ok(GB.st.inserted && GB.st.inserted.type === 'web');
    assert.equal(GB.lists.cart[GB.st.focus], GB.st.inserted);
    assert.ok(d.querySelector('#ptitle').textContent.includes(GB.st.inserted.label.split(' ')[0]));
    assert.equal(d.querySelector('#primary-t').textContent, 'Jugar ahora');
    assert.ok(d.querySelector('#ticker button'), 'cinta de novedades');
    // búsqueda y filtros de la revista
    const q = d.querySelector('#q');
    const search = v => { q.value = v; q.dispatchEvent(new w.Event('input', {bubbles: true})); };
    const vis = () => [...d.querySelectorAll('.rv')].filter(x => !x.hidden).map(x => x.dataset.name);
    search('pokemon'); const a = vis(); assert.ok(a.length > 3);
    search('POKÉMON'); assert.deepEqual(vis(), a, 'sin tildes ni mayúsculas');
    search('pokemon terminal'); assert.ok(vis().length && vis().every(n => GAMES.find(g => g.name === n).type === 'terminal'), 'varias palabras');
    d.querySelector('#q-clear').click(); assert.equal(vis().length, GAMES.length);
    d.querySelector('.seg [data-type="terminal"]').click(); assert.equal(d.querySelector('#sec-web').hidden, true);
    d.querySelector('.seg [data-type="all"]').click();
    d.querySelector('.chip[data-e="fable"]').click(); assert.ok(vis().every(n => GAMES.find(g => g.name === n).model === 'fable'));
    search('no-existe-este-juego'); assert.equal(d.querySelector('#empty').hidden, false);
    d.querySelector('#empty-reset').click(); assert.equal(vis().length, GAMES.length);
    assert.deepEqual(errors, []); w.close();
  }

  // la cinta, meter, START, disquetes, teclado
  {
    const {d, w, GB, errors, went, copied, GAMES} = fixture();
    const first = GB.st.inserted;
    d.querySelector('#next').click();
    const g = GB.lists.cart[GB.st.focus];
    assert.notEqual(g, first); assert.equal(d.querySelector('#primary-t').textContent, 'Meter en la consola');
    assert.ok(d.documentElement.style.getPropertyValue('--studio'), 'el plató toma el color de la edición');
    d.querySelector('#primary').click();
    assert.equal(GB.st.inserted, g); assert.equal(w.location.hash, '#/' + g.name);
    assert.equal(d.querySelector('#primary-t').textContent, 'Jugar ahora');
    assert.equal(d.querySelector('#newtab').getAttribute('href'), g.play);
    d.querySelector('#primary').click();
    assert.deepEqual(went, [g.play], 'START abre el juego');
    assert.ok(GB.played.has(g.name)); assert.ok(d.querySelector(`#stickers .stk.got`), 'pegatina conseguida');
    assert.equal(d.querySelector(`.rv[data-name="${g.name}"] .rv-done`).hidden, false);
    assert.ok(JSON.parse(w.localStorage.getItem('pocket:played')).includes(g.name));
    assert.equal(JSON.parse(w.localStorage.getItem('pocket:last')), g.name, 'recuerda el último cartucho');
    // teclado: flechas y Enter
    const f0 = GB.st.focus;
    key(w, 'ArrowRight'); assert.equal(GB.st.focus, (f0 + 1) % GB.lists.cart.length);
    key(w, 'ArrowLeft'); assert.equal(GB.st.focus, f0);
    key(w, 'ArrowLeft'); key(w, 'Enter'); assert.equal(GB.st.inserted, GB.lists.cart[GB.st.focus], 'Enter mete el cartucho');
    // disquetes
    d.querySelector('.modes [data-mode="disk"]').click();
    assert.equal(GB.st.mode, 'disk'); assert.equal(d.querySelector('#primary-t').textContent, 'Meter en el PC');
    const t = GB.lists.disk[GB.st.focus];
    d.querySelector('#primary').click(); assert.equal(GB.st.disk, t);
    assert.equal(d.querySelector('#pcmd').hidden, false); assert.ok(d.querySelector('#pcmd-code').textContent.includes('git clone ' + t.repo));
    d.querySelector('#primary').click(); await sleep(0);
    assert.ok(copied[0].startsWith('git clone ' + t.repo), 'copia el comando'); assert.equal(went.length, 1, 'un disquete no navega');
    // sorpresa: vuelve a los cartuchos
    d.querySelector('.modes [data-mode="cart"]').click();
    key(w, 'r'); assert.equal(GB.st.mode, 'cart'); assert.equal(GB.st.inserted.type, 'web');
    // revista y álbum meten el cartucho
    const inv = GAMES.find(x => x.name === 'invoca');
    d.querySelector('.rv[data-name="invoca"] h3 button').click(); await sleep(500);
    assert.equal(GB.st.inserted.name, inv.name);
    const bitxo = [...d.querySelectorAll('#stickers .stk')][GB.games.findIndex(x => x.name === 'bitxo')];
    bitxo.click(); await sleep(500); assert.equal(GB.st.inserted.name, 'bitxo');
    // atajos
    key(w, '/'); assert.equal(d.activeElement, d.querySelector('#q')); d.activeElement.blur();
    d.querySelector('#shells [data-shell="cereza"]').click(); assert.equal(JSON.parse(w.localStorage.getItem('pocket:shell')), 'cereza');
    key(w, 's'); assert.equal(JSON.parse(w.localStorage.getItem('pocket:shell')), 'kiwi', 'S cambia la carcasa');
    for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) key(w, k);
    assert.ok(d.querySelector('.toast').textContent.includes('dorada'), 'Konami');
    d.querySelector('#music').click(); assert.equal(d.querySelector('#music').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []); w.close();
  }

  // enlace directo a un disquete y continuar donde lo dejaste
  {
    const {GB, errors, w} = fixture({hash: '#/wirefox', storage: {played: ['bitxo', 'no-existe'], shell: 'uva'}});
    assert.equal(GB.st.mode, 'disk'); assert.equal(GB.st.disk.name, 'wirefox');
    assert.equal(GB.played.size, 1, 'descarta juegos que ya no existen'); assert.equal(GB.shell, 'uva');
    assert.deepEqual(errors, []); w.close();
  }
  {
    const {GB, errors, w, d} = fixture({storage: {last: 'chromara'}});
    assert.equal(GB.st.inserted.name, 'chromara'); assert.equal(GB.firstNote, 'Donde lo dejaste');
    assert.equal(d.querySelector('#pstate-t').textContent, 'Cartucho dentro');
    assert.deepEqual(errors, []); w.close();
  }
  console.log('PASS: colección, miniaturas, revista, búsqueda, filtros, álbum, cinta, meter, START, pegatinas, teclado, disquetes, copiar, sorpresa, atajos, carcasa, Konami, música, enlaces directos y continuar.');
})().catch(e => { console.error(e); process.exit(1); });
