// El cartucho de gavilanbe 64: carcasa con hueco para la etiqueta, estrías, trasera atornillada y conector dorado.
import {THREE, C, M4, Kit, ext, rrect, rbox, tex, mergeGeometries, tint, FONT, MONO} from './kit.js';
import {edition} from '../editions.js';

export const CART = {W: .235, H: .17, D: .044};
const {W, H, D} = CART, w = W / 2, h = H / 2;
// silueta: hombros redondeados arriba y muescas de agarre a los lados
const OUT = [[-w, -h], [w, -h], [w, h * .1], [w * .945, h * .22], [w * .945, h * .5], [w, h * .62], [w, h * .74], [w * .97, h * .9], [w * .86, h * 1.02], [w * .5, h * 1.1], [-w * .5, h * 1.1], [-w * .86, h * 1.02], [-w * .97, h * .9], [-w, h * .74], [-w, h * .62], [-w * .945, h * .5], [-w * .945, h * .22], [-w, h * .1]];
const inset = (pts, d) => pts.map(([x, y]) => [x - Math.sign(x) * d, y - Math.sign(y) * d * (y > 0 ? 1.2 : 1)]);
export const LABEL = {w: W * .8, h: W * .8 * .66, y: -.004};

let geo = null;
function geometry() {
  if (geo) return geo;
  const shell = new Kit(), dark = new Kit();
  // cuerpo trasero y marco delantero con el hueco de la etiqueta
  shell.add(ext(OUT, D - .008, .005, {segs: 2}), '#ffffff', M4(0, 0, -.004), 'plastic', .66, 1.1);
  shell.add(ext(inset(OUT, .004), .008, .003, {segs: 1, holes: [rrect(LABEL.w + .004, LABEL.h + .004, .006, 0, LABEL.y)]}), '#ffffff', M4(0, 0, D / 2 - .004), 'plastic', .72, 1.12);
  // estrías de agarre arriba y nervio superior
  for (let i = 0; i < 5; i++) shell.add(rbox(W * .34 - i * .012, .0035, .004, .0015, 1), '#ffffff', M4(0, h * 1.02 - i * .0001, D / 2 - .012 - i * .0068), 'plastic', .55, .8);
  // trasera: panel rehundido con cuatro tornillos
  shell.add(ext(rrect(W * .78, H * .62, .008, 0, .004), .003, .001, {segs: 1}), '#ffffff', M4(0, 0, -D / 2 + .0005), 'plastic', .5, .82);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) dark.cyl(.0055, .0055, .003, 8, '#1a1920', sx * W * .33, .004 + sy * H * .24, -D / 2 - .0006, 'metal', 1, 1, Math.PI / 2);
  // conector: lengüeta de placa con contactos
  dark.box(W * .8, .014, D * .5, '#17161c', 0, -h - .004, 0, 'plastic', 1, 1).box(W * .7, .016, .006, '#1f6b3a', 0, -h - .012, 0, 'plastic', .9, 1.1);
  for (let i = 0; i < 16; i++) dark.box(.0055, .013, .0068, '#f0c34a', -W * .31 + i * W * .0413, -h - .0125, 0, 'gold', 1, 1.1);
  geo = {shell: mergeGeometries(shell.b.plastic), metal: mergeGeometries(dark.b.metal), dark: mergeGeometries(dark.b.plastic), gold: mergeGeometries(dark.b.gold), label: new THREE.PlaneGeometry(LABEL.w, LABEL.h), board: tint(new THREE.BoxGeometry(W * .82, H * .8, .004), '#1f6b3a', .8, 1.1)};
  return geo;
}
const plastics = new Map();
export function plastic(id) {
  if (plastics.has(id)) return plastics.get(id);
  const e = edition(id), m = e.mat || {};
  const mat = new (m.irid ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({vertexColors: true, color: e.plastic, roughness: Math.max(.16, (m.rough ?? .5) * .9), metalness: m.metal ? .85 : 0, emissive: C(e.plastic).multiplyScalar(m.metal ? .04 : .1)});
  if (m.irid) { mat.iridescence = 1; mat.iridescenceIOR = 1.8; mat.iridescenceThicknessRange = [260, 760]; }
  if (m.opacity) { mat.transparent = true; mat.opacity = Math.min(.9, m.opacity + .1); }
  plastics.set(id, mat); return mat;
}
const shared = {dark: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .6}), metal: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .35, metalness: 1}), gold: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .3, metalness: 1, emissive: '#3a2a05'}), board: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .6})};

// etiqueta: la captura a sangre y una banda con el título y el sello del modelo
const LW = 320, LH = 211;
function ell(x, text, max) { if (x.measureText(text).width <= max) return text; let t = text; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; }
function drawLabel(x, g, img) {
  const ed = g.ed, art = 158, term = g.type !== 'web';
  x.clearRect(0, 0, LW, LH); x.save(); x.beginPath(); x.roundRect(0, 0, LW, LH, 9); x.clip();
  if (img) { const s = Math.max(LW / img.width, art / img.height), sw = LW / s, sh = art / s; x.imageSmoothingQuality = 'high'; x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, LW, art); }
  else { const gr = x.createLinearGradient(0, 0, LW, art); gr.addColorStop(0, ed.studio); gr.addColorStop(1, ed.plastic); x.fillStyle = gr; x.fillRect(0, 0, LW, art); x.fillStyle = '#17122a'; x.font = `54px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(ell(x, g.label.toUpperCase(), LW - 28), 14, art - 22); }
  x.fillStyle = '#17122a'; x.fillRect(0, art, LW, LH - art); x.fillStyle = ed.plastic; x.fillRect(0, art - 3, LW, 5);
  // sello del modelo a la derecha
  x.font = `700 15px ${MONO}`; x.textBaseline = 'middle'; x.textAlign = 'right';
  const mw = x.measureText(ed.model.toUpperCase()).width;
  x.fillStyle = ed.plastic; x.fillRect(LW - mw - 30, art + 20, 11, 11); x.fillStyle = '#f4efe4'; x.fillText(ed.model.toUpperCase(), LW - 10, art + 27);
  x.textAlign = 'left'; x.fillStyle = '#ffe95c'; x.font = `25px ${FONT}`;
  x.fillText(ell(x, g.label, LW - mw - 52), 11, art + 28);
  if (term) { x.fillStyle = '#0c120d'; x.fillRect(8, 8, 76, 22); x.fillStyle = '#7dff9c'; x.font = `700 13px ${MONO}`; x.fillText('>_ TERM', 14, 20); }
  if (g.new) { x.save(); x.translate(LW - 42, 40); x.rotate(.22); x.fillStyle = '#c6f432'; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 2 ? 27 : 33; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); x.fillStyle = '#17122a'; x.font = `14px ${FONT}`; x.textAlign = 'center'; x.fillText('NUEVO', 0, 1); x.restore(); }
  if (g.wip) { x.save(); x.translate(52, 34); x.rotate(-.2); x.fillStyle = 'rgba(255,214,64,.95)'; x.fillRect(-44, -13, 88, 26); x.fillStyle = '#17122a'; x.font = `700 15px ${MONO}`; x.textAlign = 'center'; x.fillText('WIP', 0, 1); x.restore(); }
  const gl = x.createLinearGradient(0, 0, LW, LH); gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(.45, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.1)'); x.fillStyle = gl; x.fillRect(0, 0, LW, LH);
  x.restore();
}
const backTex = () => backTex.t || (backTex.t = tex(256, 128, (x, cw, ch) => { x.fillStyle = 'rgba(0,0,0,.5)'; x.font = `30px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('gavilanbe 64', cw / 2, 38); x.font = `600 11px ${MONO}`; x.fillText('NO SOPLAR · NO MOJAR · JUGAR MUCHO', cw / 2, 74); x.fillText('HECHO A MANO JUNTO A MODELOS QUE SUEÑAN', cw / 2, 92); }));

export function makeCart(g) {
  const G = geometry(), grp = new THREE.Group(), mat = plastic(g.model), ed = g.ed;
  const shell = new THREE.Mesh(G.shell, mat); shell.castShadow = true; grp.add(shell);
  for (const k of ['dark', 'metal', 'gold']) grp.add(new THREE.Mesh(G[k], shared[k]));
  if (ed.mat && ed.mat.opacity) { const b = new THREE.Mesh(G.board, shared.board); b.position.z = -.004; grp.add(b); shell.renderOrder = 2; }
  const t = tex(LW, LH, x => drawLabel(x, g, null));
  const lm = new THREE.MeshStandardMaterial({map: t, roughness: .32, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .32, transparent: true, alphaTest: .5});
  const label = new THREE.Mesh(G.label, lm); label.position.set(0, LABEL.y, D / 2 - .0052); grp.add(label);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * .7, W * .35), new THREE.MeshBasicMaterial({map: backTex(), transparent: true, polygonOffset: true, polygonOffsetFactor: -2})); back.rotation.y = Math.PI; back.position.set(0, .004, -D / 2 - .0012); grp.add(back);
  if (g.thumb) { const i = new Image(); i.onload = () => { drawLabel(t.image.getContext('2d'), g, i); t.needsUpdate = true; }; i.src = g.thumbS; }
  grp.userData = {game: g, pick: [shell, label]};
  shell.userData.cart = label.userData.cart = grp;
  return grp;
}

// taller: unos cuantos cartuchos de frente y uno de espaldas
export function lab(games) {
  const grp = new THREE.Group(), names = ['ceba', 'westieware', 'makinamon', 'invoca', 'poke-autobattler', 'bingo', 'trazo', '3dish'];
  names.forEach((n, i) => { const c = makeCart(games.find(g => g.name === n)); c.position.set((i % 4 - 1.5) * .27, .12 + Math.floor(i / 4) * .22, 0); if (i === 7) c.rotation.y = Math.PI; if (i === 6) c.rotation.y = .9; if (i === 5) c.rotation.x = -.9; grp.add(c); });
  return grp;
}
