// Herramientas de modelado de gavilanbe 64: piezas de pocos polígonos con color por vértice,
// juntadas en una malla por material. Unidades: metros de la maqueta.
import * as THREE from 'three';
import {mergeGeometries, toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export {THREE, mergeGeometries, toCreasedNormals};

export const C = h => new THREE.Color(h);
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const M4 = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? V(s, s, s) : V(...s));
export const FONT = '"Titan One", "Bricolage Grotesque", Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
export const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(64);

// materiales compartidos (todos con color por vértice)
const std = o => new THREE.MeshStandardMaterial({vertexColors: true, ...o});
export const MATS = {
  matte: std({roughness: .95}), wood: std({roughness: .7}), fabric: std({roughness: 1}),
  plastic: std({roughness: .48}), gloss: std({roughness: .16}), rubber: std({roughness: .85}),
  metal: std({roughness: .32, metalness: 1}), gold: std({roughness: .3, metalness: 1}),
  glow: new THREE.MeshBasicMaterial({vertexColors: true}),
  glass: new THREE.MeshStandardMaterial({color: '#0a0a12', roughness: .05, metalness: .2}),
};

// color por vértice con degradado vertical (la «luz horneada»): k0 abajo, k1 arriba
export function tint(geo, hex, k0 = .78, k1 = 1.05) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  g.computeBoundingBox(); const {min, max} = g.boundingBox, c = C(hex), p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const t = max.y > min.y ? (p.getY(i) - min.y) / (max.y - min.y) : 1, k = k0 + (k1 - k0) * t; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(n)) g.deleteAttribute(n);
  return g;
}

// ── geometrías ──────────────────────────────────────
export const rbox = (w, h, d, r = .012, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2, h / 2, d / 2));
export const cyl = (r0, r1, h, n = 12, open = false) => new THREE.CylinderGeometry(r0, r1, h, n, 1, open);
export function ellipsoid(rx, ry, rz, ws = 14, hs = 10) { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); g.computeVertexNormals(); return g; }
// sección de «supercírculo»: n puntos de un rectángulo redondeado (e = 2 elipse; más alto, más cuadrado)
export const squircle = (w, d, e = 4, n = 24, warp) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = warp ? warp(a) : 1; return [Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * w / 2 * k, Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * d / 2 * k]; });
export const scaleRing = (pts, s, sz = s) => pts.map(([x, z]) => [x * s, z * sz]);
// piel suave entre anillos: rings = [{y, pts:[[x,z]…], dx, dz}]
export function loft(rings, {capTop = true, capBottom = true, crease = 0} = {}) {
  const n = rings[0].pts.length, pos = [], idx = [];
  for (const r of rings) for (const [x, z] of r.pts) pos.push(x + (r.dx || 0), r.y, z + (r.dz || 0));
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * n + i, b = j * n + (i + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
  const cap = (j, flip) => { const r = rings[j], o = pos.length / 3; for (const [x, z] of r.pts) pos.push(x + (r.dx || 0), r.y, z + (r.dz || 0)); pos.push(r.dx || 0, r.y, r.dz || 0); const ce = o + n; for (let i = 0; i < n; i++) { const a = o + i, b = o + (i + 1) % n; flip ? idx.push(ce, a, b) : idx.push(ce, b, a); } };
  if (capBottom) cap(0, true); if (capTop) cap(rings.length - 1, false);
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (crease) g = toCreasedNormals(g.toNonIndexed(), crease);
  return g;
}
// perfil de revolución: pts = [[r, y]…] de abajo arriba
export function lathe(pts, n = 16, crease = .6) { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, .0001), y)), n); return toCreasedNormals(g.toNonIndexed(), crease); }
// extrusión de un contorno 2D ([[x,y]…] o Shape), centrada en z, con bisel
export function ext(shape, depth, bevel = 0, {segs = 2, curve = 8, crease = .5, holes} = {}) {
  let s = shape;
  if (Array.isArray(shape)) { s = new THREE.Shape(); shape.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); }
  if (holes) for (const h of holes) { const p = new THREE.Path(); h.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); s.holes.push(p); }
  let g = new THREE.ExtrudeGeometry(s, {depth: Math.max(.0005, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: segs, curveSegments: curve});
  g.translate(0, 0, -depth / 2 + bevel);
  return toCreasedNormals(g, crease);
}
// rectángulo redondeado como lista de puntos (para ext y sus huecos)
export function rrect(w, h, r, cx = 0, cy = 0, n = 5) {
  const pts = [], add = (ox, oy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push([cx + ox + Math.cos(a) * r, cy + oy + Math.sin(a) * r]); } };
  add(w / 2 - r, h / 2 - r, 0); add(-w / 2 + r, h / 2 - r, Math.PI / 2); add(-w / 2 + r, -h / 2 + r, Math.PI); add(w / 2 - r, -h / 2 + r, Math.PI * 1.5);
  return pts;
}
export const tube = (pts, r = .012, sides = 6, segs = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : V(...p))), segs, r, sides);

// ── el montador ─────────────────────────────────────
export class Kit {
  constructor(base = M4()) { this.b = {}; this.base = base; this.extra = []; }
  add(geo, hex, m = M4(), mat = 'plastic', k0, k1) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m); tint(g, hex, k0, k1); g.applyMatrix4(this.base);
    (this.b[mat] || (this.b[mat] = [])).push(g); return this;
  }
  box(w, h, d, hex, x = 0, y = 0, z = 0, mat, k0, k1, ry = 0, rx = 0, rz = 0) { return this.add(new THREE.BoxGeometry(w, h, d), hex, M4(x, y, z, ry, rx, rz), mat, k0, k1); }
  rbox(w, h, d, r, hex, x = 0, y = 0, z = 0, mat, k0, k1, ry = 0, rx = 0, rz = 0) { return this.add(rbox(w, h, d, r), hex, M4(x, y, z, ry, rx, rz), mat, k0, k1); }
  cyl(r0, r1, h, n, hex, x = 0, y = 0, z = 0, mat, k0, k1, rx = 0, rz = 0, ry = 0) { return this.add(cyl(r0, r1, h, n), hex, M4(x, y, z, ry, rx, rz), mat, k0, k1); }
  // una malla aparte (texturas, transparencias) colocada en el mismo sistema
  mesh(m, local = M4()) { m.applyMatrix4(this.base.clone().multiply(local)); this.extra.push(m); return m; }
  build({shadow = true} = {}) {
    const grp = new THREE.Group();
    for (const [name, parts] of Object.entries(this.b)) { const m = new THREE.Mesh(mergeGeometries(parts), MATS[name]); m.castShadow = shadow && name !== 'glow'; m.receiveShadow = name !== 'glow'; grp.add(m); }
    for (const e of this.extra) grp.add(e);
    return grp;
  }
}

// ── texturas y pegatinas ────────────────────────────
export function tex(w, h, draw, {repeat, srgb = true, mip = true} = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = mip; t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
// rótulo o pegatina plana: se dibuja a px por metro y se coloca casi pegada a la superficie
export function decal(w, h, px, draw, {lit = false, rough = .5, opacity = 1} = {}) {
  const t = tex(Math.round(w * px), Math.round(h * px), draw);
  const mat = lit ? new THREE.MeshStandardMaterial({map: t, transparent: true, roughness: rough, opacity, polygonOffset: true, polygonOffsetFactor: -2}) : new THREE.MeshBasicMaterial({map: t, transparent: true, opacity, polygonOffset: true, polygonOffsetFactor: -2});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = lit; return m;
}
export const glowTex = tex(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
export const blobTex = tex(64, 64, x => { const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(8,4,24,.6)'); g.addColorStop(.6, 'rgba(8,4,24,.24)'); g.addColorStop(1, 'rgba(8,4,24,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
export function glow(s, hex, o = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: hex, opacity: o})); m.renderOrder = 5; return m; }
export function blob(sx, sz, o = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({map: blobTex, transparent: true, depthWrite: false, opacity: o})); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m; }
export const fontsReady = () => Promise.all([`20px "Titan One"`, `800 20px ${FONT}`, `600 12px ${MONO}`].map(f => document.fonts.load(f).catch(() => 0)));
