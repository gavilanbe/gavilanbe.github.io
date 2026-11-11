// gavilanbe 64 · prueba de la habitación. Imagen de juego de N64: pocos polígonos, sombreado por vértice,
// texturas pequeñas con filtro bilineal, niebla, y todo renderizado a baja resolución y ampliado suave.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EDITIONS, edition, splitTitle} from '../editions.js';

const LINES = 400;                                  // líneas de la «salida de vídeo»
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1b1430');
scene.fog = new THREE.Fog('#2a1d3f', 9, 19);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 40);
function resize() { const a = innerWidth / innerHeight; renderer.setPixelRatio(1); renderer.setSize(Math.round(LINES * a), LINES, false); camera.aspect = a; camera.fov = a < 1 ? 70 : 48; camera.updateProjectionMatrix(); }
resize(); addEventListener('resize', resize);

// ── utilidades de modelado ──────────────────────────
const C = h => new THREE.Color(h);
const M4 = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
// color por vértice con degradado vertical (la «luz horneada» de la época)
function tint(geo, hex, k0 = .7, k1 = 1.06) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.computeBoundingBox(); const {min, max} = g.boundingBox, c = C(hex), p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const t = max.y > min.y ? (p.getY(i) - min.y) / (max.y - min.y) : 1, k = k0 + (k1 - k0) * t; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
  return g;
}
class Kit {                                         // junta piezas en una sola malla por material
  constructor() { this.parts = []; }
  add(geo, hex, m = M4(), k0, k1) { const g = tint(geo, hex, k0, k1); g.applyMatrix4(m); this.parts.push(g); return this; }
  box(w, h, d, hex, x, y, z, ry = 0, rx = 0, k0, k1) { return this.add(new THREE.BoxGeometry(w, h, d), hex, M4(x, y, z, ry, rx), k0, k1); }
  cyl(r0, r1, h, n, hex, x, y, z, rx = 0, rz = 0, k0, k1) { return this.add(new THREE.CylinderGeometry(r0, r1, h, n), hex, M4(x, y, z, 0, rx, rz), k0, k1); }
  mesh(mat) { const m = new THREE.Mesh(mergeGeometries(this.parts), mat); return m; }
}
const solid = new THREE.MeshLambertMaterial({vertexColors: true});
const flat = new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true});

// texturas pequeñas, bilineales y sin mipmaps
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(64);
const FONT = '"Bricolage Grotesque", Arial, sans-serif';
await document.fonts.load(`800 20px ${FONT}`).catch(() => 0);

// ── la habitación ───────────────────────────────────
const ROOM = {x: 3.25, z0: -4.6, z1: 6.4, h: 3.3};
{
  const carpet = tex(64, 64, (x, w, h) => {
    x.fillStyle = '#5b3f8c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = ['#6a4aa0', '#523783', '#74529f', '#4a2f78'][i % 4]; x.fillRect(rnd() * w | 0, rnd() * h | 0, 2, 1); }
    x.fillStyle = '#ffd23f'; for (const [a, b] of [[8, 8], [40, 40]]) { x.beginPath(); x.moveTo(a, b - 5); x.lineTo(a + 5, b + 4); x.lineTo(a - 5, b + 4); x.fill(); }
    x.strokeStyle = '#35d0c0'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(34, 10); x.quadraticCurveTo(40, 2, 46, 10); x.quadraticCurveTo(52, 18, 58, 10); x.stroke();
    x.strokeStyle = '#ff5b8d'; x.beginPath(); x.moveTo(6, 44); x.lineTo(12, 38); x.lineTo(18, 44); x.lineTo(24, 38); x.stroke();
  }, [5, 8]);
  const floor = new THREE.Mesh(tint(new THREE.PlaneGeometry(ROOM.x * 2, ROOM.z1 - ROOM.z0, 6, 10), '#ffffff', 1, 1), new THREE.MeshLambertMaterial({map: carpet, vertexColors: true}));
  { const p = floor.geometry.attributes.position, c = floor.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const k = 1 - Math.pow(Math.abs(p.getX(i)) / ROOM.x, 3) * .45; c.setXYZ(i, k, k, k); } }
  floor.rotation.x = -Math.PI / 2; floor.position.z = (ROOM.z0 + ROOM.z1) / 2; scene.add(floor);
  const paper = tex(64, 64, (x, w, h) => {
    x.fillStyle = '#f0c987'; x.fillRect(0, 0, w, h); x.fillStyle = '#e9b96d'; x.fillRect(0, 0, 16, h); x.fillRect(32, 0, 16, h);
    x.fillStyle = '#d99b4a'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(i * 16 + 8, j * 16 + (i % 2 ? 4 : 12), 1.6, 0, 7); x.fill(); }
  });
  const wallMat = new THREE.MeshLambertMaterial({map: paper, vertexColors: true});
  const wall = (w, x, z, ry) => { const t = paper.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 1.1, 3); const m = new THREE.Mesh(tint(new THREE.PlaneGeometry(w, ROOM.h, 1, 4), '#ffffff', .62, 1.02), wallMat.clone()); m.material.map = t; m.position.set(x, ROOM.h / 2, z); m.rotation.y = ry; scene.add(m); };
  const len = ROOM.z1 - ROOM.z0, zc = (ROOM.z0 + ROOM.z1) / 2;
  wall(ROOM.x * 2, 0, ROOM.z0, 0); wall(len, -ROOM.x, zc, Math.PI / 2); wall(len, ROOM.x, zc, -Math.PI / 2);
  const k = new Kit();
  k.box(ROOM.x * 2, .16, .06, '#7a4a2a', 0, .08, ROOM.z0 + .03).box(.06, .16, len, '#7a4a2a', -ROOM.x + .03, .08, zc).box(.06, .16, len, '#7a4a2a', ROOM.x - .03, .08, zc);
  // cenefa
  k.box(ROOM.x * 2, .22, .03, '#3aa6a0', 0, 2.55, ROOM.z0 + .02, 0, 0, .9, 1.1).box(.03, .22, len, '#3aa6a0', -ROOM.x + .02, 2.55, zc, 0, 0, .9, 1.1).box(.03, .22, len, '#3aa6a0', ROOM.x - .02, 2.55, zc, 0, 0, .9, 1.1);
  scene.add(k.mesh(solid));
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.x * 2, len), new THREE.MeshBasicMaterial({color: '#2a1d3f'})); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM.h, zc); scene.add(ceil);
  // alfombra redonda bajo la consola
  const rug = tex(64, 64, (x, w, h) => { const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#17122a']; for (let i = 0; i < 4; i++) { x.fillStyle = cols[i]; x.beginPath(); x.arc(32, 32, 32 - i * 7, 0, 7); x.fill(); } x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.57, r = i % 2 ? 4 : 9; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.fill(); });
  const r = new THREE.Mesh(new THREE.CircleGeometry(1.75, 20), new THREE.MeshLambertMaterial({map: rug, transparent: true})); r.rotation.x = -Math.PI / 2; r.position.set(0, .012, -1.75); scene.add(r);
}
const blobTex = tex(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 2, 16, 16, 16); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });
function blob(x, z, sx, sz, y = .02, o = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({map: blobTex, transparent: true, depthWrite: false, opacity: o})); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; }

// luces
scene.add(new THREE.HemisphereLight('#fff0d8', '#4b3566', 1.55));
const sun = new THREE.DirectionalLight('#ffe2b0', 1.5); sun.position.set(2.5, 5, 4); scene.add(sun);
const tvGlow = new THREE.PointLight('#8fd0ff', 5, 6, 1.6); tvGlow.position.set(0, 1.1, -3.2); scene.add(tvGlow);

// ── la tele ─────────────────────────────────────────
const TV = {z: -4.0, y: .78};
const tvC = document.createElement('canvas'); tvC.width = 256; tvC.height = 192;
const tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace; tvT.generateMipmaps = false; tvT.minFilter = tvT.magFilter = THREE.LinearFilter;
{
  const wood = tex(64, 64, (x, w, h) => { x.fillStyle = '#8a5530'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#7a4826' : '#9a6238'; x.fillRect(0, rnd() * h | 0, w, 1 + rnd() * 2 | 0); } });
  const cab = new THREE.Mesh(tint(new THREE.BoxGeometry(2.5, TV.y, .95), '#ffffff', .55, 1.05), new THREE.MeshLambertMaterial({map: wood, vertexColors: true})); cab.position.set(0, TV.y / 2, TV.z); scene.add(cab);
  const k = new Kit();
  k.box(2.2, .5, .06, '#2a1a12', 0, .42, TV.z + .47).box(1.02, .2, .5, '#22222a', -.5, .32, TV.z + .26, 0, 0, .8, 1.2).box(.9, .02, .03, '#101014', -.5, .34, TV.z + .52).box(.07, .03, .03, '#39ff7a', -.12, .28, TV.z + .52, 0, 0, 1, 1);
  for (let i = 0; i < 7; i++) k.box(.07, .3 + (i % 3) * .03, .34, ['#ff5b35', '#35d0c0', '#ffd23f', '#7a4be6', '#f4efe4', '#ff5b8d', '#b9f02a'][i], .3 + i * .085, .33 + (i % 3) * .015, TV.z + .3, 0, 0, .75, 1.05);
  // cuerpo de la tele
  const y0 = TV.y, W = 1.86, H = 1.42;
  const back = new THREE.BoxGeometry(W, H, .9, 1, 1, 1); { const p = back.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * .72); p.setY(i, p.getY(i) * .74); } }
  k.add(back, '#3b3944', M4(0, y0 + H / 2, TV.z - .05), .6, 1.1);
  k.box(W + .06, H + .06, .12, '#4a4854', 0, y0 + H / 2, TV.z + .42, 0, 0, .7, 1.12);
  k.box(1.5, 1.1, .05, '#15141a', 0, y0 + H / 2 + .1, TV.z + .47, 0, 0, 1, 1);
  k.box(W - .1, .16, .04, '#33313c', 0, y0 + .13, TV.z + .49, 0, 0, .9, 1.1);
  for (let i = 0; i < 9; i++) k.box(.018, .1, .02, '#1a1920', -.78 + i * .045, y0 + .13, TV.z + .515);
  k.cyl(.035, .035, .04, 8, '#c9c5bd', .5, y0 + .13, TV.z + .52, Math.PI / 2).cyl(.035, .035, .04, 8, '#c9c5bd', .62, y0 + .13, TV.z + .52, Math.PI / 2).box(.05, .05, .03, '#ff3b30', .76, y0 + .13, TV.z + .515, 0, 0, 1, 1);
  // antena
  k.cyl(.012, .012, .9, 5, '#c9c5bd', -.3, y0 + H + .4, TV.z, 0, .5).cyl(.012, .012, .9, 5, '#c9c5bd', .3, y0 + H + .4, TV.z, 0, -.5).cyl(.12, .14, .06, 8, '#2a2830', 0, y0 + H + .03, TV.z);
  scene.add(k.mesh(solid));
  // pantalla abombada
  const sg = new THREE.PlaneGeometry(1.4, 1.04, 8, 6); { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / .7, v = p.getY(i) / .52; p.setZ(i, (1 - u * u) * .03 + (1 - v * v) * .025); } }
  const scr = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({map: tvT})); scr.position.set(0, y0 + H / 2 + .1, TV.z + .5); scr.name = 'tv'; scene.add(scr);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), new THREE.MeshBasicMaterial({map: tex(32, 32, x => { const g = x.createRadialGradient(16, 16, 3, 16, 16, 16); g.addColorStop(0, 'rgba(150,205,255,.42)'); g.addColorStop(1, 'rgba(150,205,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false})); halo.position.set(0, y0 + H / 2 + .1, TV.z + .56); scene.add(halo);
  blob(0, TV.z + .4, 3.4, 1.6);
}

// ── la consola ──────────────────────────────────────
const CON = {x: 0, z: -1.75};
const slot = new THREE.Vector3(CON.x, .355, CON.z - .02);
{
  const k = new Kit(), body = '#3d3b48', dark = '#24232c';
  // planta: trapecio con dos lóbulos delante
  const s = new THREE.Shape(), P = [[-.5, -.36], [.5, -.36], [.6, -.1], [.62, .2], [.52, .36], [.3, .42], [.16, .34], [-.16, .34], [-.3, .42], [-.52, .36], [-.62, .2], [-.6, -.1]];
  P.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  const base = new THREE.ExtrudeGeometry(s, {depth: .11, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 2}); base.rotateX(-Math.PI / 2);
  k.add(base, body, M4(CON.x, .05, CON.z, 0, 0, 0, [1, 1, -1]), .55, 1.15);
  // lomo central con la boca del cartucho
  const hump = new THREE.BoxGeometry(.56, .1, .5, 1, 1, 1); { const p = hump.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * .86); p.setZ(i, p.getZ(i) * .8); } }
  k.add(hump, '#484654', M4(CON.x, .245, CON.z - .02), .8, 1.18);
  k.box(.37, .02, .085, '#0c0b10', CON.x, .297, CON.z - .02, 0, 0, 1, 1);
  // botones
  k.cyl(.075, .085, .05, 10, '#ff5b35', CON.x - .4, .225, CON.z + .12, 0, 0, .8, 1.2).cyl(.075, .085, .05, 10, '#b9f02a', CON.x + .4, .225, CON.z + .12, 0, 0, .8, 1.2);
  // cuatro puertos de mando y piloto
  for (let i = 0; i < 4; i++) k.box(.11, .055, .04, dark, CON.x - .225 + i * .15, .1, CON.z + .345, 0, 0, 1, 1).cyl(.02, .02, .045, 6, '#6e6a78', CON.x - .225 + i * .15, .1, CON.z + .35, Math.PI / 2);
  k.box(.035, .02, .02, '#ff3b30', CON.x + .44, .12, CON.z + .37, 0, -.3, 1.6, 1.6);
  // patas
  for (const sx of [-1, 1]) k.cyl(.07, .08, .05, 8, dark, CON.x + sx * .44, .025, CON.z + .28).cyl(.07, .08, .05, 8, dark, CON.x + sx * .44, .025, CON.z - .26);
  scene.add(k.mesh(solid));
  // emblema: la G de cuatro colores
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({transparent: true, map: tex(64, 64, x => { const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6']; x.lineWidth = 13; x.lineCap = 'butt'; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); x.arc(32, 32, 20, -.35 + i * 1.42, -.35 + (i + 1) * 1.42 + .02); x.stroke(); }); x.fillStyle = '#ff5b35'; x.fillRect(32, 26, 22, 12); })}));
  badge.rotation.x = -Math.PI / 2; badge.position.set(CON.x, .2, CON.z + .3); scene.add(badge);
  blob(CON.x, CON.z, 1.9, 1.5, .02);
}
// ── el mando de tres cuernos ────────────────────────
{
  const k = new Kit(), g = '#d8d3c8', pos = M4(-.95, 0, -.72, .5);
  const add = (geo, hex, m, k0, k1) => k.add(geo, hex, pos.clone().multiply(m), k0, k1);
  const prong = (x, len, rz) => { const c = new THREE.CylinderGeometry(.075, .06, len, 7); add(c, g, M4(x, .07, .1 + len / 2 - .08, 0, Math.PI / 2 - .12, rz), .7, 1.12); add(new THREE.SphereGeometry(.062, 7, 5), g, M4(x + Math.sin(-rz) * len * .5, .045, .1 + len - .1), .7, 1.1); };
  const top = new THREE.BoxGeometry(.62, .09, .26, 3, 1, 1); { const p = top.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / .31; p.setZ(i, p.getZ(i) - (u * u) * .05); } }
  add(top, g, M4(0, .085, 0), .7, 1.12);
  prong(-.24, .36, .22); prong(0, .42, 0); prong(.24, .36, -.22);
  add(new THREE.BoxGeometry(.05, .02, .13), '#34333c', M4(-.22, .14, -.01)); add(new THREE.BoxGeometry(.13, .02, .05), '#34333c', M4(-.22, .14, -.01));
  add(new THREE.CylinderGeometry(.03, .04, .03, 8), '#34333c', M4(0, .125, .13)); add(new THREE.CylinderGeometry(.018, .018, .05, 6), '#8f8b96', M4(0, .16, .13)); add(new THREE.CylinderGeometry(.034, .03, .016, 8), '#b9b5c0', M4(0, .19, .13));
  add(new THREE.CylinderGeometry(.03, .03, .025, 8), '#ff5b35', M4(.24, .14, .03), .9, 1.2); add(new THREE.CylinderGeometry(.03, .03, .025, 8), '#b9f02a', M4(.17, .14, -.03), .9, 1.2);
  for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) add(new THREE.CylinderGeometry(.018, .018, .022, 6), '#7a4be6', M4(.27 + dx * .042, .14, -.075 + dz * .042), .9, 1.2);
  add(new THREE.CylinderGeometry(.02, .02, .02, 6), '#17122a', M4(0, .135, -.03));
  scene.add(k.mesh(solid));
  // cable hasta el primer puerto
  const pts = [[-.95, .08, -.86], [-1.0, .03, -1.15], [-.7, .02, -1.25], [-.4, .03, -1.28], [-.225, .1, -1.4]].map(p => new THREE.Vector3(...p));
  scene.add(new THREE.Mesh(tint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, .014, 4), '#24232c', 1, 1), solid));
  blob(-.95, -.6, .95, .95, .021, .8);
}

// ── cartuchos y expositores ─────────────────────────
const edIds = Object.keys(EDITIONS);
const games = GAMES.map(g => ({...g, ...splitTitle(g.title), ed: edition(g.model)})).sort((a, b) => edIds.indexOf(a.model) - edIds.indexOf(b.model) || a.label.localeCompare(b.label, 'es'));
const CW = .3, CH = .215, CD = .05;
const cartGeo = (() => {
  const s = new THREE.Shape(), w = CW / 2, h = CH / 2;
  [[-w, -h], [w, -h], [w, h * .2], [w * .93, h * .32], [w * .93, h * .55], [w, h * .68], [w * .9, h], [w * .45, h * 1.08], [-w * .45, h * 1.08], [-w * .9, h], [-w, h * .68], [-w * .93, h * .55], [-w * .93, h * .32], [-w, h * .2]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  const g = new THREE.ExtrudeGeometry(s, {depth: CD - .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 1}); g.translate(0, 0, -CD / 2 + .006);
  const k = new Kit(); k.add(g, '#ffffff', M4(), .62, 1.1).box(CW * .8, .02, CD * .55, '#55535c', 0, -CH / 2 - .008, 0, 0, 0, 1, 1);
  return mergeGeometries(k.parts);
})();
const labelGeo = new THREE.PlaneGeometry(CW * .8, CW * .8 / 1.6);
const plastics = new Map();
const plastic = id => { if (!plastics.has(id)) { const e = edition(id), o = e.mat && e.mat.opacity; plastics.set(id, new THREE.MeshLambertMaterial({vertexColors: true, color: e.plastic, transparent: !!o, opacity: o ? Math.min(.9, o + .12) : 1, emissive: C(e.plastic).multiplyScalar(.12)})); } return plastics.get(id); };
function labelTexture(g) {
  const ed = g.ed, t = tex(128, 80, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, ed.studio); gr.addColorStop(1, ed.plastic); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#17122a'; x.font = `800 22px ${FONT}`; x.textAlign = 'center'; x.fillText(g.label.toUpperCase().slice(0, 9), w / 2, h / 2 + 8); });
  if (g.thumb) { const i = new Image(); i.onload = () => { const x = t.image.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, 128, 80); if (g.type !== 'web') { x.fillStyle = '#0c120d'; x.fillRect(0, 0, 30, 13); x.fillStyle = '#7dff9c'; x.font = 'bold 10px monospace'; x.textAlign = 'left'; x.fillText('>_', 4, 10); } x.strokeStyle = '#f4efe4'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 125, 77); t.needsUpdate = true; }; i.src = '../' + g.thumb.replace(/^thumbs\/([^/?]+)\.\w+/, 'thumbs/s/$1.webp'); }
  return t;
}
const carts = [], racks = [], pickables = [];
function makeCart(g) {
  const grp = new THREE.Group(), body = new THREE.Mesh(cartGeo, plastic(g.model)), label = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({map: labelTexture(g)}));
  label.position.set(0, .012, CD / 2 + .002); grp.add(body, label); grp.userData.game = g; body.userData.cart = label.userData.cart = grp;
  pickables.push(body, label); carts.push(grp);
  return grp;
}
const ROWS = 4, PITCH = .36, LEDGE = .32;
function makeRack(id, list) {
  const ed = edition(id), cols = Math.max(1, Math.ceil(list.length / ROWS)), W = cols * PITCH + .16, grp = new THREE.Group(), k = new Kit(), frame = '#f4efe4';
  k.box(.05, 1.72, .3, frame, -W / 2, .86, 0, 0, 0, .7, 1.05).box(.05, 1.72, .3, frame, W / 2, .86, 0, 0, 0, .7, 1.05).box(W, 1.6, .03, '#2c2540', 0, .86, -.13, 0, 0, .7, 1);
  for (let r = 0; r < ROWS; r++) { const y = .16 + r * LEDGE; k.box(W, .03, .2, frame, 0, y, .02, 0, .12, .8, 1.05).box(W, .05, .02, ed.plastic, 0, y + .02, .125, 0, 0, .9, 1.1); }
  k.box(W + .1, .06, .34, frame, 0, .03, 0, 0, 0, .7, 1);
  grp.add(k.mesh(solid));
  // rótulo del modelo
  const sw = Math.max(W + .1, .86), sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, .26), new THREE.MeshBasicMaterial({map: tex(Math.round(sw * 150), 40, (x, w, h) => {
    x.fillStyle = ed.plastic; x.fillRect(0, 0, w, h); x.fillStyle = '#17122a'; x.fillRect(0, h - 5, w, 5);
    const dark = ed.dark; x.fillStyle = dark ? '#fff' : '#17122a'; x.font = `800 26px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(ed.model.toUpperCase(), w / 2, h / 2 - 1, w - 10);
  })}));
  sign.position.set(0, 1.86, .1); grp.add(sign);
  const sb = new THREE.Mesh(tint(new THREE.BoxGeometry(sw + .04, .3, .05), '#17122a', 1, 1), solid); sb.position.set(0, 1.86, .07); grp.add(sb);
  list.forEach((g, i) => { const c = makeCart(g), col = Math.floor(i / ROWS), row = ROWS - 1 - (i % ROWS); c.position.set(-W / 2 + .08 + PITCH / 2 + col * PITCH, .16 + row * LEDGE + CH / 2 + .035, .045); c.rotation.x = -.12; c.userData.home = {parent: grp, pos: c.position.clone(), rx: -.12}; grp.add(c); });
  grp.userData = {id, W, ed};
  return grp;
}
{
  const used = edIds.filter(id => games.some(g => g.model === id)), left = used.slice(0, 5), right = used.slice(5);
  const place = (ids, side) => {
    let z = -3.05;
    for (const id of ids) { const r = makeRack(id, games.filter(g => g.model === id)), W = r.userData.W; r.position.set(side * (ROOM.x - .2), 0, z + W / 2 + .05); r.rotation.y = -side * Math.PI / 2; z += W + .34; scene.add(r); racks.push(r); blob(side * (ROOM.x - .35), r.position.z, .8, W + .5, .02, .7); }
  };
  place(left, -1); place(right, 1);
}
// pósteres con carátulas de los juegos, sobre los expositores
{
  const picks = ['ceba', 'westieware', 'nagu-gavi', 'invoca', 'barcanueva', 'glup'].map(n => games.find(g => g.name === n)).filter(Boolean);
  picks.forEach((g, i) => {
    const t = new THREE.TextureLoader().load('../' + g.thumb.split('?')[0]); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
    const back = i < 2, m = new THREE.Mesh(new THREE.PlaneGeometry(.96, .6), new THREE.MeshLambertMaterial({map: t, emissive: '#fff', emissiveMap: t, emissiveIntensity: .35}));
    if (back) { m.position.set(i ? 2.05 : -2.05, 1.75, ROOM.z0 + .03); m.rotation.z = i ? -.05 : .04; }
    else { m.position.set((i - 3.5) * 1.15 * (i < 4 ? 1 : 1), 2.05 + (i % 2) * .5, ROOM.z0 + .03); m.scale.setScalar(.0001); }
    scene.add(m);
  });
}

// ── atrezo: neón, lámpara, vigas, puf, planta y cajas ──
{
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .62), new THREE.MeshBasicMaterial({transparent: true, map: tex(320, 60, (x, w, h) => {
    x.textBaseline = 'middle'; x.textAlign = 'center'; x.font = `800 46px ${FONT}`; x.shadowColor = '#ff5b35'; x.shadowBlur = 12; x.lineWidth = 3;
    x.strokeStyle = '#ffe95c'; x.strokeText('gavilanbe', w / 2 - 34, h / 2); x.shadowColor = '#35d0c0'; x.strokeStyle = '#7dfff0'; x.strokeText('64', w / 2 + 118, h / 2);
  })}));
  sign.position.set(0, 2.92, ROOM.z0 + .05); scene.add(sign);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.5), new THREE.MeshBasicMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: tex(32, 16, x => { const g = x.createRadialGradient(16, 8, 1, 16, 8, 16); g.addColorStop(0, 'rgba(255,170,90,.5)'); g.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 16); })}));
  glow.position.set(0, 2.92, ROOM.z0 + .04); scene.add(glow);
  const k = new Kit(), zc = (ROOM.z0 + ROOM.z1) / 2;
  for (let z = ROOM.z0 + 1; z < ROOM.z1; z += 1.9) k.box(ROOM.x * 2, .16, .2, '#4a2f5e', 0, ROOM.h - .08, z, 0, 0, .8, 1.1);
  // lámpara de techo
  k.cyl(.012, .012, .7, 4, '#17122a', 0, ROOM.h - .2, 3.4).cyl(.1, .46, .3, 10, '#ff5b35', 0, ROOM.h - .52, 3.4, 0, 0, .8, 1.15).cyl(.1, .1, .06, 8, '#fff6c8', 0, ROOM.h - .65, 3.4, 0, 0, 3, 3);
  // puf
  const puf = new THREE.SphereGeometry(.55, 9, 6); { const p = puf.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y < 0 ? y * .45 : y * .8 - Math.pow(Math.hypot(p.getX(i), p.getZ(i)) < .25 ? .12 : 0, 1)); } }
  k.add(puf, '#35d0c0', M4(1.55, .26, .9, .4), .55, 1.15);
  // planta
  k.cyl(.17, .12, .3, 8, '#c8643a', -2.2, .15, 4.6, 0, 0, .7, 1.1);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, leaf = new THREE.ConeGeometry(.09, .75, 4); k.add(leaf, i % 2 ? '#3fae4a' : '#2f8f3f', M4(-2.2 + Math.cos(a) * .16, .62, 4.6 + Math.sin(a) * .16, -a, 0, .5), .6, 1.25); }
  // cajas de juegos apiladas y revistas
  [['#ff5b35', 0], ['#ffd23f', .09], ['#7a4be6', -.06], ['#35d0c0', .12]].forEach(([c, r], i) => k.box(.5, .07, .36, c, 1.2, .035 + i * .07, -2.9, r, 0, .8, 1.1));
  k.box(.42, .02, .56, '#f4efe4', -1.5, .02, .4, .5).box(.42, .02, .56, '#ff5b8d', -1.44, .04, .46, .2);
  scene.add(k.mesh(solid));
  blob(1.55, .9, 1.7, 1.7, .02, .8); blob(-2.2, 4.6, .9, .9, .02, .8);
  const lampGlow = new THREE.PointLight('#ffd9a0', 6, 7, 1.5); lampGlow.position.set(0, 2.2, 1.2); scene.add(lampGlow);
}

// ── la pantalla de la tele ──────────────────────────
let selected = null, tvT0 = performance.now(), cover = null;
function drawTV(now) {
  const x = tvC.getContext('2d'), w = 256, h = 192, t = (now - tvT0) / 1000;
  if (selected && cover && t > .5) {
    x.drawImage(cover, 0, 0, w, 160); x.fillStyle = '#17122a'; x.fillRect(0, 150, w, 42); x.fillStyle = selected.ed.plastic; x.fillRect(0, 148, w, 4);
    x.fillStyle = '#ffe95c'; x.font = `800 22px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(selected.label.toUpperCase(), 10, 172, 150);
    if (Math.floor(t * 2.2) % 2) { x.fillStyle = '#fff'; x.font = `800 13px ${FONT}`; x.textAlign = 'right'; x.fillText('PULSA START', w - 10, 172); }
  } else {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2f8f'); g.addColorStop(1, '#0c0b2a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(255,255,255,${.25 + (i % 3) * .2})`; x.fillRect((i * 97 + t * (10 + i % 5 * 6)) % w, (i * 53) % h, 2, 2); }
    const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6']; x.lineWidth = 15; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); const a = t * 1.2 - .35 + i * 1.42; x.arc(128, 72, 30, a, a + 1.44); x.stroke(); });
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 30px ${FONT}`; x.lineWidth = 7; x.strokeStyle = '#0a0820'; x.strokeText('gavilanbe 64', 128, 140); x.fillStyle = '#ffe95c'; x.fillText('gavilanbe', 128 - x.measureText(' 64').width / 2, 140); x.fillStyle = '#ff5b35'; x.fillText('64', 128 + x.measureText('gavilanbe ').width / 2, 140);
    if (Math.floor(t * 2) % 2) { x.font = `800 12px ${FONT}`; x.fillStyle = '#fff'; x.fillText(selected ? 'CARGANDO…' : 'ELIGE UN CARTUCHO', 128, 170); }
  }
  x.fillStyle = 'rgba(0,0,0,.14)'; for (let y = 0; y < h; y += 2) x.fillRect(0, y, w, 1);
  tvT.needsUpdate = true;
}

// ── cámara: estaciones ──────────────────────────────
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const stations = {hero: {pos: V(0, 1.75, 5.9), at: V(0, .62, -2.6), name: 'La sala'}, tv: {pos: V(.55, .95, .75), at: V(0, .9, -3.6), name: 'La consola'}};
racks.forEach((r, i) => { const side = Math.sign(r.position.x), d = Math.max(1.75, r.userData.W * .75 + .9); stations['rack' + i] = {pos: V(r.position.x - side * d, 1.05, r.position.z), at: V(r.position.x, .9, r.position.z), name: r.userData.ed.model, rack: r}; });
let cur = 'hero', cam = {pos: stations.hero.pos.clone(), at: stations.hero.at.clone()}, ptr = {x: 0, y: 0};
const $ = id => document.getElementById(id);
function go(name) { cur = name; $('where').textContent = stations[name].name; $('hint').innerHTML = name === 'hero' ? 'Toca un expositor' : name === 'tv' ? '<kbd>START</kbd> jugar &nbsp; <kbd>B</kbd> volver' : 'Elige un cartucho &nbsp; <kbd>B</kbd> volver'; }
go('hero');

// ── elegir un cartucho ──────────────────────────────
const flights = [];
function fly(obj, to, dur, done) { flights.push({obj, from: {p: obj.position.clone(), q: obj.quaternion.clone()}, to, t: 0, dur, done}); }
function pick(g) {
  const cart = carts.find(c => c.userData.game === g); if (!cart || selected === g) return;
  if (selected) { const old = carts.find(c => c.userData.game === selected), h = old.userData.home; flights.length = 0; h.parent.add(old); old.position.copy(h.pos); old.rotation.set(h.rx, 0, 0); }
  selected = g; cover = null; tvT0 = performance.now();
  const i = new Image(); i.onload = () => { if (selected === g) cover = i; }; i.src = '../' + (g.thumb || '').split('?')[0];
  scene.attach(cart);
  fly(cart, {p: slot.clone().add(V(0, .75, 0)), q: new THREE.Quaternion(), arc: .9, spin: 1}, .9, () => fly(cart, {p: slot.clone(), q: new THREE.Quaternion()}, .22, () => { bump = 1; }));
  $('c-t').textContent = g.label; $('c-m').textContent = `${g.ed.model} · edición ${g.ed.name.toLowerCase()} · ${g.type === 'web' ? 'web' : 'terminal'}`; $('c-d').textContent = g.tagline.length > 150 ? g.tagline.slice(0, 148) + '…' : g.tagline; $('card').classList.add('on');
  go('tv');
}
let bump = 0;
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; });
canvas.addEventListener('click', e => {
  m2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(m2, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  if (hit && cur !== 'hero') return pick(hit.object.userData.cart.userData.game);
  const rk = ray.intersectObjects(racks, true)[0];
  if (rk) { let o = rk.object; while (o && !racks.includes(o)) o = o.parent; if (o) return go('rack' + racks.indexOf(o)); }
  if (ray.intersectObjects(scene.children.filter(o => o.name === 'tv'))[0]) return go('tv');
});
addEventListener('keydown', e => { if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') go('hero'); const n = Object.keys(stations); if (e.key === 'ArrowRight') go(n[(n.indexOf(cur) + 1) % n.length]); if (e.key === 'ArrowLeft') go(n[(n.indexOf(cur) + n.length - 1) % n.length]); if (e.key === 'Enter' && selected && selected.play) location.assign(selected.play); });

// ── bucle ───────────────────────────────────────────
let last = performance.now();
const tmp = V(0, 0, 0), yAxis = V(0, 1, 0), sq = new THREE.Quaternion();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const s = stations[cur], k = 1 - Math.exp(-dt * 3.2);
  cam.pos.lerp(s.pos, k); cam.at.lerp(s.at, k);
  camera.position.copy(cam.pos).add(tmp.set(ptr.x * .22, -ptr.y * .12 + Math.sin(now / 1700) * .02, 0));
  camera.lookAt(cam.at);
  for (const f of [...flights]) {
    f.t = Math.min(1, f.t + dt / f.dur); const e = f.t < .5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
    f.obj.position.lerpVectors(f.from.p, f.to.p, e); if (f.to.arc) f.obj.position.y += Math.sin(Math.PI * f.t) * f.to.arc;
    f.obj.quaternion.slerpQuaternions(f.from.q, f.to.q, e); if (f.to.spin) f.obj.quaternion.multiply(sq.setFromAxisAngle(yAxis, e * Math.PI * 2 * f.to.spin));
    if (f.t >= 1) { flights.splice(flights.indexOf(f), 1); f.done && f.done(); }
  }
  tvGlow.intensity = 5 + Math.sin(now / 90) * .25 + bump * 4; bump *= .9;
  drawTV(now);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.g64 = {go, pick, games, stations};
