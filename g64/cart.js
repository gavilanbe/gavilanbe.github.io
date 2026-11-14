// El cartucho de gavilanbe 64: carcasa con hueco para la etiqueta, estrías, trasera atornillada y conector dorado.
import {THREE, C, M4, Kit, ext, rrect, rbox, tex, mergeGeometries, tint, FONT, MONO} from './kit.js';
import {edition} from '../editions.js';

export const CART = {W: .235, H: .17, D: .044};
const {W, H, D} = CART, w = W / 2, h = H / 2;
// silueta de curvas: esquinas redondas, una muesca de agarre a cada lado, hombros en arco y lomo algo más alto
const OUT = (() => {
  const p = [], r = .007, R = .027, ys = .064;
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI / 2; p.push([w - r + Math.cos(a) * r, -h + r + Math.sin(a) * r]); }
  p.push([w, .006]); for (let i = 1; i < 12; i++) { const t = i / 12; p.push([w - .0075 * Math.pow(Math.sin(Math.PI * t), 1.4), .006 + t * .046]); } p.push([w, .052]);
  for (let i = 0; i <= 9; i++) { const a = i / 9 * 1.38; p.push([w - R + Math.cos(a) * R, ys + Math.sin(a) * R]); }
  for (let i = 1; i <= 6; i++) { const t = i / 6, e = t * t * (3 - 2 * t), x0 = w - R + Math.cos(1.38) * R, y0 = ys + Math.sin(1.38) * R; p.push([x0 + (w * .46 - x0) * t, y0 + (h * 1.1 - y0) * e]); }
  return [...p, ...p.map(([x, y]) => [-x, y]).reverse()];
})();
const inset = (pts, d) => pts.map(([x, y]) => [x - Math.sign(x) * d, y - Math.sign(y) * d * (y > 0 ? 1.2 : 1)]);
export const LABEL = {w: W * .8, h: W * .8 * .776, y: -.0055};

let geo = null;
function geometry() {
  if (geo) return geo;
  const shell = new Kit(), dark = new Kit();
  // cuerpo trasero y marco delantero con el hueco de la etiqueta
  shell.add(ext(OUT, D - .008, .0075, {segs: 5}), '#ffffff', M4(0, 0, -.004), 'plastic', .62, 1.12);
  shell.add(ext(inset(OUT, .0045), .008, .003, {segs: 3, holes: [rrect(LABEL.w + .005, LABEL.h + .005, .0075, 0, LABEL.y, 8)]}), '#ffffff', M4(0, 0, D / 2 - .004), 'plastic', .7, 1.14);
  // costillas de agarre en los cantos, a la altura de las muescas
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) shell.add(rbox(.004, .0065, D * .62, .0015, 1), '#ffffff', M4(sx * (w - .0052), .0125 + i * .011, 0), 'plastic', .5, .78);
  // estrías de agarre arriba y nervio superior
  for (let i = 0; i < 5; i++) shell.add(rbox(W * .34 - i * .012, .0035, .004, .0015, 1), '#ffffff', M4(0, h * 1.02 - i * .0001, D / 2 - .012 - i * .0068), 'plastic', .55, .8);
  // trasera: panel rehundido con cuatro tornillos
  shell.add(ext(rrect(W * .78, H * .62, .008, 0, .004), .003, .001, {segs: 1}), '#ffffff', M4(0, 0, -D / 2 + .0005), 'plastic', .5, .82);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) dark.cyl(.0055, .0055, .003, 8, '#1a1920', sx * W * .33, .004 + sy * H * .24, -D / 2 - .0006, 'metal', 1, 1, Math.PI / 2);
  // conector: lengüeta de placa con contactos
  dark.box(W * .8, .014, D * .5, '#17161c', 0, -h - .004, 0, 'plastic', 1, 1).box(W * .7, .016, .006, '#1f6b3a', 0, -h - .012, 0, 'plastic', .9, 1.1);
  for (let i = 0; i < 16; i++) dark.box(.0055, .013, .0068, '#f0c34a', -W * .31 + i * W * .0413, -h - .0125, 0, 'gold', 1, 1.1);
  geo = {shell: mergeGeometries(shell.b.plastic), metal: mergeGeometries(dark.b.metal), dark: mergeGeometries(dark.b.plastic), gold: mergeGeometries(dark.b.gold), label: new THREE.PlaneGeometry(LABEL.w, LABEL.h), foil: new THREE.CircleGeometry(.0088, 6), board: (() => { const b = new Kit(); b.box(W * .82, H * .8, .004, '#1f6b3a', 0, 0, 0, 'plastic', .8, 1.1).box(.07, .05, .008, '#101014', -.03, .012, .005, 'plastic', 1, 1).box(.035, .035, .008, '#101014', .06, -.01, .005, 'plastic', 1, 1).box(.012, .03, .01, '#c9c6d6', .07, .04, .005, 'plastic', 1, 1); for (let i = 0; i < 7; i++) b.box(W * .7, .0025, .0045, '#2f8f4c', 0, -.05 + i * .006, .001, 'plastic', 1, 1); return mergeGeometries(b.b.plastic); })()};
  return geo;
}
const plastics = new Map();
export function plastic(id) {
  if (plastics.has(id)) return plastics.get(id);
  const e = edition(id), m = e.mat || {};
  const mat = new THREE.MeshPhysicalMaterial({vertexColors: true, color: e.plastic, roughness: Math.max(.14, (m.rough ?? .5) * .8), metalness: m.metal ? .85 : 0, clearcoat: m.metal ? .5 : .8, clearcoatRoughness: .2, envMapIntensity: 2.8, emissive: C(e.plastic).multiplyScalar(m.metal ? .04 : .08)});
  if (m.irid) { mat.iridescence = 1; mat.iridescenceIOR = 1.8; mat.iridescenceThicknessRange = [260, 760]; }
  if (m.opacity) { mat.transparent = true; mat.opacity = Math.min(.88, m.opacity + .08); }
  plastics.set(id, mat); return mat;
}
// tira holográfica del sello de calidad, a la izquierda de la etiqueta
const foilMat = new THREE.MeshPhysicalMaterial({color: '#f4f0ff', roughness: .18, metalness: .6, iridescence: 1, iridescenceIOR: 2.1, iridescenceThicknessRange: [200, 900], envMapIntensity: 4, clearcoat: 1});
const shared = {dark: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .6}), metal: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .35, metalness: 1}), gold: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .3, metalness: 1, emissive: '#3a2a05'}), board: new THREE.MeshStandardMaterial({vertexColors: true, roughness: .6})};

// etiqueta: la captura entera (16:10, sin recortar) y debajo una banda con el título y el sello del modelo
const LW = 384, LH = 298, ART = 240;
function ell(x, text, max) { if (x.measureText(text).width <= max) return text; let t = text; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; }
function drawLabel(x, g, img) {
  const ed = g.ed, term = g.type !== 'web', ink = '#17122a';
  x.clearRect(0, 0, LW, LH); x.save(); x.beginPath(); x.roundRect(0, 0, LW, LH, 13); x.clip();
  if (img) { const s = Math.max(LW / img.width, ART / img.height), sw = LW / s, sh = ART / s; x.imageSmoothingQuality = 'high'; x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, LW, ART); }
  else { const gr = x.createLinearGradient(0, 0, LW, ART); gr.addColorStop(0, ed.studio); gr.addColorStop(1, ed.plastic); x.fillStyle = gr; x.fillRect(0, 0, LW, ART); x.fillStyle = ink; x.font = `64px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(ell(x, g.label.toUpperCase(), LW - 36), 18, ART - 30); }
  // sombra del borde de la captura y banda
  const sh = x.createLinearGradient(0, ART - 46, 0, ART); sh.addColorStop(0, 'rgba(12,8,34,0)'); sh.addColorStop(1, 'rgba(12,8,34,.5)'); x.fillStyle = sh; x.fillRect(0, ART - 46, LW, 46);
  x.fillStyle = ink; x.fillRect(0, ART, LW, LH - ART); x.fillStyle = ed.plastic; x.fillRect(0, ART - 3, LW, 6);
  for (let i = 0; i < 4; i++) { x.fillStyle = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'][i]; x.fillRect(LW - 14, ART + 6 + i * 12.5, 14, 12.5); }
  // sello del modelo a la derecha, título a la izquierda
  x.textBaseline = 'middle'; x.font = `700 16px ${MONO}`; x.textAlign = 'right'; const model = ed.model.toUpperCase(), mw = x.measureText(model).width;
  x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(LW - mw - 62, ART + 15, mw + 38, 30, 15); x.fill();
  x.fillStyle = ed.plastic; x.beginPath(); x.arc(LW - mw - 46, ART + 30, 6.5, 0, 7); x.fill(); x.fillStyle = '#f4efe4'; x.fillText(model, LW - 34, ART + 31);
  x.textAlign = 'left'; x.fillStyle = '#ffe95c'; x.font = `29px ${FONT}`; x.fillText(ell(x, g.label, LW - mw - 92), 16, ART + 31);
  if (term) { x.fillStyle = '#0c120d'; x.beginPath(); x.roundRect(12, 12, 92, 28, 8); x.fill(); x.fillStyle = '#7dff9c'; x.font = `700 16px ${MONO}`; x.fillText('>_ TERM', 21, 27); }
  if (g.new) { x.save(); x.translate(LW - 50, 48); x.rotate(.22); x.fillStyle = ink; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 2 ? 35 : 42; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); x.fillStyle = '#c6f432'; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 2 ? 31 : 38; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); x.fillStyle = ink; x.font = `17px ${FONT}`; x.textAlign = 'center'; x.fillText('NUEVO', 0, 1); x.restore(); }
  if (g.wip) { x.save(); x.translate(g.type !== 'web' ? 150 : 70, 34); x.rotate(-.12); x.fillStyle = 'rgba(255,214,64,.96)'; x.fillRect(-48, -15, 96, 30); x.fillStyle = ink; x.font = `700 17px ${MONO}`; x.textAlign = 'center'; x.fillText('WIP', 0, 1); x.restore(); }
  // canto troquelado y brillo del papel
  x.restore(); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.roundRect(1.5, 1.5, LW - 3, LH - 3, 12); x.stroke();
  x.save(); x.beginPath(); x.roundRect(0, 0, LW, LH, 13); x.clip(); const gl = x.createLinearGradient(0, 0, LW, LH); gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(.42, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = gl; x.fillRect(0, 0, LW, LH);
  x.restore();
}
const backTex = () => backTex.t || (backTex.t = tex(256, 128, (x, cw, ch) => { x.fillStyle = 'rgba(0,0,0,.5)'; x.font = `30px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('gavilanbe 64', cw / 2, 38); x.font = `600 11px ${MONO}`; x.fillText('NO SOPLAR · NO MOJAR · JUGAR MUCHO', cw / 2, 74); x.fillText('HECHO A MANO JUNTO A MODELOS QUE SUEÑAN', cw / 2, 92); }));

export function makeCart(g) {
  const G = geometry(), grp = new THREE.Group(), mat = plastic(g.model), ed = g.ed;
  const shell = new THREE.Mesh(G.shell, mat); shell.castShadow = true; grp.add(shell);
  for (const k of ['dark', 'metal', 'gold']) grp.add(new THREE.Mesh(G[k], shared[k]));
  if (ed.mat && ed.mat.opacity) { const b = new THREE.Mesh(G.board, shared.board); b.position.z = -.004; grp.add(b); shell.renderOrder = 2; }
  const t = tex(LW, LH, x => drawLabel(x, g, null));
  const lm = new THREE.MeshPhysicalMaterial({map: t, roughness: .3, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 2.2, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .3, transparent: true, alphaTest: .5});
  const label = new THREE.Mesh(G.label, lm); label.position.set(0, LABEL.y, D / 2 - .0052); grp.add(label);
  const foil = new THREE.Mesh(G.foil, foilMat); foil.position.set(-LABEL.w / 2 + .0135, LABEL.y - LABEL.h / 2 + .041, D / 2 - .0049); grp.add(foil);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W * .7, W * .35), new THREE.MeshBasicMaterial({map: backTex(), transparent: true, polygonOffset: true, polygonOffsetFactor: -2})); back.rotation.y = Math.PI; back.position.set(0, .004, -D / 2 - .0012); grp.add(back);
  if (g.thumb) { const i = new Image(); i.onload = () => { drawLabel(t.image.getContext('2d'), g, i); t.needsUpdate = true; }; i.src = g.thumbS; }
  // etiqueta a toda resolución, para cuando el cartucho se ve de cerca
  let hi = false; const sharp = () => { if (hi || !g.thumbL) return; hi = true; const i = new Image(); i.onload = () => { drawLabel(t.image.getContext('2d'), g, i); t.needsUpdate = true; }; i.src = g.thumbL; };
  grp.userData = {game: g, pick: [shell, label], sharp};
  shell.userData.cart = label.userData.cart = grp;
  return grp;
}

// taller: unos cuantos cartuchos de frente y uno de espaldas
export function lab(games) {
  const grp = new THREE.Group(), names = ['ceba', 'westieware', 'makinamon', 'invoca', 'poke-autobattler', 'bingo', 'trazo', '3dish'];
  names.forEach((n, i) => { const c = makeCart(games.find(g => g.name === n)); c.position.set((i % 4 - 1.5) * .27, .12 + Math.floor(i / 4) * .22, 0); if (i === 7) c.rotation.y = Math.PI; if (i === 6) c.rotation.y = .9; if (i === 5) c.rotation.x = -.9; grp.add(c); });
  return grp;
}
