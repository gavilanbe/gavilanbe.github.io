// La gavilanbe POCKET: la portátil de la casa. De pie en el plano XY, frente hacia +z, centro en el origen.
// El cartucho se ve entero en la cuna de arriba; cruceta, A, B, START y SELECT son piezas sueltas que se pulsan.
import {THREE, V, M4, Kit, MATS, ext, rbox, decal, glow, tint, tex, FONT, MONO} from './kit.js';
import {CART} from './cart.js';
import {SHELLS} from '../editions.js';

export const HH = {W: .6, H: 1, D: .12};
export const BIG = .36 / CART.W;                        // escala del cartucho puesto en la consola
export const SEAT = V(0, .43, .0215);                     // centro del cartucho encajado
export const LCD = {w: .4, h: .3, y: .123, z: HH.D / 2 + .0085, px: [480, 360]};
const {W, H, D} = HH, F = D / 2, LOGO = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'];

// materiales propios: el color de la carcasa se cambia en caliente (SELECT)
const phys = o => new THREE.MeshPhysicalMaterial({vertexColors: true, ...o});
Object.assign(MATS, {
  pkFront: phys({roughness: .36, clearcoat: .55, clearcoatRoughness: .3, envMapIntensity: 2.4}),
  pkBack: phys({roughness: .42, clearcoat: .4, clearcoatRoughness: .35, envMapIntensity: 2}),
  pkPad: phys({roughness: .5, clearcoat: .3, clearcoatRoughness: .4, envMapIntensity: 1.6}),
  pkA: phys({roughness: .16, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 3.6}),
  pkB: phys({roughness: .16, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 3.6}),
  pkLens: new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: .06, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 3.4}),
});

const arc = (pts, cx, cy, r, a0, a1, n = 7) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
const P = Math.PI;
// silueta: esquinas de abajo más redondas; con `notch`, la cuna del cartucho abierta arriba
function outline(notch, g = 0) {
  const p = [], w = W / 2 - g, h = H / 2 - g, rb = .115 - g, rt = .07 - g, nw = .2, ny = h - .17 + g, rc = .016, ri = .02;
  arc(p, -w + rb, -h + rb, rb, P, 1.5 * P); arc(p, w - rb, -h + rb, rb, 1.5 * P, 2 * P); arc(p, w - rt, h - rt, rt, 0, .5 * P);
  if (notch) { arc(p, nw + rc, h - rc, rc, .5 * P, P, 3); arc(p, nw - ri, ny + ri, ri, 0, -.5 * P, 4); arc(p, -nw + ri, ny + ri, ri, -.5 * P, -P, 4); arc(p, -nw - rc, h - rc, rc, 0, .5 * P, 3); }
  arc(p, -w + rt, h - rt, rt, .5 * P, P);
  return p;
}
const disc = (r, n = 28, cx = 0, cy = 0) => Array.from({length: n}, (_, i) => [cx + Math.cos(i / n * 2 * P) * r, cy + Math.sin(i / n * 2 * P) * r]);
const pill = (w, h, n = 8) => { const p = [], r = h / 2; arc(p, w / 2 - r, 0, r, -.5 * P, .5 * P, n); arc(p, -w / 2 + r, 0, r, .5 * P, 1.5 * P, n); return p; };
const CROSS = (a, b) => [[-b, -a], [b, -a], [b, -b], [a, -b], [a, b], [b, b], [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b]];

export const BTN = {
  dpad: {x: -.158, y: -.235}, a: {x: .2, y: -.2}, b: {x: .098, y: -.268},
  select: {x: -.062, y: -.415}, start: {x: .062, y: -.415},
};

export function makeHandheld() {
  const k = new Kit(), white = '#ffffff';
  // ── carcasa: tapa trasera entera, junta y frontal con la cuna ──
  k.add(ext(outline(false), F + .004, .014, {segs: 3}), white, M4(0, 0, -F / 2 - .002), 'pkBack', .7, .98);
  k.add(ext(outline(false, .005), .006, 0), '#0d0c12', M4(0, 0, -.001), 'matte', 1, 1);
  k.add(ext(outline(true), F, .011, {segs: 3}), white, M4(0, 0, F / 2), 'pkFront', .74, 1.1);
  // cuna: suelo con la boca y carriles laterales
  k.add(ext(pill(.385, .03, 5), .06, .002), '#08080c', M4(0, H / 2 - .17 + .001, .028, 0, Math.PI / 2), 'matte', 1, 1);
  k.box(.392, .166, .004, white, 0, H / 2 - .085, .0035, 'pkBack', .6, .8);
  for (let i = 0; i < 16; i++) k.box(.006, .004, .03, '#f0c34a', -.165 + i * .022, H / 2 - .176, .03, 'gold', 1, 1.1);
  // ── cristal de la pantalla ──
  const LY = .095, LW = .5, LH = .39;
  k.add(ext(rr(LW + .008, LH + .008, .037), .0016, 0), '#16141c', M4(0, LY, F), 'matte', 1, 1);
  k.add(ext(rr(LW, LH, .034), .008, .003, {segs: 2}), '#0b0b12', M4(0, LY, F + .0035), 'pkLens', 1, 1);
  k.add(ext(rr(LCD.w + .014, LCD.h + .014, .008), .002, 0), '#020204', M4(0, LCD.y, F + .0072), 'matte', 1, 1);
  // ── cazoletas ──
  k.add(ext(disc(.1062, 36), .0016, 0), '#16141c', M4(BTN.dpad.x, BTN.dpad.y, F), 'matte', 1, 1);
  k.add(ext(disc(.103, 36), .005, .002), white, M4(BTN.dpad.x, BTN.dpad.y, F - .0005), 'pkBack', .72, .86);
  const abx = (BTN.a.x + BTN.b.x) / 2, aby = (BTN.a.y + BTN.b.y) / 2, abr = Math.atan2(BTN.a.y - BTN.b.y, BTN.a.x - BTN.b.x);
  k.add(ext(pill(.2414, .1224, 10), .0016, 0), '#16141c', M4(abx, aby, F, 0, 0, abr), 'matte', 1, 1);
  k.add(ext(pill(.235, .116, 10), .005, .002), white, M4(abx, aby, F - .0005, 0, 0, abr), 'pkBack', .72, .86);
  for (const n of ['select', 'start']) k.add(ext(pill(.098, .04, 6), .004, .0015), white, M4(BTN[n].x, BTN[n].y, F - .0005, 0, 0, .42), 'pkBack', .7, .82);
  // altavoz: cinco ranuras en diagonal
  for (let i = 0; i < 5; i++) k.add(ext(pill(.085 - Math.abs(i - 2) * .012, .012, 4), .004, 0), '#0d0c12', M4(.158 + i * .019, -.38 - i * .019 + .04, F - .0012, 0, 0, P / 4), 'matte', 1, 1);
  // rueda de volumen y toma de cascos en el canto
  for (let i = 0; i < 5; i++) k.box(.012, .014, .03, '#1d1c25', W / 2 + .001, .12 + i * .018, 0, 'rubber', 1, 1);
  k.add(ext(disc(.016, 12), .006, 0), '#0d0c12', M4(-W / 2 + .001, -.2, 0, Math.PI / 2), 'matte', 1, 1);
  // piloto
  k.add(ext(disc(.011, 14), .003, .001), '#15141a', M4(-.226, LCD.y + .1, F + .008), 'matte', 1, 1);
  // ── rótulos ──
  const parts = {inks: []};
  const ink = (w, h, px, draw, x, y, rz = 0, lit = true) => { const m = decal(w, h, px, draw, {lit}); m.material.roughness = .6; parts.inks.push(m); k.mesh(m, M4(x, y, F + .0012, 0, 0, rz)); return m; };
  const word = (s, size = .62) => (x, cw, ch) => { x.fillStyle = '#fff'; x.font = `700 ${ch * size}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cw / 2, ch / 2); };
  ink(.1, .022, 2000, word('SELECT'), BTN.select.x - .014, BTN.select.y - .042, .42);
  ink(.1, .022, 2000, word('START'), BTN.start.x - .014, BTN.start.y - .042, .42);
  const letter = s => (x, cw, ch) => { x.fillStyle = '#fff'; x.font = `${ch * .86}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cw / 2, ch / 2 + 1); };
  // logo en el cristal, bajo la pantalla
  const logo = decal(.36, .05, 1500, (x, cw, ch) => {
    const r = ch * .34, cx = r + 6, cy = ch / 2; x.lineWidth = r * .62; LOGO.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); const a = -.35 + i * 1.42; x.arc(cx, cy, r * .68, a, a + 1.44); x.stroke(); }); x.fillStyle = LOGO[0]; x.fillRect(cx, cy - r * .3, r, r * .6);
    x.font = `${ch * .62}px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#e8e4f2'; const x0 = cx + r + 12; x.fillText('gavilanbe', x0, cy + 1); x.fillStyle = '#ff5b35'; x.fillText('POCKET', x0 + x.measureText('gavilanbe ').width, cy + 1);
  });
  k.mesh(logo, M4(0, LY - LH / 2 + .042, F + .0082));
  k.mesh(decal(.05, .014, 2600, (x, cw, ch) => { x.fillStyle = 'rgba(232,228,242,.6)'; x.font = `700 ${ch * .8}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('POWER', cw / 2, ch / 2); }), M4(-.226, LCD.y + .1 - .026, F + .0082, 0, 0, 0));
  const grp = k.build();

  // ── piezas móviles ──
  const piece = (geo, mat, hex = white, k0 = .82, k1 = 1.12) => { const m = new THREE.Mesh(tint(geo.index ? geo.toNonIndexed() : geo, hex, k0, k1), MATS[mat]); m.castShadow = true; return m; };
  const mov = (name, mesh, extra) => { const g = new THREE.Group(); g.add(mesh); if (extra) g.add(extra); g.position.set(BTN[name].x, BTN[name].y, F); g.userData = {name, v: 0, vel: 0, to: 0}; grp.add(g); parts[name] = g; return g; };
  { const c = piece(ext(CROSS(.082, .0275), .034, .008, {segs: 2}), 'pkPad', white, .9, 1.1); c.position.z = .006;
    const dot = piece(ext(disc(.017, 18), .004, .001), 'pkPad', white, .55, .6); dot.position.z = .0225; mov('dpad', c, dot); }
  parts.abInks = [];
  for (const n of ['a', 'b']) { const c = piece(ext(disc(.044, 30), .032, .011, {segs: 4}), n === 'a' ? 'pkA' : 'pkB', white, .86, 1.16); c.position.z = .008; const l = decal(.05, .05, 1500, letter(n.toUpperCase())); l.position.z = .0246; parts.abInks.push(l); mov(n, c, l); }
  for (const n of ['select', 'start']) { const c = piece(ext(pill(.082, .026, 6), .018, .006, {segs: 2}), 'pkPad', white, .9, 1.1); c.rotation.z = .42; c.position.z = .004; mov(n, c); }
  // pantalla: imagen, brillo del cristal y resplandor
  const cv = document.createElement('canvas'); cv.width = LCD.px[0]; cv.height = LCD.px[1];
  const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace; st.minFilter = st.magFilter = THREE.LinearFilter; st.generateMipmaps = false; st.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(LCD.w, LCD.h), new THREE.MeshBasicMaterial({map: st})); screen.position.set(0, LCD.y, LCD.z); grp.add(screen);
  const shine = new THREE.Mesh(new THREE.PlaneGeometry(LW - .05, LH - .05), new THREE.MeshBasicMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: tex(128, 104, (x, w, h) => { const g = x.createLinearGradient(0, 0, w * .9, h); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(.3, 'rgba(255,255,255,.05)'); g.addColorStop(.42, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * .62, 0); x.lineTo(w * .3, h); x.lineTo(0, h); x.fill(); })}));
  shine.position.set(0, LY, F + .009); shine.renderOrder = 6; grp.add(shine);
  parts.pilot = new THREE.Mesh(new THREE.CircleGeometry(.0075, 14), new THREE.MeshBasicMaterial({color: '#2a1512'})); parts.pilot.position.set(-.226, LCD.y + .1, F + .0101); grp.add(parts.pilot);
  parts.led = glow(.12, '#ff4a3a', 0); parts.led.position.set(-.226, LCD.y + .1, F + .014); grp.add(parts.led);
  parts.halo = glow(1.5, '#9fd4ff', 0); parts.halo.position.set(0, LCD.y, F + .03); grp.add(parts.halo);
  parts.aGlow = glow(.3, '#ff5b35', 0); parts.aGlow.position.set(BTN.a.x, BTN.a.y, F + .05); grp.add(parts.aGlow);
  parts.mouth = glow(.6, '#ffb070', 0); parts.mouth.scale.set(1, .32, 1); parts.mouth.position.set(0, H / 2 - .15, F + .012); grp.add(parts.mouth);
  // zonas de toque, más generosas que las piezas
  const hit = (name, w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({visible: false})); m.position.set(x, y, F + .03); m.userData.btn = name; grp.add(m); return m; };
  parts.hits = [hit('dpad', .25, .25, BTN.dpad.x, BTN.dpad.y), hit('a', .13, .13, BTN.a.x + .012, BTN.a.y + .012), hit('b', .12, .12, BTN.b.x - .012, BTN.b.y - .012), hit('select', .12, .1, BTN.select.x - .004, BTN.select.y - .012), hit('start', .12, .1, BTN.start.x + .004, BTN.start.y - .012), hit('screen', LCD.w, LCD.h, 0, LCD.y), hit('cart', .4, .24, 0, H / 2 - .04), hit('body', W, H, 0, 0)];
  parts.hits[7].position.z = F + .001;
  parts.canvas = cv; parts.tex = st; parts.screen = screen;
  grp.userData.parts = parts;
  setShell(grp, SHELLS[0]);
  return grp;
}
function rr(w, h, r, n = 6) { const p = []; arc(p, w / 2 - r, h / 2 - r, r, 0, .5 * P, n); arc(p, -w / 2 + r, h / 2 - r, r, .5 * P, P, n); arc(p, -w / 2 + r, -h / 2 + r, r, P, 1.5 * P, n); arc(p, w / 2 - r, -h / 2 + r, r, 1.5 * P, 2 * P, n); return p; }

export function setShell(grp, s) {
  MATS.pkFront.color.set(s.face); MATS.pkBack.color.set(s.body); MATS.pkPad.color.set(s.pad); const lime = /^#(c6f4|b9f0)/i.test(s.ab), cols = [s.ab, lime ? '#ff5b35' : '#b9f02a']; MATS.pkA.color.set(cols[0]); MATS.pkB.color.set(cols[1]);
  grp.userData.parts.abInks.forEach((m, i) => { const k = new THREE.Color(cols[i]), dark = k.r * .3 + k.g * .59 + k.b * .11 > .6; m.material.color.set(dark ? '#17122a' : '#ffffff'); m.material.opacity = dark ? .8 : .95; });
  const c = s.dark ? '#d9d5e6' : '#3a3744';
  for (const m of grp.userData.parts.inks) { m.material.color.set(c); m.material.opacity = .82; }
  grp.userData.shell = s;
}

export function lab() { const g = makeHandheld(); g.position.y = .6; const p = g.userData.parts; p.pilot.material.color.set('#ff4a3a'); p.led.material.opacity = .8; const x = p.canvas.getContext('2d'); x.fillStyle = '#2338b0'; x.fillRect(0, 0, 480, 360); x.fillStyle = '#ffe95c'; x.font = `44px ${FONT}`; x.textAlign = 'center'; x.fillText('gavilanbe', 240, 190); p.tex.needsUpdate = true; return g; }
