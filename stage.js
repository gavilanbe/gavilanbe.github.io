// El plató 3D de gavilanbe POCKET: la consola, los cartuchos y su LCD.
// Las unidades de los modelos son milímetros; la escena se mide en píxeles CSS (1 unidad = 1 px en z = 0),
// así que un rectángulo del DOM se convierte en una posición del mundo sin más cuentas.
import * as THREE from './lib/three.pocket.js';
import {toCreasedNormals} from './lib/three.pocket.js';
import {edition, splitTitle, SHELLS} from './editions.js';

export const CART = {W: 58, H: 68, D: 8.4};
// Así se hornean los cartuchos del catálogo (scripts/carts.mjs) y así despegan al sacarlos de la balda.
export const SPRITE = {w: 520, h: 600, pxmm: 6.9, rx: .1, ry: -.36};
const CON = {W: 88, H: 150, ZF: 9.5, ZB: 8.3};
const SLOT = {x: 0, y: 81, z: -2.5};             // centro del cartucho ya metido
const LCD = {w: 60, h: 37.5, x: 0, y: 38, LW: 160, LH: 100};
const BOX = {cy: 20, h: 193, w: 96};            // caja de consola + cartucho asomando

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
const lum = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };

// ── formas ──────────────────────────────────────────
function rrPath(p, w, h, r, cx = 0, cy = 0, chamfer = 0) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x1 - r, y0); p.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  if (chamfer) { p.lineTo(x1, y1 - chamfer); p.lineTo(x1 - chamfer, y1); }
  else { p.lineTo(x1, y1 - r); p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false); }
  p.lineTo(x0 + r, y1); p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x0, y0 + r); p.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}
function pillPath(p, len, th, cx, cy, rot = 0) {
  const r = th / 2, a = len / 2 - r, c = Math.cos(rot), s = Math.sin(rot);
  const P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  p.moveTo(...P(-a, -r)); p.lineTo(...P(a, -r));
  p.absarc(...P(a, 0), r, rot - Math.PI / 2, rot + Math.PI / 2, false);
  p.lineTo(...P(-a, r));
  p.absarc(...P(-a, 0), r, rot + Math.PI / 2, rot + Math.PI * 1.5, false);
  return p;
}
const circlePath = (p, r, cx, cy) => { p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; };
function extrude(shape, depth, bevel, {segs = 5, curve = 20, crease = .5} = {}) {
  let g = new THREE.ExtrudeGeometry(shape, {depth: Math.max(.001, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: segs, curveSegments: curve});
  g.translate(0, 0, bevel);                      // de z = 0 a z = depth
  g = toCreasedNormals(g, crease);
  return g;
}
function crossShape(arm, len, r = .8) {
  const a = arm / 2, l = len / 2, s = new THREE.Shape();
  const pts = [[-a, -l], [a, -l], [a, -a], [l, -a], [l, a], [a, a], [a, l], [-a, l], [-a, a], [-l, a], [-l, -a], [-a, -a]];
  // esquinas exteriores redondeadas
  const outer = new Set([0, 1, 3, 4, 6, 7, 9, 10]);
  pts.forEach(([x, y], i) => {
    const [px, py] = pts[(i + 11) % 12], [nx, ny] = pts[(i + 1) % 12];
    if (!outer.has(i)) { i ? s.lineTo(x, y) : s.moveTo(x, y); return; }
    const d1 = Math.hypot(x - px, y - py), d2 = Math.hypot(nx - x, ny - y);
    const ax = x + (px - x) / d1 * r, ay = y + (py - y) / d1 * r, bx = x + (nx - x) / d2 * r, by = y + (ny - y) / d2 * r;
    i ? s.lineTo(ax, ay) : s.moveTo(ax, ay);
    s.quadraticCurveTo(x, y, bx, by);
  });
  return s;
}

// ── lienzos ─────────────────────────────────────────
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tex(c, aniso = 8) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }
const DISPLAY = '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const fontsReady = () => Promise.all(['800 40px "Bricolage Grotesque"', '600 20px "JetBrains Mono"', '16px "Tiny5"'].map(f => document.fonts.load(f).catch(() => 0))).then(() => document.fonts.ready).catch(() => 0);
function rr2d(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }
function fitText(x, text, maxW, size, min, font) {
  let s = size;
  for (; s > min; s -= 2) { x.font = font(s); if (x.measureText(text).width <= maxW) return s; }
  x.font = font(min);
  return min;
}
function ellipsis(x, text, maxW) {
  if (x.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && x.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}
const images = new Map();
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (!images.has(src)) images.set(src, new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  return images.get(src);
}
function cover(x, img, dx, dy, dw, dh) {
  const s = Math.max(dw / img.width, dh / img.height), sw = dw / s, sh = dh / s;
  x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, dx, dy, dw, dh);
}

// La etiqueta del cartucho: la captura a sangre y, debajo, el título y el sello del modelo.
const LBL = {w: 1000, h: 820, art: 625};
function drawLabel(c, game, img) {
  const x = c.getContext('2d'), ed = edition(game.model), {label, sub} = splitTitle(game.title);
  const {w, h, art} = LBL, term = game.type !== 'web';
  x.clearRect(0, 0, w, h);
  x.save(); rr2d(x, 0, 0, w, h, 30); x.clip();
  x.fillStyle = '#f4efe4'; x.fillRect(0, 0, w, h);
  // arte
  if (img) { cover(x, img, 0, 0, w, art); }
  else {                                          // sin captura: una carátula tipográfica
    const g = x.createLinearGradient(0, 0, w, art); g.addColorStop(0, ed.studio); g.addColorStop(1, ed.plastic); x.fillStyle = g; x.fillRect(0, 0, w, art);
    x.fillStyle = 'rgba(21,19,26,.14)'; for (let j = 0; j < art; j += 26) for (let i = (j / 26 % 2) * 13; i < w; i += 26) { x.beginPath(); x.arc(i, j, 3, 0, 7); x.fill(); }
    x.fillStyle = '#17151c'; x.fontStretch = 'condensed'; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    const words = label.toUpperCase().split(/\s+/), big = Math.min(230, 900 / Math.max(...words.map(s => s.length)) * 1.75);
    x.font = `800 ${big}px ${DISPLAY}`;
    words.slice(0, 3).forEach((s, i, a) => x.fillText(s, 46, art - 60 - (a.length - 1 - i) * big * .86));
    x.fontStretch = 'normal';
  }
  if (term) {                                     // juego de terminal: fósforo y líneas
    x.globalCompositeOperation = 'luminosity'; x.fillStyle = '#0b1a10'; x.globalAlpha = .28; x.fillRect(0, 0, w, art);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = .12; x.fillStyle = '#000';
    for (let y = 0; y < art; y += 8) x.fillRect(0, y, w, 3);
    x.globalAlpha = 1;
  }
  const sh = x.createLinearGradient(0, art - 90, 0, art); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.28)');
  x.fillStyle = sh; x.fillRect(0, art - 90, w, 90);
  // franja de la edición
  x.fillStyle = ed.plastic; x.fillRect(0, art, w, 14);
  x.fillStyle = '#17151c'; x.fillRect(0, art + 14, w, 5);
  // bloque del modelo (derecha)
  const bw = 286, by = art + 19, bh = h - by;
  x.fillStyle = '#17151c'; x.fillRect(w - bw, by, bw, bh);
  x.fillStyle = ed.plastic; x.fillRect(w - bw + 26, by + 34, 30, 30);
  x.fillStyle = '#f4efe4'; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.font = `700 38px ${MONO}`; x.fillText(ed.model.toUpperCase(), w - bw + 70, by + 62);
  x.font = `500 26px ${MONO}`; x.fillStyle = 'rgba(244,239,228,.62)';
  x.fillText(game.also ? `+ ${edition(game.also.model).model.toUpperCase()}` : ed.name.toUpperCase(), w - bw + 26, by + 108);
  x.fillText(term ? '>_ TERMINAL' : '▶ WEB', w - bw + 26, by + 146);
  // título
  const tw = w - bw - 76;
  x.fillStyle = '#17151c';
  x.fontStretch = 'condensed';
  const fs = fitText(x, label, tw, 92, 50, s => `800 ${s}px ${DISPLAY}`);
  if (sub) {
    x.fillText(ellipsis(x, label, tw), 38, by + 92);
    x.fontStretch = 'normal'; x.font = `500 27px ${MONO}`; x.fillStyle = 'rgba(23,21,28,.6)';
    x.fillText(ellipsis(x, sub.toUpperCase(), tw), 40, by + 140);
  } else x.fillText(ellipsis(x, label, tw), 38, by + 92 + (fs < 70 ? 14 : 22));
  x.fontStretch = 'normal';
  // pegatinas
  if (game.new) sticker(x, w - 130, 126, 96, '#c6f432', '#17151c', 'NUEVO');
  if (game.wip) { x.save(); x.translate(150, 96); x.rotate(-.2); x.fillStyle = 'rgba(255,214,64,.94)'; x.fillRect(-130, -38, 260, 76); x.fillStyle = '#17151c'; x.font = `700 44px ${MONO}`; x.textAlign = 'center'; x.fillText('WIP', 0, 16); x.restore(); }
  if (term) { x.fillStyle = '#0c120d'; rr2d(x, 30, 30, 232, 62, 10); x.fill(); x.fillStyle = '#7dff9c'; x.font = `700 32px ${MONO}`; x.textAlign = 'left'; x.fillText('>_ TERMINAL', 48, 73); }
  // brillo de papel
  const gl = x.createLinearGradient(0, 0, w, h); gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.06)');
  x.fillStyle = gl; x.fillRect(0, 0, w, h);
  x.restore();
}
function sticker(x, cx, cy, r, bg, fg, text) {
  x.save(); x.translate(cx, cy); x.rotate(.22);
  x.fillStyle = 'rgba(0,0,0,.25)'; star(x, 4, 6, r); x.fill();
  x.fillStyle = bg; star(x, 0, 0, r); x.fill();
  x.fillStyle = fg; x.font = `800 40px ${DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 0, 3);
  x.restore();
}
function star(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = i % 2 ? r * .84 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); }

// Rótulos de la banda superior del cartucho.
function drawBand(c, ed) {
  const x = c.getContext('2d'), col = ed.dark || lum(ed.plastic) < .42 ? 'rgba(255,255,255,.82)' : 'rgba(20,18,26,.74)';
  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = col; x.textBaseline = 'middle';
  x.font = `800 86px ${DISPLAY}`; x.textAlign = 'left'; x.fillText('gavilanbe', 0, c.height / 2 + 2);
  x.font = `600 40px ${MONO}`; x.textAlign = 'right'; x.fillText(ed.model.toUpperCase(), c.width - 150, c.height / 2 + 6);
}
// Serigrafía de la consola (un solo lienzo sobre todo el frontal).
function drawPrints(c, shell) {
  const k = c.width / CON.W, x = c.getContext('2d');
  const P = (mx, my) => [(mx + CON.W / 2) * k, (CON.H / 2 - my) * k];
  x.clearRect(0, 0, c.width, c.height);
  const ink = shell.dark ? 'rgba(255,255,255,.62)' : 'rgba(28,26,34,.66)';
  // en la lente
  x.textBaseline = 'middle'; x.textAlign = 'left';
  x.fillStyle = '#f2ede2'; x.font = `800 ${4.6 * k}px ${DISPLAY}`;
  const [lx, ly] = P(-30, 10.2); x.fillText('gavilanbe', lx, ly);
  const lw = x.measureText('gavilanbe').width;
  x.fillStyle = 'rgba(242,237,226,.6)'; x.font = `600 ${1.9 * k}px ${MONO}`; x.fillText('POCKET', lx + lw + 1.6 * k, ly + .5 * k);
  x.textAlign = 'right'; x.fillText('160×100 · COLOR', P(30, 10.2)[0], ly + .5 * k);
  // dos líneas de color arriba, con texto en medio
  const [sx0, sy] = P(-30, 61.6), [sx1] = P(30, 61.6);
  x.textAlign = 'center'; x.font = `600 ${1.55 * k}px ${MONO}`; x.fillStyle = 'rgba(242,237,226,.55)';
  const cap = 'CARTUCHOS DE VERDAD', cw = x.measureText(cap).width + 3 * k, mid = (sx0 + sx1) / 2;
  x.fillText(cap, mid, sy + .1 * k);
  for (const [dy, col] of [[-.55, '#ff5b35'], [.55, '#c6f432']]) { x.fillStyle = col; x.fillRect(sx0, sy + dy * k - .2 * k, mid - cw / 2 - sx0, .4 * k); x.fillRect(mid + cw / 2, sy + dy * k - .2 * k, sx1 - mid - cw / 2, .4 * k); }
  x.fillStyle = 'rgba(242,237,226,.5)'; x.font = `600 ${1.3 * k}px ${MONO}`; x.textAlign = 'left';
  const [px, py] = P(-34.6, 34); x.save(); x.translate(px, py); x.rotate(-Math.PI / 2); x.fillText('ENCENDIDO', 0, 0); x.restore();
  // en el frontal
  x.fillStyle = ink; x.font = `700 ${2.5 * k}px ${MONO}`; x.textAlign = 'center';
  x.fillText('A', ...P(36.2, -30.5)); x.fillText('B', ...P(20.4, -42.6));
  x.font = `600 ${1.7 * k}px ${MONO}`;
  for (const [t, mx, my] of [['SELECT', -9, -62.6], ['START', 7, -62.6]]) { const [a, b] = P(mx, my); x.save(); x.translate(a, b); x.rotate(-.42); x.fillText(t, 0, 0); x.restore(); }
}
let aoTex = null, shadowTex = null;
function aoTexture() {
  if (aoTex) return aoTex;
  const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 30, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,.04)'); g.addColorStop(1, 'rgba(0,0,0,.26)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return aoTex = tex(c, 1);
}
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = mkCanvas(256, 384), x = c.getContext('2d');
  x.filter = 'blur(26px)'; x.fillStyle = '#000'; rr2d(x, 58, 62, 140, 260, 26); x.fill();
  return shadowTex = tex(c, 1);
}

// ── materiales ──────────────────────────────────────
function plastic(ed) {
  const m = ed.mat || {};
  const mat = new THREE.MeshPhysicalMaterial({
    color: ed.plastic, roughness: m.rough ?? .5, metalness: m.metal ?? 0,
    clearcoat: m.coat ?? 0, clearcoatRoughness: .22, envMapIntensity: m.metal ? 1.25 : 1,
  });
  if (m.irid) { mat.iridescence = 1; mat.iridescenceIOR = 1.8; mat.iridescenceThicknessRange = [260, 760]; }
  if (m.glow) { mat.emissive = new THREE.Color(m.glow); }
  if (m.opacity) { mat.transparent = true; mat.opacity = m.opacity; mat.depthWrite = true; }
  return mat;
}
const matCache = new Map();
const edMat = id => { if (!matCache.has(id)) matCache.set(id, plastic(edition(id))); return matCache.get(id); };

// ── cartucho ────────────────────────────────────────
let cartGeo = null;
function cartGeometry() {
  if (cartGeo) return cartGeo;
  const {W, H} = CART;
  const core = extrude(rrPath(new THREE.Shape(), W, H, 3.2, 0, 0, 7.5), 7.7, .8, {curve: 10});
  core.translate(0, 0, -4.2);
  const fs = rrPath(new THREE.Shape(), W - 1.7, H - 1.7, 2.5, 0, 0, 7.1);
  fs.holes.push(rrPath(new THREE.Path(), 50, 41, 1.9, 0, 3.5));
  for (let i = 0; i < 4; i++) fs.holes.push(pillPath(new THREE.Path(), 26 - i * 4, 1.5, 0, -22 - i * 2.6));
  const face = extrude(fs, .7, .22, {segs: 3, curve: 10});
  face.translate(0, 0, 3.5);
  return cartGeo = {core, face, label: new THREE.PlaneGeometry(49.7, 40.7), band: new THREE.PlaneGeometry(48, 6), board: new THREE.BoxGeometry(50, 58, 1.4)};
}
const bandTex = new Map();
export function makeCart(game, {art = 'small'} = {}) {
  const ed = edition(game.model), g = cartGeometry(), grp = new THREE.Group(), mat = edMat(game.model);
  const core = new THREE.Mesh(g.core, mat), face = new THREE.Mesh(g.face, mat);
  grp.add(core, face);
  if (ed.mat && ed.mat.opacity) {                 // translúcido: se le ve la placa
    const b = new THREE.Mesh(g.board, new THREE.MeshStandardMaterial({color: ed.mat.board, roughness: .6}));
    b.position.set(0, -1, -.6); grp.add(b);
    core.renderOrder = 2; face.renderOrder = 3;
  }
  const lc = mkCanvas(LBL.w, LBL.h), lt = tex(lc);
  drawLabel(lc, game, null);
  const lm = new THREE.MeshPhysicalMaterial({map: lt, roughness: .42, clearcoat: .5, clearcoatRoughness: .25, transparent: true, alphaTest: .5});
  if (ed.mat && ed.mat.irid) { lm.iridescence = .45; lm.iridescenceIOR = 1.3; lm.iridescenceThicknessRange = [200, 480]; }
  const label = new THREE.Mesh(g.label, lm); label.position.set(0, 3.5, 3.53);
  grp.add(label);
  if (!bandTex.has(game.model)) { const c = mkCanvas(960, 120); drawBand(c, ed); bandTex.set(game.model, tex(c)); }
  const band = new THREE.Mesh(g.band, new THREE.MeshBasicMaterial({map: bandTex.get(game.model), transparent: true, depthWrite: false, toneMapped: false}));
  band.position.set(-1, 28.9, 4.23); band.renderOrder = 4;
  grp.add(band);
  grp.userData = {game, label: lt};
  grp.userData.ready = loadImage(art === 'big' ? game.thumb : game.thumbS || game.thumb).then(img => { if (img) { drawLabel(lc, game, img); lt.needsUpdate = true; } });
  return grp;
}

// ── consola ─────────────────────────────────────────
function buildConsole(shell) {
  const {W, H, ZF, ZB} = CON, rig = new THREE.Group(), parts = {};
  const M = {
    body: new THREE.MeshPhysicalMaterial({color: shell.body, roughness: .46, clearcoat: .22, clearcoatRoughness: .5}),
    face: new THREE.MeshPhysicalMaterial({color: shell.face, roughness: .62, clearcoat: .1, clearcoatRoughness: .6}),
    pad: new THREE.MeshPhysicalMaterial({color: shell.pad, roughness: .48, clearcoat: .3, clearcoatRoughness: .4}),
    ab: new THREE.MeshPhysicalMaterial({color: shell.ab, roughness: .22, clearcoat: 1, clearcoatRoughness: .12}),
    rubber: new THREE.MeshStandardMaterial({color: '#6e6a66', roughness: .8}),
    well: new THREE.MeshStandardMaterial({color: '#131217', roughness: .7}),
    lens: new THREE.MeshPhysicalMaterial({color: '#08080c', roughness: .09, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.25}),
  };
  parts.M = M;
  // cuerpo
  const body = new THREE.Mesh(extrude(rrPath(new THREE.Shape(), W, H, 12), 17.8, 2.6, {segs: 7, curve: 18}), M.body);
  body.position.z = -9.5; rig.add(body);
  // frontal con sus huecos
  const fs = rrPath(new THREE.Shape(), W - 5.6, H - 5.6, 9.6);
  const lens = {w: 76, h: 64, y: 34, r: 5.5};
  const DP = {x: -21, y: -28, r: 15.6}, A = {x: 29, y: -21}, B = {x: 13.4, y: -33.4}, wellR = 7.9;
  const pills = [{n: 'select', x: -9, y: -55.6}, {n: 'start', x: 7, y: -55.6}], pRot = .42;
  fs.holes.push(rrPath(new THREE.Path(), lens.w, lens.h, lens.r, 0, lens.y));
  fs.holes.push(circlePath(new THREE.Path(), DP.r, DP.x, DP.y), circlePath(new THREE.Path(), wellR, A.x, A.y), circlePath(new THREE.Path(), wellR, B.x, B.y));
  for (const p of pills) fs.holes.push(pillPath(new THREE.Path(), 13.4, 5, p.x, p.y, pRot));
  const slots = [0, 1, 2, 3, 4].map(i => ({x: 19 + i * 4, y: -58 - i * .7, len: [10, 11, 11, 9.5, 7][i]}));
  for (const s of slots) fs.holes.push(pillPath(new THREE.Path(), s.len, 1.5, s.x, s.y, 1.05));
  const face = new THREE.Mesh(extrude(fs, ZF - ZB, .42, {segs: 4, curve: 18}), M.face);
  face.position.z = ZB; rig.add(face);
  // fondos de los huecos
  const ao = aoTexture();
  const aoMat = new THREE.MeshBasicMaterial({map: ao, transparent: true, depthWrite: false, color: 0x000000, toneMapped: false});
  const disc = (r, x, y, mat = M.body) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat); m.position.set(x, y, ZB + .02); rig.add(m); return m; };
  for (const [r, c] of [[DP.r + .5, DP], [wellR + .5, A], [wellR + .5, B]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), aoMat); s.position.set(c.x, c.y, ZB + .04); s.renderOrder = 1; rig.add(s);
  }
  const grill = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), M.well); grill.position.set(27, -59, ZB + .02); rig.add(grill);
  for (const p of pills) { const m = new THREE.Mesh(new THREE.PlaneGeometry(15, 7), M.well); m.position.set(p.x, p.y, ZB + .02); m.rotation.z = pRot; rig.add(m); }
  // lente y pantalla
  const lensMesh = new THREE.Mesh(extrude(rrPath(new THREE.Shape(), lens.w - .5, lens.h - .5, lens.r - .2), 1.0, .3, {segs: 3, curve: 14}), M.lens);
  lensMesh.position.set(0, lens.y, ZB); lensMesh.name = 'screen'; rig.add(lensMesh);
  const lcdC = mkCanvas(LCD.LW * 4, LCD.LH * 4), lcdT = tex(lcdC, 4);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(LCD.w, LCD.h), new THREE.MeshBasicMaterial({map: lcdT, toneMapped: false}));
  lcd.position.set(LCD.x, LCD.y, ZB + 1.02); lcd.name = 'screen'; rig.add(lcd);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(LCD.w, LCD.h), new THREE.MeshPhysicalMaterial({color: 0x000000, roughness: .08, clearcoat: 1, clearcoatRoughness: .03, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: .9}));
  glass.position.set(LCD.x, LCD.y, ZB + 1.05); glass.renderOrder = 5; rig.add(glass);
  parts.lcd = {canvas: lcdC, tex: lcdT, mesh: lcd};
  const led = new THREE.Mesh(new THREE.CircleGeometry(.85, 20), new THREE.MeshBasicMaterial({color: 0x3a1210, toneMapped: false}));
  led.position.set(-34.6, 48, ZB + 1.03); rig.add(led); parts.led = led;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xff3a22, opacity: 0, toneMapped: false}));
  halo.position.set(-34.6, 48, ZB + 1.06); halo.renderOrder = 6; rig.add(halo); parts.halo = halo;
  // serigrafía
  const pc = mkCanvas(1056, 1800), pt = tex(pc);
  drawPrints(pc, shell);
  const prints = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({map: pt, transparent: true, depthWrite: false, toneMapped: false}));
  prints.position.z = ZF + .03; prints.renderOrder = 4; rig.add(prints);
  parts.prints = {canvas: pc, tex: pt};
  // cruceta
  const dpad = new THREE.Group(); dpad.position.set(DP.x, DP.y, ZB);
  const cross = new THREE.Mesh(extrude(crossShape(9.2, 26.4, 1.1), 3.3, .7, {segs: 4, curve: 6}), M.pad);
  dpad.add(cross);
  const dimple = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), new THREE.MeshBasicMaterial({map: ao, transparent: true, color: 0x000000, depthWrite: false, toneMapped: false}));
  dimple.position.z = 3.32; dpad.add(dimple);
  for (const [dx, dy, r] of [[0, 1, 0], [1, 0, -Math.PI / 2], [0, -1, Math.PI], [-1, 0, Math.PI / 2]]) {
    const t = new THREE.Mesh(new THREE.CircleGeometry(1.25, 3), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: .32, toneMapped: false}));
    t.position.set(dx * 9, dy * 9, 3.32); t.rotation.z = r + Math.PI / 2; dpad.add(t);
  }
  rig.add(dpad); parts.dpad = dpad;
  for (const [n, dx, dy] of [['left', -1, 0], ['right', 1, 0], ['up', 0, 1], ['down', 0, -1]]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 4), new THREE.MeshBasicMaterial({visible: false}));
    h.position.set(DP.x + dx * 9, DP.y + dy * 9, ZB + 2); h.name = n; rig.add(h);
  }
  // A y B
  const dome = [];
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; dome.push(new THREE.Vector2(Math.sin(a) * 6.9, 2.5 + Math.cos(a) * 1.5 - (1 - Math.cos(a)) * .2)); }
  dome.push(new THREE.Vector2(6.9, 0)); dome.reverse();
  const domeG = toCreasedNormals(new THREE.LatheGeometry(dome, 40).toNonIndexed(), .7); domeG.rotateX(Math.PI / 2);
  parts.btn = {};
  for (const [n, c] of [['A', A], ['B', B]]) { const m = new THREE.Mesh(domeG, M.ab); m.position.set(c.x, c.y, ZB); m.name = n; rig.add(m); parts.btn[n] = m; }
  for (const p of pills) {
    const m = new THREE.Mesh(extrude(pillPath(new THREE.Shape(), 12, 3.7, 0, 0, 0), 2.2, .6, {segs: 3, curve: 8}), M.rubber);
    m.position.set(p.x, p.y, ZB); m.rotation.z = pRot; m.name = p.n; rig.add(m); parts.btn[p.n] = m;
  }
  // boca del cartucho
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(61, 1.2, 10.6), M.well); mouth.position.set(0, H / 2 - .5, SLOT.z); rig.add(mouth);
  // detalles laterales: rueda de volumen e interruptor
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.2, 28), M.pad); wheel.rotation.x = Math.PI / 2; wheel.position.set(-W / 2 + 2.6, 30, -1); rig.add(wheel);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9, 3.4), M.pad); sw.position.set(W / 2 - .4, 44, -1); rig.add(sw);
  return {rig, parts};
}
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return glowTex = tex(c, 1);
}

// ── luz de estudio ──────────────────────────────────
function studio(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec3 p; void main(){ float h = normalize(p).y * .5 + .5; vec3 c = mix(vec3(.20,.19,.22), vec3(.80,.78,.75), smoothstep(0., 1., h)); gl_FragColor = vec4(c, 1.); }',
  }));
  s.add(room);
  const panel = (w, h, pos, k, col = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({side: THREE.DoubleSide}));
    m.material.color.setRGB(col[0] * k, col[1] * k, col[2] * k); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(34, 22, [-26, 30, 34], 7);                 // caja de luz principal, arriba a la izquierda
  panel(8, 46, [40, 6, 22], 5, [.95, .97, 1]);     // tira lateral
  panel(40, 10, [6, -34, 30], 1.6, [1, .92, .82]); // relleno cálido
  panel(26, 26, [10, 26, -40], 3);                 // contra
  panel(5, 30, [-44, -4, 8], 3.5, [1, .96, .9]);   // filo izquierdo
  panel(26, 34, [-22, 20, 52], 2.4);               // reflejo que barre la lente al girar
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(s, .035).texture;
  pm.dispose(); room.geometry.dispose();
  return env;
}
function makeRenderer(canvas, w, h, dpr) {
  const r = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false});
  r.setPixelRatio(dpr); r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.02;
  r.setClearColor(0x000000, 0);
  return r;
}
function lightScene(scene, env) {
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xfff6ea, 1.7); key.position.set(-.5, .9, 1.1); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe6ff, .5); rim.position.set(.9, .2, -.6); scene.add(rim);
}

// ── LCD ─────────────────────────────────────────────
const pxCache = new Map();
function ptext(x, str, px, py, {font = 'j', size = 16, color = '#fff', align = 'left', shadow = null} = {}) {
  const key = font + size + color + str;
  let c = pxCache.get(key);
  if (!c) {
    const fam = `${size}px "Tiny5"`;
    const m = mkCanvas(2, 2).getContext('2d'); m.font = fam;
    const w = Math.max(1, Math.ceil(m.measureText(str).width) + 2), h = Math.ceil(size * 1.3);
    c = mkCanvas(w, h); const cx = c.getContext('2d', {willReadFrequently: true});
    cx.font = fam; cx.fillStyle = color; cx.textBaseline = 'alphabetic'; cx.fillText(str, 1, Math.round(size * .95));
    const d = cx.getImageData(0, 0, w, h), a = d.data;
    for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 96 ? 255 : 0;
    cx.putImageData(d, 0, 0);
    if (pxCache.size > 300) pxCache.clear();
    pxCache.set(key, c);
  }
  const ox = Math.round(align === 'center' ? px - c.width / 2 : align === 'right' ? px - c.width : px), oy = Math.round(py - size * .95);
  if (shadow) { const s = ptext.sh || (ptext.sh = mkCanvas(1, 1)); s.width = c.width; s.height = c.height; const sx = s.getContext('2d'); sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = shadow; sx.fillRect(0, 0, s.width, s.height); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) x.drawImage(s, ox + dx, oy + dy); }
  x.drawImage(c, ox, oy);
  return c.width;
}
function makeLCD(parts, hooks) {
  const {LW, LH} = LCD, lo = mkCanvas(LW, LH), x = lo.getContext('2d'), hi = parts.lcd.canvas, hx = hi.getContext('2d');
  const grid = mkCanvas(hi.width, hi.height);
  { const g = grid.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < LW; i++) g.fillRect(i * 4 + 3, 0, 1, hi.height); for (let j = 0; j < LH; j++) g.fillRect(0, j * 4 + 3, hi.width, 1); }
  const S = {mode: 'off', t: 0, game: null, img: null, dirty: true, last: -1, typed: 0, copied: 0, flash: 0, warm: false};
  const INK = '#15131a';
  function art() {
    if (S.img) { x.imageSmoothingEnabled = true; cover(x, S.img, 0, 0, LW, LH); }
    else { x.fillStyle = edition(S.game.model).plastic; x.fillRect(0, 0, LW, LH); }
  }
  function title() {
    const g = S.game, ed = edition(g.model), {label} = splitTitle(g.title);
    if (g.type !== 'web') return terminal();
    // la carátula arriba y una banda de tinta con el título y el START
    if (S.img) { x.imageSmoothingEnabled = true; cover(x, S.img, 0, 0, LW, 81); } else { x.fillStyle = ed.plastic; x.fillRect(0, 0, LW, 81); }
    x.fillStyle = INK; x.fillRect(0, 81, LW, 19);
    x.fillStyle = ed.plastic; x.fillRect(0, 80, LW, 2);
    const blink = Math.floor(S.t * 2.2) % 2 === 0;
    const sw = 40, name = label.toUpperCase();
    let fit = name; const m = mkCanvas(2, 2).getContext('2d'); m.font = '16px "Tiny5"';
    while (fit.length > 3 && m.measureText(fit).width > LW - sw - 12) fit = fit.slice(0, -2).trimEnd() + '…';
    ptext(x, fit, 5, 96, {size: 16, color: '#f4efe4'});
    if (blink) { x.fillStyle = '#c6f432'; x.fillRect(LW - sw, 86, sw - 4, 10); ptext(x, 'START', LW - sw / 2 - 2, 94, {font: 't', size: 8, color: INK, align: 'center'}); }
    x.fillStyle = INK; x.fillRect(0, 0, ptextW(ed.model.toUpperCase()) + 13, 11);
    x.fillStyle = ed.plastic; x.fillRect(3, 3, 5, 5);
    ptext(x, ed.model.toUpperCase(), 11, 9, {font: 't', size: 8, color: '#f4efe4'});
  }
  const ptextW = s => { const m = mkCanvas(2, 2).getContext('2d'); m.font = '8px "Tiny5"'; return Math.ceil(m.measureText(s).width); };
  function terminal() {
    const g = S.game;
    x.fillStyle = '#07110a'; x.fillRect(0, 0, LW, LH);
    if (S.img) { x.globalAlpha = .3; cover(x, S.img, 96, 6, 58, 36); x.globalAlpha = 1; x.fillStyle = 'rgba(20,90,40,.35)'; x.fillRect(96, 6, 58, 36); }
    const G = '#6dff95', D = '#2f8f4c';
    let name = splitTitle(g.title).label.toUpperCase(); const mm = mkCanvas(2, 2).getContext('2d'); mm.font = '16px "Tiny5"';
    while (name.length > 3 && mm.measureText(name).width > (S.img ? 86 : 148)) name = name.slice(0, -2).trimEnd() + '…';
    ptext(x, name, 6, 16, {size: 16, color: G});
    ptext(x, 'JUEGO DE TERMINAL', 6, 25, {font: 't', size: 8, color: D});
    const cmd = ['$ git clone', ' github.com/gavilanbe/', ' ' + g.name], full = cmd.join('\n');
    const n = Math.min(full.length, Math.floor(S.typed));
    let left = n;
    cmd.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; if (s) ptext(x, s, 6, 52 + i * 10, {font: 't', size: 8, color: G}); });
    if (n >= full.length) {
      if (Math.floor(S.t * 2.5) % 2 === 0) { x.fillStyle = G; x.fillRect(8 + ptextW(cmd[2]), 66, 5, 7); }
      ptext(x, S.copied > 0 ? '¡COPIADO!' : 'START: COPIAR', 80, 93, {font: 't', size: 8, color: S.copied > 0 ? '#fff' : '#c6f432', align: 'center'});
    }
    x.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < LH; y += 2) x.fillRect(0, y, LW, 1);
  }
  function logo(y, a = 1) {
    x.globalAlpha = a;
    const w = ptext(x, 'gavilanbe', 80, y, {size: 24, color: '#f4efe4', align: 'center'});
    x.globalAlpha = 1; return w;
  }
  function boot() {
    const t = S.t, warm = S.warm;
    x.fillStyle = INK; x.fillRect(0, 0, LW, LH);
    if (warm) {
      if (t < .22) { for (let i = 0; i < 260; i++) { x.fillStyle = Math.random() < .5 ? '#f4efe4' : '#3b3846'; x.fillRect(Math.random() * LW | 0, Math.random() * LH | 0, 2 + Math.random() * 6 | 0, 1); } return; }
      if (t < .62) { logo(56); bars(Math.min(1, (t - .22) / .3)); return; }
      return dissolve((t - .62) / .4);
    }
    if (t < .25) return;
    const drop = clamp((t - .25) / .85, 0, 1), y = Math.round(lerp(-6, 56, ease.out(drop)) / 2) * 2;
    logo(y);
    if (t > 1.1 && !S.dinged) { S.dinged = true; hooks.ding && hooks.ding(); }
    if (t > 1.15) { bars(Math.min(1, (t - 1.15) / .35)); ptext(x, 'POCKET', 80, 78, {font: 't', size: 8, color: '#9d98a8', align: 'center'}); }
    if (t > 2.0) dissolve((t - 2.0) / .5);
  }
  function bars(p) {
    const cols = ['#ff5b35', '#ffc21f', '#c6f432', '#52c8f5', '#9a6bff'], w = 16;
    cols.forEach((c, i) => { if (p * cols.length > i) { x.fillStyle = c; x.fillRect(80 - cols.length * w / 2 + i * w, 62, w - 2, 3); } });
  }
  function dissolve(p) {
    if (p >= 1) { S.mode = 'title'; S.t = 0; title(); return; }
    const keep = mkCanvas(LW, LH); keep.getContext('2d').drawImage(lo, 0, 0);
    title();
    const B = 10;
    for (let j = 0; j < LH / B; j++) for (let i = 0; i < LW / B; i++) { const h = ((i * 73856093) ^ (j * 19349663)) >>> 0; if ((h % 100) / 100 > p) x.drawImage(keep, i * B, j * B, B, B, i * B, j * B, B, B); }
  }
  function draw() {
    x.imageSmoothingEnabled = false; x.globalAlpha = 1;
    if (S.mode === 'off') { x.fillStyle = '#0c0b10'; x.fillRect(0, 0, LW, LH); }
    else if (S.mode === 'boot') boot();
    else if (S.mode === 'title') title();
    if (S.flash > 0) { x.fillStyle = `rgba(255,255,255,${Math.min(1, S.flash)})`; x.fillRect(0, 0, LW, LH); }
    hx.imageSmoothingEnabled = false; hx.drawImage(lo, 0, 0, hi.width, hi.height); hx.drawImage(grid, 0, 0);
    parts.lcd.tex.needsUpdate = true;
  }
  return {
    S,
    load(game, {warm = true} = {}) { S.game = game; S.img = null; S.mode = 'boot'; S.t = 0; S.warm = warm; S.dinged = false; S.typed = 0; S.copied = 0; S.flash = 0; loadImage(game.thumbS || game.thumb).then(i => { if (S.game === game) { S.img = i; S.dirty = true; } }); },
    off() { S.mode = 'off'; S.dirty = true; },
    copied() { S.copied = 1.6; },
    update(dt) {
      S.t += dt;
      if (S.mode === 'title' && S.game && S.game.type !== 'web') S.typed += dt * 34;
      if (S.copied > 0) S.copied -= dt;
      const tick = S.mode === 'boot' || S.flash > 0 ? Math.floor(S.t * 30) : S.mode === 'title' ? (S.game.type !== 'web' && S.typed < 60 ? Math.floor(S.t * 30) : Math.floor(S.t * 5) + (S.copied > 0 ? 1000 : 0)) : 0;
      if (tick !== S.last || S.dirty) { S.last = tick; S.dirty = false; draw(); return true; }
      return false;
    },
  };
}

// ── muelles ─────────────────────────────────────────
class Spring {
  constructor(v = 0, k = 170, d = 16) { this.v = v; this.to = v; this.vel = 0; this.k = k; this.d = d; }
  step(dt) { const a = (this.to - this.v) * this.k - this.vel * this.d; this.vel += a * dt; this.v += this.vel * dt; return this.v; }
  kick(v) { this.vel += v; }
  get busy() { return Math.abs(this.vel) > .001 || Math.abs(this.to - this.v) > .001; }
}

// ── el plató ────────────────────────────────────────
export async function createStage({canvas, anchor, onInsert, sfx = {}}) {
  await fontsReady();
  let vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  const renderer = makeRenderer(canvas, vw, vh, dpr);
  const scene = new THREE.Scene();
  lightScene(scene, studio(renderer));
  const FOV = 20, camera = new THREE.PerspectiveCamera(FOV, vw / vh, 10, 20000);
  const place = () => { const d = vh / 2 / Math.tan(FOV * Math.PI / 360); camera.position.set(0, 0, d); camera.near = d / 20; camera.far = d * 3; camera.aspect = vw / vh; camera.updateProjectionMatrix(); };
  place();
  let shell = SHELLS[0];
  const root = new THREE.Group(), {rig, parts} = buildConsole(shell);
  root.add(rig); scene.add(root);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(150, 225), new THREE.MeshBasicMaterial({map: shadowTexture(), transparent: true, depthWrite: false, color: 0x1a1020, opacity: .34, toneMapped: false}));
  shadow.position.set(7, -14, -30); shadow.renderOrder = -1; root.add(shadow);
  const lcd = makeLCD(parts, {ding: () => sfx.ding && sfx.ding()});
  const world = (px, py) => new THREE.Vector3(px - vw / 2, vh / 2 - py, 0);

  const sp = {rx: new Spring(0, 120, 14), ry: new Spring(0, 120, 14), rz: new Spring(0, 160, 12), dy: new Spring(0, 260, 14), yaw: new Spring(0, 60, 9)};
  const press = {};
  for (const n of Object.keys(parts.btn)) press[n] = new Spring(0, 900, 34);
  const dp = {x: new Spring(0, 700, 30), y: new Spring(0, 700, 30)};
  const ptr = {x: 0, y: 0};
  let inserted = null, time = 0, zoom = 0, zoomTo = 0, ledOn = 0, visible = true, alive = true, raf = 0, last = performance.now(), frozen = false;
  const flights = new Set();

  function slotPose(lift) { return new THREE.Vector3(SLOT.x, SLOT.y + lift, SLOT.z); }
  function spritePose(rect) {
    const s = rect.height / SPRITE.h * SPRITE.pxmm;
    return {pos: world(rect.left + rect.width / 2, rect.top + rect.height / 2), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(SPRITE.rx, SPRITE.ry, 0)), scale: s};
  }
  // pose del cartucho en el mundo cuando está sobre la boca (lift mm por encima de su sitio)
  const _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  function mouthPose(lift) {
    root.updateMatrixWorld(true);
    const pos = rig.localToWorld(slotPose(lift)); rig.getWorldQuaternion(_q); rig.getWorldScale(_s);
    return {pos, quat: _q.clone(), scale: _s.x};
  }
  function fly(cart, from, toFn, dur, {spin = 0, arc = 0, easing = ease.io, onEnd} = {}) {
    const f = {cart, t: 0, dur, from, toFn, spin, arc, easing, onEnd};
    flights.add(f); scene.add(cart);
    return f;
  }
  const _a = new THREE.Vector3(), spinQ = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  function stepFlight(f, dt) {
    f.t = Math.min(1, f.t + dt / f.dur);
    const e = f.easing(f.t), to = f.toFn(f.t);
    f.cart.position.lerpVectors(f.from.pos, to.pos, e);
    const bump = Math.sin(Math.PI * f.t);
    f.cart.position.y += bump * f.arc; f.cart.position.z += bump * 160;
    f.cart.quaternion.slerpQuaternions(f.from.quat, to.quat, e);
    if (f.spin) { spinQ.setFromAxisAngle(Y, f.spin * Math.PI * 2 * e); f.cart.quaternion.multiply(spinQ); }
    f.cart.scale.setScalar(lerp(f.from.scale, to.scale, e) * (1 + bump * .12));
    if (f.t >= 1) { flights.delete(f); f.onEnd && f.onEnd(); }
  }
  function seat(cart) {
    scene.remove(cart); rig.add(cart);
    cart.position.copy(slotPose(0)); cart.quaternion.identity(); cart.scale.setScalar(1);
  }
  function landed(game, warm) {
    sp.dy.kick(-260); sp.rx.kick(1.6); sp.rz.kick((Math.random() - .5) * 1.2);
    ledOn = 1; lcd.load(game, {warm});
    sfx.clack && sfx.clack();
    onInsert && onInsert(game);
  }
  // saca el cartucho actual: vuela a su hueco del catálogo (si se ve) o se va por arriba
  function eject(toRect, done) {
    const cart = inserted; if (!cart) return;
    inserted = null;
    const from = mouthPose(0);
    rig.remove(cart);
    cart.position.copy(from.pos); cart.quaternion.copy(from.quat); cart.scale.setScalar(from.scale);
    sfx.pop && sfx.pop();
    const up = mouthPose(46);
    fly(cart, from, () => up, .2, {easing: ease.out, onEnd() {
      const start = {pos: cart.position.clone(), quat: cart.quaternion.clone(), scale: cart.scale.x};
      const rect = toRect && toRect();
      const end = rect ? spritePose(rect) : {pos: start.pos.clone().add(new THREE.Vector3(vw * .2, vh * .9, 0)), quat: start.quat, scale: start.scale * .6};
      fly(cart, start, () => (toRect && toRect() ? spritePose(toRect()) : end), rect ? .5 : .4, {spin: rect ? -1 : 0, arc: rect ? 40 : 0, onEnd() { scene.remove(cart); disposeCart(cart); done && done(); }});
    }});
  }
  function disposeCart(cart) { cart.userData.label.dispose(); }

  const api = {
    get game() { return inserted ? inserted.userData.game : lcd.S.game; },
    get busy() { return flights.size > 0; },
    // mete un cartucho ya (sin vuelo): el de la portada
    set(game, {boot = 'cold'} = {}) {
      if (inserted) { rig.remove(inserted); disposeCart(inserted); }
      inserted = makeCart(game, {art: 'big'}); seat(inserted);
      ledOn = 1; lcd.load(game, {warm: boot !== 'cold'});
    },
    // vuela desde su hueco del catálogo hasta la boca y entra
    insert(game, fromRect, {backRect, onBack} = {}) {
      const had = !!inserted;
      if (inserted) eject(backRect, onBack); else if (onBack) onBack();
      lcd.off(); ledOn = 0;
      const cart = makeCart(game, {art: 'big'});
      const from = fromRect ? spritePose(fromRect) : {pos: world(vw / 2, vh + 200), quat: new THREE.Quaternion(), scale: mouthPose(0).scale};
      cart.position.copy(from.pos); cart.quaternion.copy(from.quat); cart.scale.setScalar(from.scale);
      sfx.whoosh && sfx.whoosh();
      return new Promise(res => {
        fly(cart, from, () => mouthPose(44), .62, {spin: 1, arc: 60, onEnd() {
          const top = {pos: cart.position.clone(), quat: cart.quaternion.clone(), scale: cart.scale.x};
          fly(cart, top, t => mouthPose(44 * (1 - ease.in(t))), .2, {easing: t => t, onEnd() { seat(cart); inserted = cart; landed(game, had || true); res(); }});
        }});
      });
    },
    press(name) {
      if (press[name]) { press[name].kick(-34); }
      if (name === 'left' || name === 'right') { dp.x.kick(name === 'left' ? 5 : -5); }
      if (name === 'up' || name === 'down') { dp.y.kick(name === 'up' ? -5 : 5); }
      sfx.click && sfx.click();
    },
    hit(cx, cy) {
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(cx / vw * 2 - 1, -(cy / vh) * 2 + 1), camera);
      root.updateMatrixWorld(true);
      for (const h of ray.intersectObjects(rig.children, true)) { let o = h.object; while (o && o !== rig) { if (o === inserted) return 'cart'; if (o.name) return o.name; o = o.parent; } if (h.object.material.visible !== false) return 'body'; }
      return null;
    },
    pointer(nx, ny) { ptr.x = nx; ptr.y = ny; },
    spin(v) { sp.yaw.kick(v); },
    nudge() { sp.rz.kick((Math.random() - .5) * 3); sp.dy.kick(120); },
    shell(next, tell = true) {
      shell = next; const M = parts.M;
      M.body.color.set(shell.body); M.face.color.set(shell.face); M.pad.color.set(shell.pad); M.ab.color.set(shell.ab);
      drawPrints(parts.prints.canvas, shell); parts.prints.tex.needsUpdate = true;
      if (tell) sp.yaw.kick(9);
    },
    copied() { lcd.copied(); },
    // la cámara entra en la pantalla; resuelve cuando el blanco lo tapa todo
    launch() { zoomTo = 1; return new Promise(res => { api._launch = res; }); },
    reset() { zoom = zoomTo = 0; lcd.S.flash = 0; frozen = false; lcd.S.dirty = true; },
    resize() { vw = innerWidth; vh = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); place(); },
    show(v) { visible = v; },
    destroy() { alive = false; cancelAnimationFrame(raf); },
    lcdRect() {
      root.updateMatrixWorld(true);
      const a = rig.localToWorld(new THREE.Vector3(-LCD.w / 2, LCD.y + LCD.h / 2, CON.ZF)).project(camera), b = rig.localToWorld(new THREE.Vector3(LCD.w / 2, LCD.y - LCD.h / 2, CON.ZF)).project(camera);
      return {left: (a.x + 1) / 2 * vw, top: (1 - a.y) / 2 * vh, right: (b.x + 1) / 2 * vw, bottom: (1 - b.y) / 2 * vh};
    },
  };

  let cleared = false;
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (document.hidden || frozen) return;
    time += dt;
    const a = anchor();
    const show = (a && a.h > 20 && a.cy + a.h / 2 > -40 && a.cy - a.h / 2 < vh + 40 && visible) || flights.size > 0;
    if (!show) { if (!cleared) { renderer.clear(); cleared = true; } lcd.update(dt); return; }
    cleared = false;
    // encaje en el rectángulo ancla
    let s = Math.min(a.h / BOX.h, a.w / BOX.w), cx = a.cx, cy = a.cy;
    if (zoomTo) {
      zoom = Math.min(1, zoom + dt / .75);
      const e = ease.in(zoom), zs = Math.max(vw / LCD.w, vh / LCD.h) * 1.08;
      const tx = vw / 2, ty = vh / 2 + (LCD.y - BOX.cy) * zs;
      s = lerp(s, zs, e); cx = lerp(cx, tx, e); cy = lerp(cy, ty, e);
      lcd.S.flash = clamp((zoom - .45) / .45, 0, 1); lcd.S.dirty = true;
      if (zoom >= 1 && api._launch) { const r = api._launch; api._launch = null; frozen = true; lcd.update(0); renderer.render(scene, camera); r(); return; }
    }
    const p = world(cx, cy);
    const k = 1 - zoom;
    root.scale.setScalar(s);
    root.position.set(p.x, p.y - BOX.cy * s + (Math.sin(time * 1.1) * 2.2 + sp.dy.step(dt) * .05 * s) * k, 0);
    sp.rx.to = ptr.y * .13; sp.ry.to = ptr.x * .2;
    rig.rotation.set((sp.rx.step(dt) + Math.sin(time * .7) * .018) * k, (sp.ry.step(dt) + sp.yaw.step(dt) + Math.sin(time * .5) * .05 - .06) * k, (sp.rz.step(dt) * .04) * k);
    shadow.material.opacity = .34 * k;
    for (const n in press) parts.btn[n].position.z = CON.ZB + Math.min(0, press[n].step(dt)) * .05;
    parts.dpad.rotation.set(dp.y.step(dt) * .02, dp.x.step(dt) * .02, 0);
    ledOn = lerp(ledOn, ledOn > .5 ? 1 : 0, .1);
    parts.led.material.color.setRGB(lerp(.2, 1, ledOn), lerp(.06, .22, ledOn), lerp(.05, .12, ledOn));
    parts.halo.material.opacity = ledOn * (.55 + Math.sin(time * 3) * .05);
    lcd.update(dt);
    for (const f of [...flights]) stepFlight(f, dt);
    renderer.render(scene, camera);
  }
  // compila antes del primer fotograma para que no haya tirón
  const warmCart = makeCart({name: '_', title: 'x', model: 'opus-5.5', type: 'web'}); warmCart.visible = true; warmCart.scale.setScalar(.001); scene.add(warmCart);
  try { await renderer.compileAsync(scene, camera); } catch {}
  scene.remove(warmCart);
  sp.dy.v = -2600; sp.yaw.v = -.7;                // entra desde abajo, girando
  raf = requestAnimationFrame(frame);
  return api;
}

// ── horno: un cartucho suelto, de frente y un poco girado, con fondo transparente ──
export async function createBaker() {
  await fontsReady();
  const canvas = mkCanvas(SPRITE.w, SPRITE.h), renderer = makeRenderer(canvas, SPRITE.w, SPRITE.h, 1);
  renderer.setPixelRatio(2); renderer.setSize(SPRITE.w, SPRITE.h, false);
  const scene = new THREE.Scene(); lightScene(scene, studio(renderer));
  const FOV = 20, d = SPRITE.h / 2 / Math.tan(FOV * Math.PI / 360), camera = new THREE.PerspectiveCamera(FOV, SPRITE.w / SPRITE.h, d / 20, d * 3);
  camera.position.set(0, 0, d);
  const out = mkCanvas(SPRITE.w, SPRITE.h);
  return async game => {
    const cart = makeCart(game, {art: 'big'});
    await cart.userData.ready;
    cart.rotation.set(SPRITE.rx, SPRITE.ry, 0); cart.scale.setScalar(SPRITE.pxmm);
    scene.add(cart); renderer.render(scene, camera);
    const x = out.getContext('2d'); x.clearRect(0, 0, out.width, out.height); x.imageSmoothingQuality = 'high'; x.drawImage(canvas, 0, 0, out.width, out.height);
    scene.remove(cart); cart.userData.label.dispose();
    return out.toDataURL('image/webp', .9);
  };
}
