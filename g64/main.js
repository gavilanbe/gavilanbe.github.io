// gavilanbe 64 · la habitación (segunda prueba): una maqueta en corte de un dormitorio de los 90 al atardecer.
// Estilo de la época (pocos polígonos, color por vértice, texturas pequeñas y bilineales), renderizado nítido.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EDITIONS, edition, splitTitle} from '../editions.js';

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, .5, 60);
let portrait = false;
function resize() { const a = innerWidth / innerHeight; portrait = a < .9; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = a; camera.updateProjectionMatrix(); }
resize(); addEventListener('resize', resize);

// ── utilidades de modelado ──────────────────────────
const C = h => new THREE.Color(h), V = (x, y, z) => new THREE.Vector3(x, y, z);
const M4 = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? V(s, s, s) : V(...s));
function tint(geo, hex, k0 = .72, k1 = 1.06) {     // color por vértice con degradado vertical
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  g.computeBoundingBox(); const {min, max} = g.boundingBox, c = C(hex), p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const t = max.y > min.y ? (p.getY(i) - min.y) / (max.y - min.y) : 1, k = k0 + (k1 - k0) * t; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(n)) g.deleteAttribute(n);
  return g;
}
class Kit {
  constructor(base = M4()) { this.parts = []; this.base = base; }
  add(geo, hex, m = M4(), k0, k1) { const g = tint(geo, hex, k0, k1); g.applyMatrix4(this.base.clone().multiply(m)); this.parts.push(g); return this; }
  box(w, h, d, hex, x, y, z, ry = 0, rx = 0, k0, k1) { return this.add(new THREE.BoxGeometry(w, h, d), hex, M4(x, y, z, ry, rx), k0, k1); }
  cyl(r0, r1, h, n, hex, x, y, z, rx = 0, rz = 0, k0, k1) { return this.add(new THREE.CylinderGeometry(r0, r1, h, n), hex, M4(x, y, z, 0, rx, rz), k0, k1); }
  mesh(mat = solid, shadow = true) { const m = new THREE.Mesh(mergeGeometries(this.parts), mat); m.castShadow = m.receiveShadow = shadow; return m; }
}
const solid = new THREE.MeshLambertMaterial({vertexColors: true});
// sección de «supercírculo»: n puntos de un rectángulo redondeado (e = 2 círculo, más alto = más cuadrado)
const squircle = (w, d, e, n, warp) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = warp ? warp(a) : 1; return [Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * w / 2 * k, Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * d / 2 * k]; });
// piel entre anillos: rings = [{y, pts:[[x,z]…]}], suavizada
function loft(rings, {capTop = true, capBottom = true} = {}) {
  const n = rings[0].pts.length, pos = [], idx = [];
  for (const r of rings) for (const [x, z] of r.pts) pos.push(x + (r.dx || 0), r.y, z + (r.dz || 0));
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * n + i, b = j * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
  const cap = (j, flip) => { const r = rings[j], o = pos.length / 3; pos.push(r.dx || 0, r.y, r.dz || 0); for (let i = 0; i < n; i++) { const a = j * n + i, b = j * n + (i + 1) % n; flip ? idx.push(o, a, b) : idx.push(o, b, a); } };
  if (capBottom) cap(0, true); if (capTop) cap(rings.length - 1, false);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const scaleRing = (pts, s, sz = s) => pts.map(([x, z]) => [x * s, z * sz]);
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(64);
const FONT = '"Bricolage Grotesque", Arial, sans-serif';
await document.fonts.load(`800 20px ${FONT}`).catch(() => 0);
const glowTex = tex(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const blobTex = tex(64, 64, x => { const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(8,4,24,.62)'); g.addColorStop(.6, 'rgba(8,4,24,.25)'); g.addColorStop(1, 'rgba(8,4,24,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
function blob(x, z, sx, sz, ry = 0, o = 1, y = .012) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({map: blobTex, transparent: true, depthWrite: false, opacity: o})); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y, z); m.renderOrder = 1; scene.add(m); return m; }
function glow(x, y, z, s, hex, o = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hex, opacity: o})); m.position.set(x, y, z); m.renderOrder = 5; scene.add(m); return m; }

// ── la habitación en corte ──────────────────────────
const R = {x0: -3, x1: 3.1, z0: -2.6, z1: 2.7, h: 3.05, t: .16};
const WIN = {z0: .55, z1: 2.05, y0: 1.15, y1: 2.4};
{
  const wood = tex(128, 128, (x, w, h) => {
    for (let r = 0; r < 4; r++) { const y = r * 32, off = (r % 2) * 40; for (let c = -1; c < 3; c++) { const v = rnd(); x.fillStyle = `hsl(${24 + v * 8},${50 + v * 12}%,${44 + v * 10}%)`; x.fillRect(c * 80 + off, y, 79, 31); } x.fillStyle = 'rgba(60,25,10,.55)'; x.fillRect(0, y + 31, w, 1); }
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,220,170' : '70,30,10'},.09)`; x.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 20, 1); }
  }, [3.4, 3]);
  const fl = new THREE.Mesh(tint(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0, 12, 10), '#ffffff', 1, 1), new THREE.MeshLambertMaterial({map: wood, vertexColors: true}));
  { const p = fl.geometry.attributes.position, c = fl.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + 3.05) / 6.1, v = (-p.getY(i) + 2.65) / 5.3, k = .62 + .4 * Math.min(1, Math.min(u * 3.2, v * 3.2)); c.setXYZ(i, k, k * .97, k * .95); } }   // esquinas más oscuras
  fl.rotation.x = -Math.PI / 2; fl.position.set((R.x0 + R.x1) / 2, 0, (R.z0 + R.z1) / 2); fl.receiveShadow = true; scene.add(fl);
  const k = new Kit(), cut = '#f6ead2', lower = '#2c7d86', upper = '#f1d3a4', rail = '#fff3dc';
  const W = R.x1 - R.x0, D = R.z1 - R.z0, xc = (R.x0 + R.x1) / 2, zc = (R.z0 + R.z1) / 2;
  // losa
  k.box(W + R.t, .3, D + R.t, '#3a2550', xc - R.t / 2, -.151, zc - R.t / 2, 0, 0, .55, 1);
  // pared del fondo
  k.box(W, 1.0, R.t, lower, xc, .5, R.z0 - R.t / 2, 0, 0, .62, 1).box(W, R.h - 1.0, R.t, upper, xc, 1.0 + (R.h - 1) / 2, R.z0 - R.t / 2, 0, 0, .86, 1.04).box(W, .07, .05, rail, xc, 1.0, R.z0 + .02).box(W, .12, .04, '#1d5a62', xc, .06, R.z0 + .02);
  // pared izquierda con el hueco de la ventana
  const lw = (z0, z1, y0, y1, hex, k0, k1) => k.box(R.t, y1 - y0, z1 - z0, hex, R.x0 - R.t / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, 0, k0, k1);
  lw(R.z0 - R.t, R.z1, 0, 1.0, lower, .62, 1);
  lw(R.z0 - R.t, WIN.z0, 1.0, R.h, upper, .86, 1.04); lw(WIN.z1, R.z1, 1.0, R.h, upper, .86, 1.04); lw(WIN.z0, WIN.z1, 1.0, WIN.y0, upper, 1, 1); lw(WIN.z0, WIN.z1, WIN.y1, R.h, upper, 1, 1.04);
  k.box(.05, .07, D, rail, R.x0 + .02, 1.0, zc).box(.04, .12, D, '#1d5a62', R.x0 + .02, .06, zc);
  // cantos del corte
  k.box(W + R.t, .03, R.t, cut, xc - R.t / 2, R.h + .015, R.z0 - R.t / 2, 0, 0, 1, 1).box(R.t, .03, D, cut, R.x0 - R.t / 2, R.h + .015, zc, 0, 0, 1, 1);
  // marco de la ventana y cruceta
  const wz = (WIN.z0 + WIN.z1) / 2, wy = (WIN.y0 + WIN.y1) / 2, ww = WIN.z1 - WIN.z0, wh = WIN.y1 - WIN.y0;
  k.box(.22, .06, ww + .16, rail, R.x0 - .04, WIN.y0 - .02, wz).box(.2, .06, ww + .12, rail, R.x0 - .06, WIN.y1 + .02, wz).box(.2, wh, .06, rail, R.x0 - .06, wy, WIN.z0).box(.2, wh, .06, rail, R.x0 - .06, wy, WIN.z1).box(.05, wh, .04, rail, R.x0 - .08, wy, wz).box(.05, .04, ww, rail, R.x0 - .08, wy, wz);
  // barra y cortinas
  k.cyl(.02, .02, ww + .6, 6, '#7a4a2a', R.x0 + .09, WIN.y1 + .16, wz, Math.PI / 2);
  for (const [z, s] of [[WIN.z0 - .12, 1], [WIN.z1 + .12, -1]]) { const cg = new THREE.PlaneGeometry(.5, wh + .34, 6, 1); const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * .035); cg.rotateY(Math.PI / 2); k.add(cg, '#ff6f4f', M4(R.x0 + .09, wy - .02, z + s * .1), .7, 1.1); }
  const room = k.mesh(); scene.add(room);
  // cielo de atardecer tras la ventana
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({map: tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a3fb0'); g.addColorStop(.5, '#ff7a6b'); g.addColorStop(.85, '#ffc56b'); g.addColorStop(1, '#ffe9a8'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#fff6c8'; x.beginPath(); x.arc(40, 50, 9, 0, 7); x.fill(); x.fillStyle = 'rgba(90,50,140,.55)'; x.beginPath(); x.ellipse(18, 30, 16, 4, 0, 0, 7); x.ellipse(50, 20, 12, 3, 0, 0, 7); x.fill(); })}));
  sky.rotation.y = Math.PI / 2; sky.position.set(R.x0 - .12, wy, wz); scene.add(sky);
  glow(R.x0 + .06, wy, wz, 3.6, '#ff9a5c', .55).rotation.y = Math.PI / 2;
  // sombras de rincón
  blob(xc, R.z0 + .1, W * 1.2, 1.2, 0, .75, .008); blob(R.x0 + .1, zc, D * 1.2, 1.2, Math.PI / 2, .75, .008);
}

// ── luces: atardecer por la ventana, lámpara cálida y la tele ──
scene.add(new THREE.HemisphereLight('#a9a0ff', '#5a3b52', 1.25));
const sunL = new THREE.DirectionalLight('#ffab66', 3.4); sunL.position.set(-9, 5.2, 3.2); sunL.target.position.set(.6, 0, .2); scene.add(sunL, sunL.target);
sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); Object.assign(sunL.shadow.camera, {left: -5, right: 5, top: 5, bottom: -4, near: 1, far: 22}); sunL.shadow.bias = -.0006; sunL.shadow.normalBias = .02; sunL.shadow.radius = 3;
const fill = new THREE.DirectionalLight('#a9a6ff', 1.15); fill.position.set(6, 7, 8); scene.add(fill);
const lampL = new THREE.PointLight('#ffc27a', 5, 5, 1.7); scene.add(lampL);
const tvL = new THREE.PointLight('#8fd0ff', 7, 5, 1.5); scene.add(tvL);

// ── la tele, en la esquina y mirando a la sala ──────
const TVP = V(-2.0, 0, -1.65), TVR = Math.PI / 4, tvDir = V(Math.sin(TVR), 0, Math.cos(TVR));
const tvC = document.createElement('canvas'); tvC.width = 320; tvC.height = 240;
const tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace; tvT.minFilter = tvT.magFilter = THREE.LinearFilter; tvT.generateMipmaps = false;
const SCREEN_Y = 1.24;
{
  const base = M4(TVP.x, 0, TVP.z, TVR), k = new Kit(base);
  // mueble
  k.add(loft([{y: 0, pts: squircle(1.75, .95, 6, 20)}, {y: .04, pts: squircle(1.8, 1, 6, 20)}, {y: .56, pts: squircle(1.8, 1, 6, 20)}, {y: .6, pts: squircle(1.74, .94, 6, 20)}]), '#a5673a', M4(), .55, 1.08);
  k.box(1.5, .4, .04, '#3a2014', 0, .3, .49, 0, 0, .8, 1).box(.9, .13, .5, '#26252d', -.22, .21, .26, 0, 0, .8, 1.2).box(.8, .012, .02, '#0c0b10', -.22, .22, .515).box(.05, .025, .02, '#39ff7a', .14, .18, .515, 0, 0, 2, 2);
  ['#ff5b35', '#35d0c0', '#ffd23f', '#7a4be6', '#f4efe4', '#ff5b8d'].forEach((c, i) => k.box(.055, .26 + (i % 3) * .025, .3, c, .32 + i * .062, .25 + (i % 3) * .012, .3, 0, 0, .75, 1.05));
  // carcasa: delante grande, detrás estrecha (el loft se construye en vertical y se tumba)
  const sec = (w, h, e) => squircle(w, h, e, 24);
  const shell = loft([[-.5, .62, .58], [-.2, .86, .82], [.1, 1, 1], [.3, 1.02, 1.02], [.38, 1, 1]].map(([z, sw, sh]) => ({y: z, pts: scaleRing(sec(1.5, 1.22, 5), sw, sh)}))); shell.rotateX(Math.PI / 2);
  k.add(shell, '#4b4958', M4(0, 1.24, 0), .62, 1.12);
  const bezel = loft([{y: .38, pts: sec(1.5, 1.22, 5)}, {y: .42, pts: sec(1.44, 1.16, 5)}, {y: .42, pts: sec(1.22, .92, 4.5)}, {y: .37, pts: sec(1.16, .88, 4.5)}], {capBottom: false, capTop: false}); bezel.rotateX(Math.PI / 2);
  k.add(bezel, '#5b5968', M4(0, 1.24, 0), .7, 1.15);
  k.box(1.2, .9, .02, '#0a0a10', 0, SCREEN_Y, .355, 0, 0, 1, 1);
  // rejilla y mandos bajo la pantalla
  for (let i = 0; i < 10; i++) k.box(.014, .07, .02, '#22212a', -.52 + i * .036, .72, .42);
  k.cyl(.03, .03, .03, 10, '#d8d3c8', .3, .72, .425, Math.PI / 2).cyl(.03, .03, .03, 10, '#d8d3c8', .4, .72, .425, Math.PI / 2).box(.045, .045, .025, '#ff3b30', .52, .72, .42, 0, 0, 1.6, 1.6);
  // antena de conejo
  k.cyl(.1, .13, .05, 10, '#26252d', 0, 1.88, -.05).cyl(.009, .009, .85, 5, '#d8d3c8', -.27, 2.25, -.05, 0, .62).cyl(.009, .009, .85, 5, '#d8d3c8', .27, 2.25, -.05, 0, -.62);
  scene.add(k.mesh());
  const sg = new THREE.PlaneGeometry(1.1, .82, 10, 8); { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / .55, v = p.getY(i) / .41; p.setZ(i, (1 - u * u) * .035 + (1 - v * v) * .03); } }
  const scr = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({map: tvT})); scr.applyMatrix4(base.clone().multiply(M4(0, SCREEN_Y, .37))); scr.name = 'tv'; scene.add(scr);
  const gp = V(0, SCREEN_Y, .6).applyMatrix4(base); glow(gp.x, gp.y, gp.z, 3.2, '#9fd4ff', .5).rotation.y = TVR;
  tvL.position.copy(V(0, SCREEN_Y, 1.0).applyMatrix4(base));
  blob(TVP.x + .15, TVP.z + .15, 2.8, 2.2, -TVR, .9);
}

// ── la consola gavilanbe 64 ─────────────────────────
const CONP = TVP.clone().addScaledVector(tvDir, 1.72), CONR = TVR;
const conBase = M4(CONP.x, 0, CONP.z, CONR);
{
  const k = new Kit(conBase), body = '#3f3d4c';
  // planta con dos lóbulos delante (las «patas» de la consola)
  const warp = a => 1 + .13 * Math.exp(-Math.pow((a - 1.0) / .34, 2)) + .13 * Math.exp(-Math.pow((a - (Math.PI - 1.0)) / .34, 2));
  const plan = squircle(1.12, .82, 3.2, 40, warp);
  k.add(loft([{y: .0, pts: scaleRing(plan, .93)}, {y: .03, pts: scaleRing(plan, .99)}, {y: .1, pts: plan}, {y: .15, pts: scaleRing(plan, .97)}, {y: .19, pts: scaleRing(plan, .88)}, {y: .215, pts: scaleRing(plan, .72)}, {y: .225, pts: scaleRing(plan, .5)}]), body, M4(), .5, 1.2);
  // lomo con la boca
  const hp = squircle(.62, .5, 4, 28);
  k.add(loft([{y: .19, pts: hp, dz: -.04}, {y: .27, pts: scaleRing(hp, .93), dz: -.04}, {y: .3, pts: scaleRing(hp, .82), dz: -.04}, {y: .305, pts: scaleRing(hp, .7), dz: -.04}]), '#4d4b5c', M4(), .75, 1.2);
  k.box(.4, .02, .1, '#08080c', 0, .302, -.04, 0, 0, 1, 1).box(.44, .012, .13, '#2a2934', 0, .3, -.04);
  // POWER y RESET: dos botones grandes
  for (const [sx, c] of [[-1, '#ff5b35'], [1, '#b9f02a']]) { k.add(loft([{y: .2, pts: squircle(.2, .13, 3, 14)}, {y: .235, pts: squircle(.19, .12, 3, 14)}, {y: .245, pts: squircle(.15, .09, 3, 14)}]), c, M4(sx * .4, 0, .12), .8, 1.25); k.box(.24, .012, .17, '#2a2934', sx * .4, .2, .12); }
  // cuatro puertos
  for (let i = 0; i < 4; i++) { const px = -.27 + i * .18; k.add(loft([{y: 0, pts: squircle(.13, .07, 3, 12)}, {y: .03, pts: squircle(.125, .065, 3, 12)}]).rotateX(Math.PI / 2), '#191820', M4(px, .095, .385), 1, 1).cyl(.022, .022, .02, 8, '#807c8c', px, .095, .42, Math.PI / 2); }
  k.box(.03, .018, .02, '#ff3b30', .47, .13, .4, 0, 0, 2, 2);
  // ranuras de ventilación a los lados del lomo
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) k.box(.012, .008, .16, '#24232c', sx * (.36 + i * .028), .214 - i * .004, -.2);
  scene.add(k.mesh());
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(.17, .17), new THREE.MeshBasicMaterial({transparent: true, map: tex(64, 64, x => { const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6']; x.lineWidth = 13; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); x.arc(32, 32, 20, -.35 + i * 1.42, -.35 + (i + 1) * 1.42 + .02); x.stroke(); }); x.fillStyle = '#ff5b35'; x.fillRect(32, 26, 22, 12); })}));
  badge.applyMatrix4(conBase.clone().multiply(M4(0, .222, .27, 0, -Math.PI / 2))); scene.add(badge);
  const led = V(.47, .14, .44).applyMatrix4(conBase); glow(led.x, led.y, led.z, .3, '#ff4a3a', .9).rotation.y = CONR;
  blob(CONP.x, CONP.z, 2.0, 1.6, -CONR);
}
const slot = V(0, .33, -.04).applyMatrix4(conBase);
const conQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, CONR, 0));

// ── alfombra, mando y cable ─────────────────────────
{
  const rug = tex(128, 128, x => { const cols = ['#17122a', '#ff5b35', '#ffd23f', '#35d0c0', '#3b2a78']; cols.forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(64, 64, 64 - i * 9, 0, 7); x.fill(); }); x.fillStyle = '#ff8fb0'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.beginPath(); x.arc(64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20, 3, 0, 7); x.fill(); } x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.57, r = i % 2 ? 5 : 11; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.fill(); });
  const r = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshLambertMaterial({map: rug, transparent: true})); r.rotation.x = -Math.PI / 2; r.position.set(CONP.x + tvDir.x * .35, .006, CONP.z + tvDir.z * .35); r.receiveShadow = true; scene.add(r);
  const cp = CONP.clone().addScaledVector(tvDir, 1.05).add(V(-.55, 0, .35)), base = M4(cp.x, 0, cp.z, CONR - .5), k = new Kit(base), g = '#dcd7cc';
  // cuerpo y tres cuernos, suavizados
  k.add(loft([{y: 0, pts: squircle(.66, .25, 3, 20)}, {y: .05, pts: squircle(.7, .29, 3, 20)}, {y: .09, pts: squircle(.66, .25, 3, 20)}, {y: .105, pts: squircle(.5, .16, 3, 20)}]), g, M4(0, .03, 0), .7, 1.12);
  const prong = (x, len, ry, r0 = .068) => k.add(new THREE.CapsuleGeometry(r0, len, 4, 10), g, M4(x, .075, .1 + len / 2, ry, Math.PI / 2 - .1, 0, [1, 1, .82]), .7, 1.12);
  prong(-.25, .3, -.24); prong(0, .36, 0, .064); prong(.25, .3, .24);
  k.box(.046, .018, .13, '#34333c', -.22, .142, 0).box(.13, .018, .046, '#34333c', -.22, .142, 0);
  k.cyl(.036, .046, .03, 10, '#34333c', 0, .13, .14).cyl(.016, .016, .05, 6, '#8f8b96', 0, .165, .14).cyl(.036, .03, .018, 10, '#c9c5d0', 0, .195, .14);
  k.cyl(.032, .034, .026, 10, '#ff5b35', .25, .145, .035, 0, 0, .9, 1.25).cyl(.032, .034, .026, 10, '#b9f02a', .175, .145, -.03, 0, 0, .9, 1.25);
  for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) k.cyl(.017, .019, .022, 8, '#7a4be6', .285 + dx * .04, .143, -.085 + dz * .04, 0, 0, .9, 1.3);
  k.cyl(.02, .02, .018, 8, '#ff3b30', 0, .14, -.02);
  scene.add(k.mesh());
  const a = V(0, .07, -.13).applyMatrix4(base), b = V(-.27, .095, .43).applyMatrix4(conBase), mid = a.clone().lerp(b, .5).add(V(.25, 0, .2)); mid.y = .015;
  const cable = new THREE.Mesh(tint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, .5).setY(.02), mid, b.clone().lerp(mid, .4).setY(.02), b]), 24, .012, 5), '#24232c', 1, 1), solid); cable.castShadow = true; scene.add(cable);
  blob(cp.x, cp.z + .12, 1.0, 1.0, 0, .85);
}

// ── cartuchos y la pared de la colección ────────────
const edIds = Object.keys(EDITIONS);
const games = GAMES.map(g => ({...g, ...splitTitle(g.title), ed: edition(g.model)})).sort((a, b) => edIds.indexOf(a.model) - edIds.indexOf(b.model) || a.label.localeCompare(b.label, 'es'));
const CW = .235, CH = .17, CD = .042;
const cartGeo = (() => {
  const s = new THREE.Shape(), w = CW / 2, h = CH / 2;
  [[-w, -h], [w, -h], [w, h * .15], [w * .94, h * .28], [w * .94, h * .52], [w, h * .66], [w, h * .78], [w * .86, h], [w * .5, h * 1.1], [-w * .5, h * 1.1], [-w * .86, h], [-w, h * .78], [-w, h * .66], [-w * .94, h * .52], [-w * .94, h * .28], [-w, h * .15]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  const g = new THREE.ExtrudeGeometry(s, {depth: CD - .014, bevelEnabled: true, bevelThickness: .007, bevelSize: .007, bevelSegments: 2}); g.translate(0, 0, -CD / 2 + .007);
  const k = new Kit(); k.add(g, '#ffffff', M4(), .6, 1.12).box(CW * .78, .016, CD * .5, '#4a4852', 0, -CH / 2 - .006, 0, 0, 0, 1, 1);
  return mergeGeometries(k.parts);
})();
const labelGeo = new THREE.PlaneGeometry(CW * .8, CW * .8 / 1.6);
const plastics = new Map();
const plastic = id => { if (!plastics.has(id)) { const e = edition(id), o = e.mat && e.mat.opacity; plastics.set(id, new THREE.MeshLambertMaterial({vertexColors: true, color: e.plastic, transparent: !!o, opacity: o ? Math.min(.92, o + .14) : 1, emissive: C(e.plastic).multiplyScalar(.16)})); } return plastics.get(id); };
function labelTexture(g) {
  const ed = g.ed, t = tex(160, 100, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, ed.studio); gr.addColorStop(1, ed.plastic); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#17122a'; x.font = `800 26px ${FONT}`; x.textAlign = 'center'; x.fillText(g.label.toUpperCase().slice(0, 9), w / 2, h / 2 + 9, w - 12); x.strokeStyle = '#f4efe4'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); });
  if (g.thumb) { const i = new Image(); i.onload = () => { const x = t.image.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, 160, 100); if (g.type !== 'web') { x.fillStyle = '#0c120d'; x.fillRect(0, 0, 36, 16); x.fillStyle = '#7dff9c'; x.font = 'bold 12px monospace'; x.textAlign = 'left'; x.fillText('>_', 5, 12); } x.strokeStyle = '#f4efe4'; x.lineWidth = 4; x.strokeRect(2, 2, 156, 96); t.needsUpdate = true; }; i.src = '../' + g.thumb.replace(/^thumbs\/([^/?]+)\.\w+/, 'thumbs/s/$1.webp'); }
  return t;
}
const carts = [], pickables = [];
function makeCart(g) {
  const grp = new THREE.Group(), body = new THREE.Mesh(cartGeo, plastic(g.model)), t = labelTexture(g), label = new THREE.Mesh(labelGeo, new THREE.MeshLambertMaterial({map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .5}));
  body.castShadow = true; label.position.set(0, -.008, CD / 2 + .0015); grp.add(body, label); grp.userData.game = g; body.userData.cart = label.userData.cart = grp;
  pickables.push(body, label); carts.push(grp);
  return grp;
}
const ROWS = 6, PX = .272, PY = .262, SH = {x0: -1.22, y0: .34, z: R.z0 + .16};
{
  const used = edIds.filter(id => games.some(g => g.model === id)), k = new Kit(), frame = '#fff3dc';
  let col = 0;
  for (const id of used) {
    const list = games.filter(g => g.model === id), ed = edition(id), cols = Math.ceil(list.length / ROWS), x0 = SH.x0 + col * PX, w = cols * PX;
    // fondo del bloque en el color del modelo, separador y rótulo
    k.box(w - .02, ROWS * PY + .04, .02, ed.plastic, x0 + w / 2, SH.y0 + ROWS * PY / 2, SH.z - .13, 0, 0, .28, .5);
    k.box(.024, ROWS * PY + .1, .22, frame, x0, SH.y0 + ROWS * PY / 2, SH.z - .03, 0, 0, .78, 1.03);
    const sw = Math.max(w - .03, .24), sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, .15), new THREE.MeshBasicMaterial({map: tex(Math.round(sw * 300), 46, (x, W, H) => { x.fillStyle = ed.plastic; x.fillRect(0, 0, W, H); x.fillStyle = ed.dark ? '#fff' : '#17122a'; x.font = `800 30px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillText(ed.model.toUpperCase(), W / 2, H / 2 + 1, W - 10); })}));
    sign.position.set(x0 + w / 2, SH.y0 + ROWS * PY + .13, SH.z + .085); scene.add(sign);
    list.forEach((g, i) => { const c = makeCart(g), cc = Math.floor(i / ROWS), rr = i % ROWS; c.position.set(x0 + PX / 2 + cc * PX, SH.y0 + (ROWS - 1 - rr) * PY + CH / 2 + .03, SH.z + .02); c.rotation.x = -.1; c.userData.home = {pos: c.position.clone(), rx: -.1}; scene.add(c); });
    col += cols;
  }
  const W = col * PX, xc = SH.x0 + W / 2;
  k.box(.024, ROWS * PY + .1, .22, frame, SH.x0 + W, SH.y0 + ROWS * PY / 2, SH.z - .03, 0, 0, .78, 1.03);
  for (let r = 0; r <= ROWS; r++) k.box(W + .02, .022, r === ROWS ? .24 : .2, frame, xc, SH.y0 + r * PY, SH.z - .03, 0, 0, .86, 1.03);
  k.box(W + .06, .19, .05, '#17122a', xc, SH.y0 + ROWS * PY + .13, SH.z + .055).box(W + .08, SH.y0, .26, '#8a5530', xc, SH.y0 / 2, SH.z - .03, 0, 0, .6, 1.05);
  scene.add(k.mesh());
  SH.x1 = SH.x0 + W; SH.xc = xc;
  blob(xc, SH.z + .25, W * 1.15, 1.0, 0, .8);
  // neón sobre la colección
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .52), new THREE.MeshBasicMaterial({transparent: true, map: tex(512, 92, (x, w, h) => { x.textBaseline = 'middle'; x.textAlign = 'center'; x.font = `800 70px ${FONT}`; x.lineJoin = 'round'; for (const [blur, lw] of [[22, 7], [8, 4], [0, 2.5]]) { x.shadowBlur = blur; x.lineWidth = lw; x.shadowColor = '#ff7a3a'; x.strokeStyle = blur ? '#ffb14a' : '#fff3c4'; x.strokeText('gavilanbe', w / 2 - 52, h / 2); x.shadowColor = '#35e0d0'; x.strokeStyle = blur ? '#55efe0' : '#eafffb'; x.strokeText('64', w / 2 + 182, h / 2); } })}));
  neon.position.set(xc, 2.56, R.z0 + .03); scene.add(neon);
  glow(xc - .3, 2.56, R.z0 + .05, 3.4, '#ff8a3a', .32); glow(xc + 1.1, 2.56, R.z0 + .05, 1.8, '#35e0d0', .35);
  const nl = new THREE.PointLight('#ffb070', 2.5, 4, 1.5); nl.position.set(xc, 2.5, R.z0 + .6); scene.add(nl);
}

// ── muebles y atrezo ────────────────────────────────
{
  const k = new Kit();
  // cama bajo la ventana
  const bx = R.x0 + .62, bz0 = .35, bz1 = 2.55, bzc = (bz0 + bz1) / 2, bl = bz1 - bz0;
  k.box(1.16, .22, bl, '#8a5530', bx, .2, bzc, 0, 0, .6, 1.05).box(1.2, .75, .08, '#8a5530', bx, .42, bz1 - .02, 0, 0, .6, 1.08);
  for (const sx of [-1, 1]) for (const z of [bz0 + .08, bz1 - .1]) k.cyl(.045, .035, .12, 6, '#5d3418', bx + sx * .5, .06, z);
  k.add(loft([{y: .3, pts: squircle(1.1, bl - .06, 6, 24)}, {y: .44, pts: squircle(1.12, bl - .04, 6, 24)}, {y: .5, pts: squircle(1.04, bl - .12, 6, 24)}]), '#f6ead2', M4(bx, 0, bzc), .78, 1.05);
  // edredón con ondas y almohada
  const dv = new THREE.PlaneGeometry(1.2, bl * .66, 10, 10); { const p = dv.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setZ(i, .03 + Math.sin(u * 7 + v * 3) * .014 + Math.sin(v * 9) * .01 - Math.pow(Math.abs(u) / .6, 6) * .16); } } dv.rotateX(-Math.PI / 2);
  const duvet = new THREE.Mesh(tint(dv, '#ffffff', 1, 1), new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide, map: tex(64, 64, (x, w, h) => { x.fillStyle = '#3b2a78'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23f'; for (const [a, b] of [[12, 14], [44, 46]]) { x.beginPath(); x.moveTo(a, b - 7); x.lineTo(a + 7, b + 5); x.lineTo(a - 7, b + 5); x.fill(); } x.strokeStyle = '#35d0c0'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(34, 14); x.quadraticCurveTo(41, 4, 48, 14); x.quadraticCurveTo(55, 24, 62, 14); x.stroke(); x.strokeStyle = '#ff5b8d'; x.beginPath(); x.moveTo(4, 50); x.lineTo(11, 42); x.lineTo(18, 50); x.lineTo(25, 42); x.stroke(); x.fillStyle = '#ff5b35'; x.beginPath(); x.arc(52, 38, 4, 0, 7); x.fill(); }, [3, 4])}));
  duvet.position.set(bx, .5, bz0 + bl * .33 + .02); duvet.castShadow = duvet.receiveShadow = true; scene.add(duvet);
  k.add(loft([{y: 0, pts: squircle(.72, .42, 4, 16)}, {y: .07, pts: squircle(.8, .5, 3, 16)}, {y: .13, pts: squircle(.6, .34, 3, 16)}]), '#fff6e6', M4(bx, .5, bz1 - .38), .8, 1.05);
  // mesilla con despertador
  const nx = R.x0 + .42, nz = -.12;
  k.box(.6, .5, .5, '#a5673a', nx, .25, nz, 0, 0, .6, 1.05).box(.5, .16, .02, '#7a4826', nx, .34, nz + .255).box(.5, .16, .02, '#7a4826', nx, .14, nz + .255).cyl(.02, .02, .03, 6, '#ffd23f', nx, .34, nz + .275, Math.PI / 2).cyl(.02, .02, .03, 6, '#ffd23f', nx, .14, nz + .275, Math.PI / 2);
  k.box(.2, .13, .09, '#ff5b35', nx + .12, .57, nz + .1, .3, 0, .8, 1.1).box(.14, .07, .01, '#b9ffcf', nx + .135, .575, nz + .15, .3, 0, 1.8, 1.8);
  // lamparita en la mesilla
  const lx = nx - .08, lz = nz - .08;
  k.cyl(.09, .11, .04, 10, '#26252d', lx, .52, lz).cyl(.018, .018, .3, 6, '#ffd23f', lx, .68, lz);
  k.add(loft([{y: 0, pts: squircle(.36, .36, 2, 14)}, {y: .24, pts: squircle(.2, .2, 2, 14)}], {capBottom: false}), '#ffcf7a', M4(lx, .8, lz), 1.6, 1.3);
  lampL.position.set(lx + .25, 1.0, lz + .25);
  // puf
  const puf = new THREE.SphereGeometry(.62, 16, 10); { const p = puf.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i)); p.setY(i, y < 0 ? y * .5 : y * .78 - Math.max(0, .34 - r) * .5); } puf.computeVertexNormals(); }
  k.add(puf, '#35c0b4', M4(1.75, .31, 1.55, .4), .5, 1.18);
  // monopatín apoyado, cajas, revistas, planta y balón
  k.box(.24, .025, .82, '#ff5b8d', -.7, .1, 2.2, 1.1, 0, .8, 1.1); for (const [dx, dz] of [[-.09, -.26], [.09, -.26], [-.09, .26], [.09, .26]]) { const w = V(dx, 0, dz).applyEuler(new THREE.Euler(0, 1.1, 0)); k.cyl(.04, .04, .035, 8, '#ffd23f', -.7 + w.x, .04, 2.2 + w.z, 0, Math.PI / 2); }
  [['#ff5b35', 0], ['#ffd23f', .12], ['#7a4be6', -.08], ['#35d0c0', .15], ['#f4efe4', -.04]].forEach(([c, r], i) => k.box(.46, .065, .33, c, 2.72, .033 + i * .066, -1.55, r, 0, .78, 1.08));
  k.box(.36, .016, .48, '#f4efe4', .35, .012, 1.05, .6).box(.36, .016, .48, '#ffd23f', .42, .028, 1.1, .25).box(.36, .016, .48, '#ff5b35', .3, .044, 1.18, -.2);
  k.cyl(.2, .14, .34, 10, '#e06a3c', 2.72, .17, .55, 0, 0, .7, 1.1);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; k.add(new THREE.ConeGeometry(.1, .8 + (i % 3) * .15, 4), i % 2 ? '#3fae4a' : '#2a8a3c', M4(2.72 + Math.cos(a) * .2, .72, .55 + Math.sin(a) * .2, Math.PI / 2 - a, .5, 0), .55, 1.3); }
  k.add(new THREE.IcosahedronGeometry(.16, 1), '#ffd23f', M4(.5, .16, 2.25), .6, 1.15);
  // reloj de pared
  k.cyl(.2, .2, .04, 14, '#fff3dc', R.x0 + .03, 2.55, -1.0, 0, Math.PI / 2).cyl(.17, .17, .045, 14, '#17122a', R.x0 + .035, 2.55, -1.0, 0, Math.PI / 2, 1, 1).box(.012, .13, .02, '#ffd23f', R.x0 + .065, 2.6, -1.0).box(.012, .02, .1, '#ff5b35', R.x0 + .065, 2.55, -.96);
  scene.add(k.mesh());
  glow(lx + .1, .95, lz + .1, 1.5, '#ffc27a', .6).rotation.y = Math.PI / 4;
  blob(bx + .1, bzc, 1.9, bl + .6, 0, .9); blob(nx, nz, 1.1, 1.0, 0, .8); blob(1.75, 1.55, 1.8, 1.8, 0, .9); blob(2.72, -1.55, .9, .8, 0, .8); blob(2.72, .55, .9, .9, 0, .7); blob(.5, 2.25, .5, .5, 0, .8); blob(-.7, 2.2, .9, .6, 0, .6);
  const poster = (name, x, y, z, ry, w, rz = 0) => { const g = games.find(q => q.name === name); if (!g || !g.thumb) return; const t = new THREE.TextureLoader().load('../' + g.thumb.split('?')[0]); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 1.6), new THREE.MeshLambertMaterial({map: t, emissive: '#fff', emissiveMap: t, emissiveIntensity: .3})); m.position.set(x, y, z); m.rotation.set(0, ry, rz); const f = new THREE.Mesh(new THREE.PlaneGeometry(w + .06, w / 1.6 + .06), new THREE.MeshLambertMaterial({color: '#fff3dc'})); f.position.set(x - Math.sin(ry) * .004, y, z - Math.cos(ry) * .004); f.rotation.copy(m.rotation); scene.add(f, m); };
  poster('ceba', R.x0 + .012, 2.0, -.55, Math.PI / 2, .95, .03); poster('westieware', R.x0 + .012, 2.5, -1.75, Math.PI / 2, .6, -.04); poster('nagu-gavi', -2.25, 2.55, R.z0 + .012, 0, .8, .03);
}

// ── la pantalla de la tele ──────────────────────────
let selected = null, tvT0 = performance.now(), cover = null;
function drawTV(now) {
  const x = tvC.getContext('2d'), w = 320, h = 240, t = (now - tvT0) / 1000;
  if (selected && cover && t > .55) {
    x.drawImage(cover, 0, 0, w, 200); x.fillStyle = '#17122a'; x.fillRect(0, 188, w, 52); x.fillStyle = selected.ed.plastic; x.fillRect(0, 185, w, 5);
    x.fillStyle = '#ffe95c'; x.font = `800 27px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(selected.label.toUpperCase(), 12, 215, 190);
    if (Math.floor(t * 2.2) % 2) { x.fillStyle = '#fff'; x.font = `800 15px ${FONT}`; x.textAlign = 'right'; x.fillText('PULSA START', w - 12, 215); }
  } else {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2338b0'); g.addColorStop(1, '#0c0b2a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(255,255,255,${.25 + (i % 3) * .2})`; x.fillRect((i * 97 + t * (10 + i % 5 * 6)) % w, (i * 53) % h, 2, 2); }
    const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6']; x.lineWidth = 19; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); const a = t * 1.2 - .35 + i * 1.42; x.arc(160, 88, 38, a, a + 1.44); x.stroke(); });
    x.textBaseline = 'middle'; x.font = `800 38px ${FONT}`; x.lineWidth = 8; x.lineJoin = 'round'; x.strokeStyle = '#0a0820'; x.textAlign = 'center'; x.strokeText('gavilanbe 64', 160, 172); const w1 = x.measureText('gavilanbe 64').width, wg = x.measureText('gavilanbe ').width; x.textAlign = 'left'; x.fillStyle = '#ffe95c'; x.fillText('gavilanbe', 160 - w1 / 2, 172); x.fillStyle = '#ff5b35'; x.fillText('64', 160 - w1 / 2 + wg, 172);
    if (Math.floor(t * 2) % 2) { x.textAlign = 'center'; x.font = `800 14px ${FONT}`; x.fillStyle = '#fff'; x.fillText(selected ? 'CARGANDO…' : 'ELIGE UN CARTUCHO', 160, 212); }
  }
  x.fillStyle = 'rgba(0,0,0,.13)'; for (let y = 0; y < h; y += 2) x.fillRect(0, y, w, 1);
  tvT.needsUpdate = true;
}

// ── cámara: la maqueta, la pared y la tele ──────────
const scrW = V(0, SCREEN_Y, .4).applyMatrix4(M4(TVP.x, 0, TVP.z, TVR));
const stations = {
  hero: {pos: V(8.4, 6.0, 9.6), at: V(.15, 1.0, -.1), name: 'La habitación', fov: 27, pfov: 52},
  wall: {pos: V(SH.xc, 1.22, 1.75), at: V(SH.xc, 1.2, R.z0), name: 'La colección', fov: 27, pfov: 40, pan: true},
  tv: {pos: CONP.clone().addScaledVector(tvDir, 5.2).add(V(.7, 2.0, -.7)), at: scrW.clone().lerp(CONP.clone().setY(.2), .55), name: 'La consola', fov: 27, pfov: 44},
};
let cur = 'hero', cam = {pos: stations.hero.pos.clone(), at: stations.hero.at.clone(), fov: 27}, ptr = {x: 0, y: 0}, pan = 0;
const $ = id => document.getElementById(id);
function go(name) { cur = name; $('where').textContent = stations[name].name; $('hint').innerHTML = name === 'hero' ? 'Toca la colección o la tele' : name === 'tv' ? (selected ? '<kbd>START</kbd> jugar &nbsp; ' : '') + '<kbd>B</kbd> volver' : 'Elige un cartucho &nbsp; <kbd>B</kbd> volver'; }
go('hero');

// ── elegir un cartucho ──────────────────────────────
const flights = [];
function fly(obj, to, dur, done) { flights.push({obj, from: {p: obj.position.clone(), q: obj.quaternion.clone()}, to, t: 0, dur, done}); }
let bump = 0;
function pick(g) {
  const cart = carts.find(c => c.userData.game === g); if (!cart || selected === g) return;
  if (selected) { const old = carts.find(c => c.userData.game === selected), h = old.userData.home; flights.length = 0; old.position.copy(h.pos); old.rotation.set(h.rx, 0, 0); }
  selected = g; cover = null; tvT0 = performance.now();
  const i = new Image(); i.onload = () => { if (selected === g) cover = i; }; i.src = '../' + (g.thumb || '').split('?')[0];
  fly(cart, {p: slot.clone().add(V(0, .7, 0)), q: conQ, arc: .8, spin: 1}, .95, () => fly(cart, {p: slot.clone().add(V(0, CH / 2 - .05, 0)), q: conQ}, .2, () => { bump = 1; }));
  $('c-t').textContent = g.label; $('c-m').textContent = `${g.ed.model} · edición ${g.ed.name.toLowerCase()} · ${g.type === 'web' ? 'web' : 'terminal'}`; $('c-d').textContent = g.tagline.length > 150 ? g.tagline.slice(0, 148) + '…' : g.tagline; $('card').classList.add('on');
  tvL.color.set(g.ed.plastic).lerp(C('#ffffff'), .35);
  go('tv');
}
const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
let hover = null;
const tip = $('tip');
function cartAt(e) { m2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(m2, camera); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.cart : null; }
addEventListener('pointermove', e => {
  ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1;
  const c = cur === 'wall' ? cartAt(e) : null;
  hover = c;
  if (c && c.userData.game !== selected) { tip.textContent = c.userData.game.label; tip.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-150%)`; tip.classList.add('on'); } else tip.classList.remove('on');
});
canvas.addEventListener('click', e => {
  const c = cartAt(e);
  if (cur === 'wall' && c) return pick(c.userData.game);
  if (cur !== 'hero') return;
  if (c) { pan = (c.position.x - SH.xc) / ((SH.x1 - SH.x0) / 2); return go('wall'); }
  m2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(m2, camera);
  go(ray.intersectObjects(scene.children.filter(o => o.name === 'tv'))[0] ? 'tv' : 'wall');
});
addEventListener('wheel', e => { if (cur === 'wall') pan = Math.max(-1, Math.min(1, pan + (e.deltaX + e.deltaY) * .0012)); }, {passive: true});
addEventListener('keydown', e => { if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') go('hero'); if (cur === 'wall') { if (e.key === 'ArrowRight') pan = Math.min(1, pan + .25); if (e.key === 'ArrowLeft') pan = Math.max(-1, pan - .25); } if (e.key === 'Enter' && selected && selected.play) location.assign(selected.play); });

// ── bucle ───────────────────────────────────────────
let last = performance.now();
const tmp = V(0, 0, 0), yAxis = V(0, 1, 0), sq = new THREE.Quaternion(), tpos = V(0, 0, 0), tat = V(0, 0, 0);
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const s = stations[cur], k = 1 - Math.exp(-dt * 3.4);
  tpos.copy(s.pos); tat.copy(s.at);
  if (s.pan) { if (Math.abs(ptr.x) > .6) pan += Math.sign(ptr.x) * dt * .7; pan = Math.max(-1, Math.min(1, pan)); const half = Math.max(0, (SH.x1 - SH.x0) / 2 - (portrait ? .5 : 1.25)); tpos.x += pan * half; tat.x += pan * half; }
  if (portrait && cur === 'hero') { tpos.set(6.2, 7.4, 11.5); tat.set(-.3, .9, -.3); }
  cam.pos.lerp(tpos, k); cam.at.lerp(tat, k); cam.fov += ((portrait ? s.pfov : s.fov) - cam.fov) * k;
  const sway = cur === 'hero' ? 1 : .3;
  camera.position.copy(cam.pos).add(tmp.set(ptr.x * .45 * sway, -ptr.y * .25 * sway + Math.sin(now / 1900) * .03, -ptr.x * .2 * sway));
  camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(cam.at);
  for (const c of carts) { if (c.userData.game === selected) continue; const h = c.userData.home, on = c === hover; c.position.z += ((h.pos.z + (on ? .09 : 0)) - c.position.z) * Math.min(1, dt * 14); c.position.y += ((h.pos.y + (on ? .02 : 0)) - c.position.y) * Math.min(1, dt * 14); }
  for (const f of [...flights]) {
    f.t = Math.min(1, f.t + dt / f.dur); const e = f.t < .5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
    f.obj.position.lerpVectors(f.from.p, f.to.p, e); if (f.to.arc) f.obj.position.y += Math.sin(Math.PI * f.t) * f.to.arc;
    f.obj.quaternion.slerpQuaternions(f.from.q, f.to.q, e); if (f.to.spin) f.obj.quaternion.multiply(sq.setFromAxisAngle(yAxis, e * Math.PI * 2 * f.to.spin));
    if (f.t >= 1) { flights.splice(flights.indexOf(f), 1); f.done && f.done(); }
  }
  tvL.intensity = 7 + Math.sin(now / 80) * .35 + Math.sin(now / 370) * .5 + bump * 6; bump *= .9;
  drawTV(now);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.g64 = {go, pick, games, stations, setPan: v => { pan = v; }};
