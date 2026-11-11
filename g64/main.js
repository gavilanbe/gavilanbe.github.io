// gavilanbe 64 · montaje: la colección y la interfaz funcionan solas (lista, ficha, enlaces);
// encima va la habitación 3D con su luz, su cámara por estaciones y el cartucho que vuela a la consola.
import {EDITIONS, edition, splitTitle} from '../editions.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const mq = q => matchMedia(q).matches, REDUCE = mq('(prefers-reduced-motion: reduce)');
const store = {get(k, d) { try { const v = localStorage.getItem('g64:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('g64:' + k, JSON.stringify(v)); } catch {} }};
const go = u => (window.__g64Nav || (x => location.assign(x)))(u);
const ROOT = new URL(document.documentElement.dataset.root || './', document.baseURI).href;

// ── la colección ────────────────────────────────────
const edIds = Object.keys(EDITIONS);
const games = GAMES.map(g => { const ed = edition(g.model), base = (g.thumb || '').split('?')[0]; return {...g, ...splitTitle(g.title), ed, web: g.type === 'web', thumbL: base ? ROOT + base : '', thumbS: base ? ROOT + base.replace(/^thumbs\/([^/]+)\.\w+$/, 'thumbs/s/$1.webp') : '', clone: `git clone ${g.repo}.git`, text: norm([g.title, g.tagline, g.name, ed.name, ed.model, g.type === 'web' ? 'web' : 'terminal consola', g.new ? 'nuevo' : ''].join(' '))}; })
  .sort((a, b) => edIds.indexOf(a.model) - edIds.indexOf(b.model) || (b.new ? 1 : 0) - (a.new ? 1 : 0) || a.label.localeCompare(b.label, 'es'));
const byName = new Map(games.map(g => [g.name, g]));
const usedEds = edIds.filter(id => games.some(g => g.model === id));

// ── sonido ──────────────────────────────────────────
const Sound = (() => {
  let ac = null, out = null, on = !!store.get('sound', true);
  const ctx = () => { if (!on) return null; if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC || !navigator.userActivation?.hasBeenActive) return null; ac = new AC(); out = ac.createGain(); out.gain.value = .5; out.connect(ac.destination); } if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; };
  function tone(f, {type = 'sine', dur = .12, gain = .1, when = 0, to = 0} = {}) { const a = ctx(); if (!a) return; const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + .02); }
  function noise({dur = .2, gain = .1, when = 0, f0 = 800, f1 = 2400, q = 1.2} = {}) { const a = ctx(); if (!a) return; const t = a.currentTime + when, n = Math.ceil(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(fl).connect(g).connect(out); s.start(t); }
  return {
    get on() { return on; }, toggle() { on = !on; store.set('sound', on); if (on) this.click(); return on; },
    click() { tone(1400, {type: 'square', dur: .03, gain: .04}); }, hover() { tone(1900, {dur: .04, gain: .02}); },
    move() { noise({dur: .35, gain: .05, f0: 300, f1: 1400, q: .7}); }, pop() { tone(300, {type: 'triangle', dur: .11, gain: .12, to: 720}); },
    whoosh() { noise({dur: .6, gain: .1, f0: 500, f1: 3400, q: .8}); },
    clack() { noise({dur: .07, gain: .3, f0: 2600, f1: 500, q: .7}); tone(130, {dur: .16, gain: .3, to: 62}); tone(96, {type: 'triangle', dur: .12, gain: .16, when: .05, to: 60}); },
    boot() { [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, {type: 'triangle', dur: .3, gain: .09, when: .12 + i * .09})); tone(1568, {dur: .7, gain: .05, when: .6}); },
    start() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, {type: 'square', dur: .12, gain: .06, when: i * .06})); noise({dur: .7, gain: .07, f0: 400, f1: 6000, when: .1}); },
  };
})();

// ── interfaz ────────────────────────────────────────
let current = null, room = null;
const panel = $('panel'), F = {ed: 'all', q: ''};
const CART_ICON = '<svg viewBox="0 0 16 15" fill="currentColor"><path d="M1 14V4.500L2.500 2h11L15 4.500V14zM3.500 4.500v5h9v-5z"/></svg>';
function paintCard(g) {
  const root = document.documentElement.style; root.setProperty('--pl', g.ed.plastic);
  $('c-meta').innerHTML = `<span class="bdg model" style="color:${g.ed.dark ? '#fff' : 'var(--ink)'}">${CART_ICON}${esc(g.ed.model)}${g.also ? ' + ' + esc(edition(g.also.model).model) : ''}</span><span class="bdg">${esc(g.ed.name)}</span><span class="bdg">${g.web ? 'Web' : 'Terminal'}</span>${g.new ? '<span class="bdg new">¡Nuevo!</span>' : ''}${g.wip ? '<span class="bdg wip">En obras</span>' : ''}`;
  const t = $('c-title'); t.textContent = g.label; t.dataset.t = g.label; t.classList.toggle('long', g.label.length > 12);
  $('c-sub').textContent = g.sub; $('c-sub').hidden = !g.sub;
  const d = $('c-desc'); d.classList.remove('open');
  d.innerHTML = `<p>${esc(g.tagline)}</p>${g.web ? '' : `<div class="cmd"><span>$</span><code>${esc(g.clone)}</code></div>`}`;
  const para = d.firstElementChild;
  requestAnimationFrame(() => { if (para.scrollHeight > para.clientHeight + 3) { const m = document.createElement('button'); m.type = 'button'; m.className = 'more'; m.textContent = 'Leer más'; m.onclick = () => { m.textContent = d.classList.toggle('open') ? 'Menos' : 'Leer más'; }; para.after(m); } });
  $('play').href = g.web ? g.play : g.repo; $('play-t').textContent = g.web ? 'Jugar' : 'Copiar comando'; $('repo').href = g.repo;
  $('c-count').textContent = `Nº ${String(games.indexOf(g) + 1).padStart(3, '0')} / ${String(games.length).padStart(3, '0')}`;
  const card = $('card'); card.classList.remove('on'); void card.offsetWidth; card.classList.add('on');
  document.title = `${g.label} · gavilanbe 64`;
  for (const r of document.querySelectorAll('.row')) r.setAttribute('aria-current', r.dataset.name === g.name);
}
function renderList() {
  const q = norm(F.q.trim()), ok = g => (F.ed === 'all' || g.model === F.ed || (g.also && g.also.model === F.ed)) && (!q || q.split(/\s+/).every(w => g.text.includes(w)));
  const vis = games.filter(ok);
  $('list').innerHTML = vis.length ? usedEds.map(id => { const l = vis.filter(g => g.model === id), e = edition(id); return l.length ? `<h4 style="--c:${e.plastic}"><i></i>${esc(e.model)} · ${esc(e.name)} · ${l.length}</h4>` + l.map(g => `<button class="row" type="button" data-name="${esc(g.name)}" style="--c:${e.plastic}" aria-current="${g === current}"><span class="th">${g.thumbS ? `<img src="${esc(g.thumbS)}" alt="" loading="lazy" width="58" height="33">` : ''}</span><span><b>${esc(g.label)}</b><small>${g.web ? 'Web' : 'Terminal'}${g.new ? ' · Nuevo' : ''}${g.sub ? ' · ' + esc(g.sub) : ''}</small></span></button>`).join('') : ''; }).join('') : '<p class="none">Ningún cartucho con ese nombre.</p>';
  $('p-n').textContent = vis.length === games.length ? `${games.length} juegos` : `${vis.length} de ${games.length}`;
  for (const c of document.querySelectorAll('.chip')) c.setAttribute('aria-pressed', c.dataset.ed === F.ed);
  room && room.dim(new Set(vis));
}
$('chips').innerHTML = `<button class="chip" type="button" data-ed="all" aria-pressed="true">Todos</button>` + usedEds.map(id => { const e = edition(id); return `<button class="chip" type="button" data-ed="${esc(id)}" style="--c:${e.plastic}" aria-pressed="false"><i></i>${esc(e.model)}</button>`; }).join('');
$('chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; F.ed = b.dataset.ed === F.ed ? 'all' : b.dataset.ed; Sound.click(); renderList(); });
$('q').addEventListener('input', () => { F.q = $('q').value; renderList(); });
$('list').addEventListener('click', e => { const r = e.target.closest('.row'); if (!r) return; Sound.pop(); if (mq('(max-width: 760px)')) openList(false); select(byName.get(r.dataset.name)); });
function openList(on) { panel.classList.toggle('on', on); panel.inert = !on; $('open-list').setAttribute('aria-expanded', on); if (on) setTimeout(() => $('q').focus({preventScroll: true}), 60); else { F.q = ''; $('q').value = ''; renderList(); } }
$('open-list').addEventListener('click', () => { Sound.click(); openList(!panel.classList.contains('on')); });
$('close-list').addEventListener('click', () => { Sound.click(); openList(false); });
$('snd').addEventListener('click', e => e.currentTarget.setAttribute('aria-pressed', Sound.toggle())); $('snd').setAttribute('aria-pressed', Sound.on);
let toastT = 0;
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }
const KEYS = {
  hero: '<span><span class="gl a">A</span>Tocar la pared o la tele</span><span><span class="gl k">/</span>Buscar</span>',
  wall: '<span><span class="gl a">A</span>Elegir cartucho</span><span><span class="gl k"><svg viewBox="0 0 22 12" width="20" height="11" fill="currentColor"><path d="M7 1v10L1 6zM15 1v10l6-5z"/></svg></span>Moverse</span><span><span class="gl b">B</span>Volver</span>',
  tv: '<span><span class="gl s">START</span>Jugar</span><span><span class="gl k"><svg viewBox="0 0 22 12" width="20" height="11" fill="currentColor"><path d="M7 1v10L1 6zM15 1v10l6-5z"/></svg></span>Cambiar</span><span><span class="gl b">B</span>Volver</span>',
};
function setStation(name) {
  let on = null;
  for (const b of document.querySelectorAll('.tabs button')) { const p = b.dataset.go === name; b.setAttribute('aria-pressed', p); if (p) on = b; }
  if (on) { const pill = $('pill'); pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px'; }
  $('keys').innerHTML = KEYS[name] || ''; document.body.dataset.st = name;
}
addEventListener('resize', () => room && setStation(room.station));
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b && room) { Sound.move(); room.go(b.dataset.go); } });

let launching = false;
function select(g, {fly = true, push = true} = {}) {
  if (!g || launching) return;
  if (g === current) { room && room.go('tv'); return; }
  current = g; paintCard(g);
  if (push) try { history.replaceState(null, '', '#' + g.name); } catch {}
  room && room.insert(g, fly && !REDUCE);
}
function play(ev) {
  const g = current; if (!g || launching) return;
  if (!g.web) { ev && ev.preventDefault(); (navigator.clipboard ? navigator.clipboard.writeText(g.clone) : Promise.reject()).then(() => toast('Comando copiado: pégalo en tu terminal'), () => toast(g.clone)); Sound.pop(); return; }
  if (ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1)) return;
  ev && ev.preventDefault();
  if (!room || REDUCE) return go(g.play);
  launching = true; Sound.start();
  room.launch().then(() => { $('flash').classList.add('on'); setTimeout(() => go(g.play), 200); });
}
$('play').addEventListener('click', play);
const step = d => { Sound.pop(); select(games[(games.indexOf(current) + d + games.length) % games.length]); };
$('prev').addEventListener('click', () => step(-1)); $('next').addEventListener('click', () => step(1));
addEventListener('pageshow', e => { if (e.persisted || launching) { launching = false; $('flash').classList.remove('on'); room && room.go('tv'); } });
addEventListener('hashchange', () => { const g = byName.get(decodeURIComponent(location.hash.slice(1))); if (g && g !== current) select(g, {push: false}); });
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (document.body.classList.contains('intro')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } return; }
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (e.key === 'Escape') { if (panel.classList.contains('on')) return openList(false); room && room.go('hero'); return; }
  if (typing) return;
  if (e.key === '/') { e.preventDefault(); openList(true); }
  else if (e.key === 'Enter' && !e.target.closest?.('button, a')) { e.preventDefault(); play(); }
  else if (e.key === 'b' || e.key === 'B') room && room.go(room.station === 'hero' ? 'hero' : 'hero');
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const d = e.key === 'ArrowRight' ? 1 : -1; if (room && room.station === 'wall') room.key(d); else step(d); }
  else if (e.key === '1') room && room.go('hero'); else if (e.key === '2') room && room.go('wall'); else if (e.key === '3') room && room.go('tv');
});

renderList(); setStation('hero');
const first = byName.get(decodeURIComponent(location.hash.slice(1))) || games.find(g => g.new && g.web) || games[0];
current = first; paintCard(first);
window.G64 = {games, byName, select, play, get current() { return current; }, get room() { return room; }};

// ── pantalla de título ──────────────────────────────
const boot = $('boot');
$('sp-word').innerHTML = [...'gavilanbe'].map((c, i) => `<span class="l tt" data-t="${c}" style="--i:${i}">${c}</span>`).join('') + '<span class="sp-64 tt hot" data-t="64">64</span>';
$('sp-n').textContent = `${games.length} juegos · ${usedEds.length} modelos`;
let ready = false, begun = false;
function begin() {
  if (begun || !ready) return; begun = true;
  Sound.start(); $('flash').classList.add('on');
  setTimeout(() => { boot.classList.add('off'); document.body.classList.remove('intro'); $('flash').classList.remove('on'); room && room.start(); setStation('hero'); }, 130);
}
boot.addEventListener('click', begin);
function armed() { ready = true; boot.classList.remove('wait'); $('start-t').textContent = 'Pulsa START'; $('sp-load').textContent = 'Habitación lista'; if (REDUCE) begin(); }

// ── la habitación 3D ────────────────────────────────
import('./scene.js').then(m => m.createRoom({canvas: $('gl'), games, first, Sound, onStation: setStation, onPick: g => select(g), onPlay: () => play(), tip: $('tip')})).then(r => { room = r; setTimeout(armed, 1500); })
  .catch(err => { console.warn('Sin habitación 3D:', err); ready = true; begun = true; boot.classList.add('off'); document.body.classList.remove('intro'); openList(true); toast('Tu navegador no puede con la habitación 3D: aquí tienes la lista'); });
