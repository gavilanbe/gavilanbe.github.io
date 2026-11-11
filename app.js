// gavilanbe POCKET · el catálogo. La página funciona sola (lista, filtros, enlaces);
// el plató 3D (stage.js) se carga después y, si no hay WebGL, queda la foto del cartucho.
import {EDITIONS, edition, SHELLS, splitTitle} from './editions.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mq = q => !!(window.matchMedia && matchMedia(q).matches);
const REDUCE = mq('(prefers-reduced-motion: reduce)');
const isMobile = () => mq('(max-width: 920px)');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const store = {
  get(k, d) { try { const v = localStorage.getItem('pocket:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pocket:' + k, JSON.stringify(v)); } catch {} },
};
const go = u => (window.__pocketNav || (x => location.assign(x)))(u);

// ── la colección ────────────────────────────────────
const edIds = Object.keys(EDITIONS);
const games = GAMES.map(g => {
  const t = splitTitle(g.title), ed = edition(g.model || 'opus-4.6');
  return {...g, ...t, ed, web: g.type === 'web', thumbS: (g.thumb || '').replace(/^thumbs\/([^/?]+)\.\w+/, 'thumbs/s/$1.webp'), sprite: `carts/${g.name}.webp`,
    clone: `git clone ${g.repo}.git`,
    text: norm([g.title, g.tagline, g.name, ed.name, ed.model, g.also ? edition(g.also.model).model : '', g.type === 'web' ? 'web navegador' : 'terminal consola cli', g.new ? 'nuevo novedad' : '', g.wip ? 'wip' : ''].join(' '))};
});
for (const g of games) if (!edIds.includes(g.model)) edIds.push(g.model);
const order = id => edIds.indexOf(id);
games.sort((a, b) => order(a.model) - order(b.model) || (b.new ? 1 : 0) - (a.new ? 1 : 0) || a.label.localeCompare(b.label, 'es'));
games.forEach((g, i) => g.no = String(i + 1).padStart(3, '0'));
const byName = new Map(games.map(g => [g.name, g]));
const usedEds = edIds.filter(id => games.some(g => g.model === id));

// ── sonido ──────────────────────────────────────────
const Sound = (() => {
  let ac = null, out = null, on = !!store.get('sound', true);
  const ctx = () => {
    if (!on) return null;
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); out = ac.createGain(); out.gain.value = .5; out.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac.state === 'running' || navigator.userActivation?.hasBeenActive ? ac : null;
  };
  function tone(f, {type = 'sine', dur = .12, gain = .1, when = 0, to = 0} = {}) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + .02);
  }
  function noise({dur = .2, gain = .1, when = 0, f0 = 800, f1 = 2400, q = 1.2, type = 'bandpass'} = {}) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + when, n = Math.ceil(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl).connect(g).connect(out); s.start(t);
  }
  return {
    get on() { return on; },
    toggle() { on = !on; store.set('sound', on); if (on) this.click(); return on; },
    click() { tone(1500, {type: 'square', dur: .03, gain: .035}); noise({dur: .03, gain: .05, f0: 3000, f1: 1800}); },
    hover() { tone(2100, {type: 'sine', dur: .04, gain: .018}); },
    pop() { tone(300, {type: 'triangle', dur: .11, gain: .12, to: 720}); },
    whoosh() { noise({dur: .5, gain: .1, f0: 500, f1: 3400, q: .8}); },
    clack() { noise({dur: .07, gain: .3, f0: 2600, f1: 500, q: .7}); tone(130, {type: 'sine', dur: .16, gain: .3, to: 62}); tone(96, {type: 'triangle', dur: .12, gain: .16, when: .05, to: 60}); },
    ding() { tone(1046.5, {type: 'triangle', dur: .16, gain: .1}); tone(1568, {type: 'triangle', dur: .5, gain: .11, when: .11}); tone(3136, {type: 'sine', dur: .4, gain: .03, when: .11}); },
    start() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, {type: 'square', dur: .12, gain: .06, when: i * .06})); noise({dur: .6, gain: .06, f0: 400, f1: 6000, when: .1}); },
    nope() { tone(170, {type: 'square', dur: .1, gain: .05}); },
  };
})();

// ── piezas del DOM ──────────────────────────────────
const el = {
  stage: $('#stage'), wrap: $('#stage-wrap'), box: $('#box'), info: $('#p-info'), play: $('#play'), playT: $('#play-t'), repo: $('#repo'),
  bigno: $('#bigno'), cap: $('#side-cap'), shelves: $('#shelves'), filters: $('#filters'), spectrum: $('#spectrum'), q: $('#q'),
  empty: $('#empty'), catN: $('#cat-n'), mini: $('#mini'), toast: $('#toast'), fallback: $('#fallback'), shells: $('#shells'),
};
const cartIcon = c => `<i style="--c:${c}"></i>`;

$('#n-games').textContent = games.length;
$('#n-models').textContent = usedEds.length;
$('#issue').textContent = new Date().getFullYear();
{ // cinta
  const row = usedEds.map(id => { const e = edition(id); return `<span>${cartIcon(e.plastic)}${esc(e.model)}<small>${esc(e.name)} · ${games.filter(g => g.model === id).length}</small></span>`; }).join('');
  $('#ticker').innerHTML = `<div>${row}</div><div>${row}</div><div>${row}</div>`;
}

// estantes: un grupo por modelo
const cells = new Map();
function cellHTML(g) {
  const badge = g.new ? '<span class="new">Nuevo</span>' : g.wip ? '<span class="wip">WIP</span>' : `<span>${g.web ? 'Web' : 'Terminal'}</span>`;
  return `<button class="cart" type="button" data-name="${esc(g.name)}" aria-label="${esc(g.full)}. ${esc(g.ed.model)}. Meter en la consola">
<span class="cart-pic"><i class="cart-sh"></i><img src="${esc(g.sprite)}" width="520" height="600" loading="lazy" decoding="async" alt="" draggable="false"><span class="cart-slot"><span><b></b>En la<br>consola</span></span></span>
<span class="cart-no"><b>Nº ${g.no}</b>${badge}</span>
<span class="cart-title">${esc(g.label)}</span>${g.sub ? `<span class="cart-sub">${esc(g.sub)}</span>` : ''}</button>`;
}
el.shelves.innerHTML = usedEds.map(id => {
  const e = edition(id), list = games.filter(g => g.model === id);
  return `<section class="group" data-ed="${esc(id)}" style="--c:${e.plastic}"><header class="group-h"><h3>${cartIcon(e.plastic)}${esc(e.model)}</h3><span class="mono">Edición ${esc(e.name)}</span><span class="mono n"></span></header><div class="grid">${list.map(cellHTML).join('')}</div></section>`;
}).join('');
for (const c of $$('.cart', el.shelves)) cells.set(c.dataset.name, c);
el.spectrum.innerHTML = usedEds.map(id => { const e = edition(id), n = games.filter(g => g.model === id).length; return `<button type="button" data-ed="${esc(id)}" style="--c:${e.plastic};--n:${n}" title="${esc(e.model)} · ${n}" aria-label="${esc(e.model)}, ${n} juegos"></button>`; }).join('');
el.filters.innerHTML = `<button class="chip on" type="button" data-ed="all">Todos<em>${games.length}</em></button>` +
  usedEds.map(id => { const e = edition(id); return `<button class="chip" type="button" data-ed="${esc(id)}">${cartIcon(e.plastic)}${esc(e.model)}<em>${games.filter(g => g.model === id).length}</em></button>`; }).join('') +
  `<div class="seg" role="group" aria-label="Tipo de juego"><button type="button" class="on" data-type="all">Todo</button><button type="button" data-type="web">Web</button><button type="button" data-type="terminal">Terminal</button></div>`;
el.shells.innerHTML = SHELLS.map(s => `<button type="button" data-shell="${s.id}" style="--c:${s.body}" title="Carcasa ${esc(s.name)}" aria-label="Carcasa ${esc(s.name)}"></button>`).join('');

// aparición escalonada
const seen = 'IntersectionObserver' in window && !REDUCE ? new IntersectionObserver(es => {
  let i = 0;
  for (const e of es) if (e.isIntersecting) { e.target.style.setProperty('--d', (i++ * .035) + 's'); e.target.classList.add('in'); seen.unobserve(e.target); setTimeout(() => e.target.style.removeProperty('--d'), 900); }
}, {rootMargin: '0px 0px -4% 0px'}) : null;
for (const c of cells.values()) seen ? seen.observe(c) : c.classList.add('in');

// ── filtros ─────────────────────────────────────────
const F = {ed: 'all', type: 'all', q: ''};
let visible = games;
function applyFilters() {
  const q = norm(F.q.trim());
  visible = games.filter(g => (F.ed === 'all' || g.model === F.ed || (g.also && g.also.model === F.ed)) && (F.type === 'all' || (F.type === 'web') === g.web) && (!q || q.split(/\s+/).every(w => g.text.includes(w))));
  const set = new Set(visible);
  for (const g of games) cells.get(g.name).hidden = !set.has(g);
  for (const grp of $$('.group', el.shelves)) {
    const n = $$('.cart:not([hidden])', grp).length;
    grp.hidden = !n; $('.n', grp).textContent = n === 1 ? '1 juego' : `${n} juegos`;
  }
  el.empty.hidden = visible.length > 0;
  el.catN.textContent = visible.length === games.length ? `${games.length} títulos` : `${visible.length} de ${games.length}`;
  for (const b of $$('[data-ed]', el.filters)) { const on = b.dataset.ed === F.ed; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }
  for (const b of $$('[data-type]', el.filters)) { const on = b.dataset.type === F.type; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }
  for (const b of $$('button', el.spectrum)) b.classList.toggle('on', b.dataset.ed === F.ed);
  $('#catalogo').classList.toggle('filtering', F.ed !== 'all');
}
el.filters.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ed) F.ed = b.dataset.ed === F.ed ? 'all' : b.dataset.ed;
  if (b.dataset.type) F.type = b.dataset.type;
  Sound.click(); applyFilters();
});
el.spectrum.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; F.ed = b.dataset.ed === F.ed ? 'all' : b.dataset.ed; Sound.click(); applyFilters(); });
el.q.addEventListener('input', () => { F.q = el.q.value; applyFilters(); });
applyFilters();

// ── ficha ───────────────────────────────────────────
let current = null, stage = null, pending = null, launching = false;
function paint(g) {
  const root = document.documentElement.style, e = g.ed;
  root.setProperty('--ed', e.studio); root.setProperty('--ed-ink', e.ink); root.setProperty('--pl', e.plastic);
  el.bigno.textContent = g.no;
  el.cap.textContent = `Edición ${e.name} — ${e.model} — Nº ${g.no} de ${games.length}`;
  const also = g.also ? ` + ${edition(g.also.model).model}` : '';
  el.info.className = '';
  el.info.innerHTML = `<div class="p-meta"><span class="tagc fill"><i></i>${esc(e.model)}${esc(also)}</span><span class="tagc">${esc(e.name)}</span><span class="tagc">${g.web ? 'Web' : 'Terminal'}</span>${g.new ? '<span class="tagc" style="background:var(--lime)">Nuevo</span>' : ''}${g.wip ? '<span class="tagc" style="background:#ffd640">WIP</span>' : ''}</div>
<h2 class="p-title${g.label.length > 16 ? ' long' : ''}">${esc(g.label)}</h2>
${g.sub ? `<p class="p-sub">${esc(g.sub)}</p>` : ''}
<p class="p-tag" id="p-tag">${esc(g.tagline)}</p>
${g.web ? '' : `<div class="p-cmd"><span>$</span><code>${esc(g.clone)}</code></div>`}`;
  void el.info.offsetWidth; el.info.className = 'swap';
  const tag = $('#p-tag');
  if (tag.scrollHeight > tag.clientHeight + 4) { const m = document.createElement('button'); m.type = 'button'; m.className = 'p-more'; m.textContent = 'Leer más'; m.onclick = () => { const o = tag.classList.toggle('open'); m.textContent = o ? 'Menos' : 'Leer más'; }; tag.after(m); }
  el.play.href = g.web ? g.play : g.repo;
  el.playT.textContent = g.web ? 'Jugar' : 'Copiar comando';
  el.repo.href = g.repo;
  el.fallback.src = g.sprite;
  $('#mini-img').src = g.sprite; $('#mini-t').textContent = g.label;
  document.title = `${g.label} · gavilanbe POCKET`;
}
const picRect = name => { const c = cells.get(name); if (!c || c.hidden || c.closest('[hidden]')) return null; const r = $('img', c).getBoundingClientRect(); return r.width ? r : null; };

function select(g, {fly = true, from = 'grid', push = true} = {}) {
  if (!g || launching) return;
  if (g === current) { stage && stage.nudge(); if (isMobile() && from === 'grid') openSheet(); return; }
  if (stage && stage.busy) { pending = [g, {fly, from, push}]; return; }
  const prev = current; current = g;
  cells.get(g.name).classList.add('out');
  paint(g);
  if (push) try { history.replaceState(null, '', '#' + g.name); } catch {}
  const back = () => { if (prev && prev !== current) { const c = cells.get(prev.name); c.classList.remove('out'); c.classList.add('back'); setTimeout(() => c.classList.remove('back'), 520); } };
  const mobile = isMobile();
  if (mobile && from === 'grid') openSheet();
  if (!stage || !fly || REDUCE) { stage && stage.set(g, {boot: 'warm'}); back(); return; }
  // el rectángulo de origen se mide antes de que la hoja lo tape
  const fromRect = from === 'grid' || !mobile ? picRect(g.name) : null;
  stage.insert(g, onScreen(fromRect), {backRect: () => (mobile && sheetOpen ? null : onScreen(prev && picRect(prev.name))), onBack: back}).then(() => {
    if (pending) { const [pg, o] = pending; pending = null; select(pg, o); }
  });
}
const onScreen = r => r && r.bottom > -200 && r.top < innerHeight + 200 ? r : null;
const step = d => { const list = visible.length ? visible : games, i = list.indexOf(current); select(list[(i + d + list.length) % list.length] || list[0], {from: 'nav'}); };
const lucky = () => { const list = (visible.length > 1 ? visible : games).filter(g => g !== current); select(list[Math.random() * list.length | 0], {from: 'nav'}); };

function play(ev) {
  const g = current; if (!g || launching) return;
  if (!g.web) {
    ev && ev.preventDefault();
    const done = () => { toast('Comando copiado: pégalo en tu terminal'); stage && stage.copied(); Sound.ding(); };
    (navigator.clipboard ? navigator.clipboard.writeText(g.clone) : Promise.reject()).then(done, () => toast(g.clone));
    return;
  }
  if (ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1)) return;   // en otra pestaña, sin teatro
  ev && ev.preventDefault();
  if (!stage || REDUCE) return go(g.play);
  launching = true; Sound.start(); stage.press('start');
  stage.launch().then(() => { $('#flash').classList.add('on'); setTimeout(() => go(g.play), 60); });
}
addEventListener('pageshow', e => { if (e.persisted || launching) { launching = false; $('#flash').classList.remove('on'); stage && stage.reset(); } });

let toastT = 0;
function toast(msg) { el.toast.textContent = msg; el.toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.toast.classList.remove('on'), 2400); }

// ── la hoja del móvil ───────────────────────────────
let sheetOpen = false;
function openSheet() {
  if (sheetOpen || !isMobile()) return;
  sheetOpen = true; el.wrap.classList.add('held'); el.stage.classList.remove('bye'); el.stage.classList.add('sheet');
  document.documentElement.style.overflow = 'hidden'; el.mini.classList.remove('on');
}
function closeSheet() {
  if (!sheetOpen) return;
  sheetOpen = false; el.stage.classList.add('bye'); Sound.click();
  setTimeout(() => { el.stage.classList.remove('sheet', 'bye'); el.wrap.classList.remove('held'); document.documentElement.style.overflow = ''; miniCheck(); }, 290);
}
$('#sheet-x').addEventListener('click', closeSheet);
el.mini.addEventListener('click', () => { Sound.click(); openSheet(); });
function miniCheck() { if (!isMobile() || sheetOpen) return el.mini.classList.remove('on'); el.mini.classList.toggle('on', el.wrap.getBoundingClientRect().bottom < 80); }
addEventListener('scroll', miniCheck, {passive: true});
addEventListener('resize', () => { if (!isMobile() && sheetOpen) { sheetOpen = false; el.stage.classList.remove('sheet', 'bye'); el.wrap.classList.remove('held'); document.documentElement.style.overflow = ''; } miniCheck(); });

// ── eventos ─────────────────────────────────────────
el.shelves.addEventListener('click', e => { const c = e.target.closest('.cart'); if (c) { Sound.pop(); select(byName.get(c.dataset.name)); } });
el.shelves.addEventListener('pointerover', e => { const c = e.target.closest('.cart'); if (c && !c.contains(e.relatedTarget) && e.pointerType === 'mouse') Sound.hover(); });
el.play.addEventListener('click', play);
$('#prev').addEventListener('click', () => { stage && stage.press('left'); step(-1); });
$('#next').addEventListener('click', () => { stage && stage.press('right'); step(1); });
$('#rand').addEventListener('click', () => { stage && stage.press('B'); lucky(); });
$('#lucky').addEventListener('click', () => { Sound.pop(); lucky(); if (isMobile()) openSheet(); });
$('#snd').addEventListener('click', e => e.currentTarget.setAttribute('aria-pressed', Sound.toggle()));
$('#snd').setAttribute('aria-pressed', Sound.on);
let shellId = store.get('shell', SHELLS[0].id);
function setShell(id, tell = true) {
  const s = SHELLS.find(x => x.id === id) || SHELLS[0]; shellId = s.id; store.set('shell', s.id);
  for (const b of $$('button', el.shells)) b.classList.toggle('on', b.dataset.shell === s.id);
  stage && stage.shell(s, tell);
}
el.shells.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { Sound.click(); setShell(b.dataset.shell); } });
const nextShell = () => setShell(SHELLS[(SHELLS.findIndex(s => s.id === shellId) + 1) % SHELLS.length].id);
setShell(shellId, false);

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (typing) { if (e.key === 'Escape') { el.q.value = ''; F.q = ''; applyFilters(); el.q.blur(); } return; }
  const k = e.key;
  if (k === 'ArrowLeft') { e.preventDefault(); stage && stage.press('left'); step(-1); }
  else if (k === 'ArrowRight') { e.preventDefault(); stage && stage.press('right'); step(1); }
  else if (k === 'Enter' && !e.target.closest?.('button, a')) { e.preventDefault(); play(); }
  else if (k === 'r' || k === 'R') { stage && stage.press('B'); lucky(); }
  else if (k === 's' || k === 'S') { stage && stage.press('select'); nextShell(); }
  else if (k === '/') { e.preventDefault(); el.q.focus(); el.q.scrollIntoView({block: 'center'}); }
  else if (k === 'Escape') closeSheet();
});
addEventListener('hashchange', () => { const g = byName.get(decodeURIComponent(location.hash.slice(1))); if (g && g !== current) select(g, {from: 'nav', push: false}); });

// la consola responde al puntero: se inclina, se arrastra para girarla y sus botones funcionan
addEventListener('pointermove', e => { if (stage && e.pointerType === 'mouse') { const r = el.box.getBoundingClientRect(); stage.pointer(Math.max(-1.4, Math.min(1.4, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))) * .5, Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))) * .5); } }, {passive: true});
{
  let down = null;
  el.box.addEventListener('pointerdown', e => { down = {x: e.clientX, y: e.clientY, lx: e.clientX, moved: 0}; });
  addEventListener('pointermove', e => { if (!down || !stage) return; const dx = e.clientX - down.lx; down.lx = e.clientX; down.moved += Math.abs(dx); stage.spin(dx * .09); }, {passive: true});
  addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null;
    if (!stage || d.moved > 8 || Math.abs(e.clientY - d.y) > 10) return;
    const h = stage.hit(e.clientX, e.clientY); if (!h) return;
    if (h === 'A' || h === 'start' || h === 'screen') { stage.press(h === 'screen' ? 'start' : h); play(); }
    else if (h === 'B') { stage.press('B'); lucky(); }
    else if (h === 'left' || h === 'up') { stage.press(h); step(-1); }
    else if (h === 'right' || h === 'down') { stage.press(h); step(1); }
    else if (h === 'select') { stage.press('select'); nextShell(); }
    else stage.nudge();
  });
  el.box.addEventListener('pointermove', e => { if (stage && e.pointerType === 'mouse' && !down) { const h = stage.hit(e.clientX, e.clientY); el.box.classList.toggle('hot', !!h && h !== 'body' && h !== 'cart'); } }, {passive: true});
}

// ── arranque ────────────────────────────────────────
const FEATURED = ['ceba', 'westieware', 'glup', 'invoca', 'nagu-gavi', 'trazo', 'chromara', 'isomate', 'spore-quest', 'barcanueva'];
const first = byName.get(decodeURIComponent(location.hash.slice(1))) || games.find(g => g.new && g.web) || byName.get(FEATURED.find(n => byName.has(n))) || games[0];
current = first; cells.get(first.name).classList.add('out'); paint(first);

const anchor = () => { const r = el.box.getBoundingClientRect(); return {cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height}; };
const canvas = $('#gl');
import('./stage.js').then(m => m.createStage({canvas, anchor, sfx: Sound})).then(s => {
  stage = s;
  stage.shell(SHELLS.find(x => x.id === shellId) || SHELLS[0], false);
  stage.set(current, {boot: 'cold'});
  canvas.classList.add('on');
  addEventListener('resize', () => stage.resize());
  window.visualViewport && visualViewport.addEventListener('resize', () => stage.resize());
  window.POCKET = {stage, select, games, byName, play, get current() { return current; }};
}).catch(err => { console.warn('Sin plató 3D:', err); document.documentElement.classList.add('no3d'); cells.get(current.name).classList.remove('out'); });
window.POCKET = {select, games, byName, play, get current() { return current; }};
miniCheck();
