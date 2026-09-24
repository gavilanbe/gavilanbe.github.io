// gavilanbe POCKET · el plató 3D (three.js). La interfaz vive en index.html (window.GB).
// Pensado para ir ligero: sin refracción, sin sombras dinámicas ni postprocesado,
// cartuchos de una sola malla y render bajo demanda.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const GB = window.GB;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (GB) { try { main(); } catch (e) { console.error('POCKET 3D', e); } }

function main() {
  const host = document.getElementById('stage');
  const LOW = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
  let dpr = Math.min(devicePixelRatio || 1, LOW ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  host.append(renderer.domElement);
  const Sound = GB.sound;
  let awakeUntil = 0;

  const scene = new THREE.Scene();
  const studio = new THREE.Color('#cfc9bf'), studioTo = studio.clone();
  scene.background = studio.clone();
  scene.fog = new THREE.Fog(studio.clone(), 36, 95);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .6;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 300);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9ab95', .4); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff1dc', 2.1); key.position.set(-7, 9, 11); scene.add(key); scene.add(key.target);
  const rim = new THREE.DirectionalLight('#d6e2ff', 1.6); rim.position.set(9, 6, -9);
  const fill = new THREE.DirectionalLight('#cfe0ff', .45); fill.position.set(8, -2, 10); scene.add(fill); scene.add(rim);

  const floorMat = new THREE.MeshBasicMaterial({color: studio.clone()});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), floorMat);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // ── lienzos ─────────────────────────────────────
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); if (draw) draw(x, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    t.userData.ctx = x; return t;
  }
  const imgs = new Map();
  function loadImg(src) {
    if (!imgs.has(src)) imgs.set(src, new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return imgs.get(src);
  }
  const rr = (x, a, b, w, h, r) => { x.beginPath(); x.roundRect(a, b, w, h, r); };
  function cover(x, img, a, b, w, h, zoom = 1, ox = 0) {
    if (!img) { x.fillStyle = '#bdb6a8'; x.fillRect(a, b, w, h); return; }
    const s = Math.max(w / img.width, h / img.height) * zoom, iw = img.width * s, ih = img.height * s;
    x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip(); x.drawImage(img, a + (w - iw) / 2 + ox, b + (h - ih) / 2, iw, ih); x.restore();
  }
  function fit(x, text, maxW, size, font) { let s = size; do { x.font = font.replace('%', s); s -= 1; } while (x.measureText(text).width > maxW && s > 10); }
  function wrap(x, text, maxW) { const words = text.split(/\s+/), lines = []; let l = ''; for (const w of words) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > maxW && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l); return lines; }
  const fonts = document.fonts ? Promise.all(['800 40px "Bricolage Grotesque"', 'italic 800 40px "Bricolage Grotesque"', '500 20px "DM Mono"', '700 40px Caveat', '400 20px Silkscreen', '700 20px Silkscreen'].map(f => document.fonts.load(f).catch(() => null))) : Promise.resolve();
  const BR = '"Bricolage Grotesque", system-ui, sans-serif', MO = '"DM Mono", ui-monospace, monospace', PX = 'Silkscreen, "DM Mono", monospace';
  const ACC = id => (GB.EDITIONS[id] && GB.EDITIONS[id].accent) || '#5e5a53';
  const blobTex = canvasTex(128, 128, x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(30,20,10,.55)'); g.addColorStop(.45, 'rgba(30,20,10,.2)'); g.addColorStop(1, 'rgba(30,20,10,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const blob = (w, d, o = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({map: blobTex, transparent: true, depthWrite: false, opacity: o})); m.rotation.x = -Math.PI / 2; return m; };

  // etiquetas de cartucho (delante y detrás) y de disquete
  const texCache = new Map();
  function once(key, w, h, draw, needsImg) {
    if (texCache.has(key)) return texCache.get(key);
    const t = canvasTex(w, h, x => draw(x, null));
    texCache.set(key, t);
    Promise.all([needsImg ? loadImg(needsImg) : null, fonts]).then(([img]) => { draw(t.userData.ctx, img); t.needsUpdate = true; wake(); });
    return t;
  }
  const frontTex = g => once('f:' + g.name, 384, 384, (x, img) => {
    const a = ACC(g.model), S = 384 / 400;
    x.setTransform(S, 0, 0, S, 0, 0);
    x.clearRect(0, 0, 400, 400);
    x.fillStyle = '#f7f2e7'; rr(x, 0, 0, 400, 400, 16); x.fill();
    x.fillStyle = a; rr(x, 0, 0, 400, 56, [16, 16, 0, 0]); x.fill();
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.font = `italic 800 30px ${BR}`; x.fillText('gavilanbe', 18, 30);
    x.font = `500 13px ${MO}`; x.textAlign = 'right'; x.fillText(g.ed.name.toUpperCase(), 382, 31); x.textAlign = 'left';
    cover(x, img, 18, 70, 364, 228);
    x.strokeStyle = '#1c1a22'; x.lineWidth = 3; x.strokeRect(18, 70, 364, 228);
    x.fillStyle = '#1c1a22'; x.textBaseline = 'alphabetic'; const t = g.label.toUpperCase(); fit(x, t, 364, 40, `800 %px ${BR}`); x.fillText(t, 18, 342);
    x.font = `500 13px ${MO}`; x.fillStyle = a; x.fillText(`${g.code} · ${g.ed.model.toUpperCase()}`, 18, 376);
    x.save(); x.translate(360, 362); x.strokeStyle = a; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.stroke(); x.fillStyle = a; x.font = `700 8px ${MO}`; x.textAlign = 'center'; x.fillText('CALIDAD', 0, -4); x.font = `italic 800 11px ${BR}`; x.fillText('gavi', 0, 9); x.restore();
    if (g.new) { x.save(); x.translate(350, 96); x.rotate(.25); x.fillStyle = '#c6f432'; x.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 27 : 38, an = i / 24 * Math.PI * 2; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.fill(); x.fillStyle = '#1c1a22'; x.font = `800 15px ${BR}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('NUEVO', 0, 1); x.restore(); }
  }, g.thumb);
  const backTex = g => once('b:' + g.name, 384, 384, x => {
    const a = ACC(g.model), S = 384 / 400;
    x.setTransform(S, 0, 0, S, 0, 0);
    x.fillStyle = '#f7f2e7'; rr(x, 0, 0, 400, 400, 16); x.fill();
    x.fillStyle = '#1c1a22'; x.font = `800 26px ${BR}`; x.textBaseline = 'alphabetic'; x.fillText('gavilanbe POCKET', 20, 44);
    x.fillStyle = a; x.fillRect(20, 58, 360, 5);
    x.fillStyle = '#1c1a22'; x.font = `800 22px ${BR}`; x.fillText(g.label.length > 30 ? g.label.slice(0, 29) + '…' : g.label, 20, 96);
    x.font = `500 16px ${BR}`; x.fillStyle = '#4b4652'; wrap(x, g.tagline, 360).slice(0, 7).forEach((l, i) => x.fillText(l, 20, 128 + i * 22));
    x.font = `500 12px ${MO}`; x.fillStyle = a; x.fillText(`EDICIÓN ${g.ed.name.toUpperCase()} · ${g.ed.model.toUpperCase()}`, 20, 300);
    x.fillStyle = '#1c1a22'; x.fillText('1 JUGADOR · SE JUEGA EN EL NAVEGADOR', 20, 320);
    let h = 0; for (const ch of g.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    let bx = 20; for (let i = 0; i < 46; i++) { h = (h * 1103515245 + 12345) >>> 0; const w = 1 + (h >> 8) % 3; x.fillRect(bx, 336, w, 42); bx += w + 1 + (h >> 12) % 3; if (bx > 200) break; }
    x.font = `500 11px ${MO}`; x.fillText(g.code, 20, 392);
  });
  const floppyTex = g => once('d:' + g.name, 512, 300, x => {
    x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, 512, 300);
    x.strokeStyle = '#9ab7e088'; x.lineWidth = 2; for (let y = 76; y < 300; y += 42) { x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke(); }
    x.fillStyle = '#e8434f'; x.fillRect(0, 42, 512, 4);
    x.fillStyle = '#1b3d8f'; x.save(); x.translate(24, 132); x.rotate(-.035); fit(x, g.label, 460, 74, '700 %px Caveat, cursive'); x.fillText(g.label, 0, 0); x.restore();
    x.font = `500 17px ${MO}`; x.fillStyle = ACC(g.model); x.fillText(`${g.ed.model.toUpperCase()} · TERMINAL`, 24, 272);
    x.fillStyle = '#1c1a22'; x.font = `500 15px ${MO}`; x.fillText('HD 1.44MB', 380, 28);
  });

  // ── materiales (sin refracción: los translúcidos son transparencia + barniz) ──
  const PM = THREE.MeshPhysicalMaterial, SM = THREE.MeshStandardMaterial;
  const edMats = {};
  function edMat(id) {
    if (edMats[id]) return edMats[id];
    const f = {
      'opus-4.6': () => new PM({color: '#cbc6bd', roughness: .52, clearcoat: .3}),
      'opus-4.7': () => new PM({color: '#2d2d33', roughness: .4, clearcoat: .6, clearcoatRoughness: .25}),
      'opus-4.8': () => new PM({color: '#e4b24b', metalness: .9, roughness: .26}),
      'fable': () => new PM({color: '#9b5cf2', roughness: .18, clearcoat: 1, transparent: true, opacity: .84, emissive: '#3b0f8a', emissiveIntensity: .25}),
      'fable-5.1': () => new PM({color: '#b8e4fb', roughness: .12, clearcoat: 1, transparent: true, opacity: .78, emissive: '#2a7fb0', emissiveIntensity: .15}),
      'astra': () => new PM({color: '#a9ec63', roughness: .16, clearcoat: 1, transparent: true, opacity: .84, emissive: '#48b51a', emissiveIntensity: .3}),
      'opus-5.5': () => new PM({color: '#f3eefb', metalness: .45, roughness: .16, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [160, 860], clearcoat: 1}),
    }[id];
    return edMats[id] = f ? f() : new PM({color: '#cbc4b8', roughness: .5});
  }
  const CLEAR = new Set(['fable', 'fable-5.1', 'astra']);
  const pcbMat = new SM({roughness: .6, map: canvasTex(256, 256, x => {
    x.fillStyle = '#1d6e3e'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#48b074'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { x.beginPath(); const a = 20 + i * 16; x.moveTo(a, 200); x.lineTo(a, 120 - (i % 4) * 14); x.lineTo(a + 30, 90 - (i % 3) * 10); x.stroke(); }
    x.fillStyle = '#141418'; x.fillRect(70, 40, 110, 60); x.fillRect(30, 124, 50, 36);
    x.fillStyle = '#e7b73c'; for (let i = 0; i < 22; i++) x.fillRect(12 + i * 10.6, 214, 7, 42);
  })});

  // ── cartuchos y disquetes: una malla por cuerpo ─
  function cartShape(w, h, r, n) {
    const s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - n); s.lineTo(x1 - n, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }
  const CART_H = 2.8;
  const cartGeo = (() => {
    const body = new THREE.ExtrudeGeometry(cartShape(2.5, CART_H, .12, .4), {depth: .26, bevelEnabled: true, bevelThickness: .045, bevelSize: .045, bevelSegments: 3, curveSegments: 6});
    body.translate(0, 0, -.13);
    const parts = [body];
    for (let i = 0; i < 5; i++) parts.push(new THREE.BoxGeometry(1.5, .05, .035).translate(0, -1.02 - i * .085, .176).toNonIndexed());
    for (let i = 0; i < 7; i++) parts.push(new THREE.BoxGeometry(.05, .26, .03).translate(-.75 + i * .2, 1.2, .176).toNonIndexed());
    for (const p of parts) { for (const k of Object.keys(p.attributes)) if (!['position', 'normal', 'uv'].includes(k)) p.deleteAttribute(k); p.clearGroups(); }
    return mergeGeometries(parts);
  })();
  const labelGeo = new THREE.PlaneGeometry(2.04, 2.04);
  const pcbGeo = new THREE.PlaneGeometry(2.05, 2.3);
  const labelMats = new Map();
  const matFor = (key, tex) => { if (!labelMats.has(key)) labelMats.set(key, new SM({map: tex, roughness: .55, transparent: true})); return labelMats.get(key); };
  function makeCart(g) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(cartGeo, edMat(g.model)); grp.add(body);
    if (CLEAR.has(g.model)) { const p = new THREE.Mesh(pcbGeo, pcbMat); p.position.y = -.15; p.renderOrder = -1; grp.add(p); }
    const label = new THREE.Mesh(labelGeo, matFor('f:' + g.name, frontTex(g))); label.position.set(0, .22, .177); grp.add(label);
    const back = new THREE.Mesh(labelGeo, matFor('b:' + g.name, backTex(g))); back.rotation.y = Math.PI; back.position.set(0, .22, -.177); back.scale.set(.92, .92, 1); grp.add(back);
    body.userData.item = grp; label.userData.item = grp; back.userData.item = grp;
    grp.userData = {game: g, label, back, body};
    return grp;
  }
  const floppyGeo = new RoundedBoxGeometry(2.7, 2.8, .12, 2, .05);
  const shutterMat = new PM({color: '#dfe4ea', metalness: 1, roughness: .28});
  const shutterGeo = new THREE.BoxGeometry(1.4, 1.0, .14), holeGeo = new THREE.BoxGeometry(.26, .62, .145), flabGeo = new THREE.PlaneGeometry(2.24, 1.31);
  const holeBrown = new SM({color: '#4a3a2a'});
  function makeFloppy(g) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(floppyGeo, edMat(g.model)); grp.add(body);
    const sh = new THREE.Mesh(shutterGeo, shutterMat); sh.position.set(.1, .9, 0); grp.add(sh);
    const hole = new THREE.Mesh(holeGeo, holeBrown); hole.position.set(.36, .92, 0); grp.add(hole);
    const lab = new THREE.Mesh(flabGeo, matFor('d:' + g.name, floppyTex(g))); lab.position.set(0, -.6, .062); grp.add(lab);
    body.userData.item = grp; lab.userData.item = grp; sh.userData.item = grp;
    grp.userData = {game: g, body, floppy: true};
    return grp;
  }

  // ── la consola ─────────────────────────────────
  const CW = 3.4, CH = 5.6, SLOT_Y = 3.0, SLOT_Z = -.08;
  const con = new THREE.Group(); scene.add(con);
  const rig = new THREE.Group(); con.add(rig);
  const conShadow = blob(6.5, 3, .9); scene.add(conShadow);
  const shellMat = new PM({color: '#dcd6ca', roughness: .5, clearcoat: .35, clearcoatRoughness: .45, sheen: .35, sheenRoughness: .6, sheenColor: '#ffffff'});
  const darkMat = new PM({color: '#2b2a31', roughness: .45, clearcoat: .5});
  const holeMat = new SM({color: '#16161a', roughness: .9});
  const add = (mesh, x = 0, y = 0, z = 0, parent = rig) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const rounded = (w, h, r, R = r) => { const s = new THREE.Shape(), a = w / 2, b = h / 2; s.moveTo(-a + r, -b); s.lineTo(a - R, -b); s.absarc(a - R, -b + R, R, -Math.PI / 2, 0, false); s.lineTo(a, b - r); s.absarc(a - r, b - r, r, 0, Math.PI / 2, false); s.lineTo(-a + r, b); s.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-a, -b + r); s.absarc(-a + r, -b + r, r, Math.PI, Math.PI * 1.5, false); return s; };
  // carcasa: esquina inferior derecha muy redondeada, biseles suaves y costura entre las dos mitades
  const shellShape = rounded(CW, CH, .34, 1.2);
  const DEPTH = .62, BT = .14;
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, {depth: DEPTH, bevelEnabled: true, bevelThickness: BT, bevelSize: .12, bevelSegments: 8, curveSegments: 32});
  shellGeo.translate(0, 0, -DEPTH / 2);
  const FR = DEPTH / 2 + BT;
  const body = add(new THREE.Mesh(shellGeo, shellMat)); body.userData.action = 'spin';
  const seamGeo = new THREE.ExtrudeGeometry(rounded(CW + .245, CH + .245, .44, 1.32), {depth: .025, bevelEnabled: false, curveSegments: 32}); seamGeo.translate(0, 0, -.13);
  add(new THREE.Mesh(seamGeo, new SM({color: '#0f0e12', roughness: 1})));
  // frontal: color + mapa de alturas → normales (los huecos reaccionan a la luz al girarla)
  const PPU = 240, FW = Math.round(CW * PPU), FH = Math.round(CH * PPU);
  const faceTex = canvasTex(FW, FH), heightCv = document.createElement('canvas'); heightCv.width = FW; heightCv.height = FH;
  faceTex.repeat.set(1 / CW, 1 / CH); faceTex.offset.set(.5, .5);
  const C = (X, Y) => [(X + CW / 2) * PPU, (CH / 2 - Y) * PPU], U = v => v * PPU;
  let printColor = '#2a2640', printSoft = 'rgba(42,38,64,.6)', faceBase = '#dcd6ca';
  function capsule(x, cx, cy, len, rad, ang) { x.save(); x.translate(cx, cy); x.rotate(ang); rr(x, -len / 2, -rad, len, rad * 2, rad); x.restore(); }
  const [dX, dY] = C(-.92, -1.08), [aX, aY] = C(1.12, -.8), [bX, bY] = C(.42, -1.08), abAng = Math.atan2(aY - bY, aX - bX), abLen = Math.hypot(aX - bX, aY - bY);
  function wells(x, depth) {
    // depth(v) devuelve el estilo de relleno para cada hueco
    x.fillStyle = depth(.55); x.beginPath(); x.arc(dX, dY, U(.64), 0, 7); x.fill();
    x.fillStyle = depth(.55); capsule(x, (aX + bX) / 2, (aY + bY) / 2, abLen + U(.8), U(.39), abAng); x.fill();
    for (const px of [-.26, .3]) { const [cx, cy] = C(px, -2.03); x.fillStyle = depth(.7); capsule(x, cx, cy, U(.6), U(.12), -.42); x.fill(); }
    for (let i = 0; i < 6; i++) { const [cx, cy] = C(.74 + i * .15, -2.2 + i * .075); x.fillStyle = depth(1); capsule(x, cx, cy, U(.64 - Math.abs(i - 2.5) * .07), U(.038), -1.07); x.fill(); }
  }
  function drawHeight() {
    const x = heightCv.getContext('2d');
    x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, FW, FH);
    x.filter = `blur(${U(.018)}px)`;
    wells(x, d => `rgb(${Math.round(128 - 80 * d)},0,0)`.replace(/rgb\((\d+),0,0\)/, (m, v) => `rgb(${v},${v},${v})`));
    // logotipo grabado muy leve
    x.fillStyle = 'rgb(118,118,118)'; x.font = `italic 800 ${U(.4)}px ${BR}`; const [gx, gy] = C(-1.45, -.26); x.fillText('gavilanbe', gx, gy);
    x.filter = 'none';
    const img = x.getImageData(0, 0, FW, FH), h = img.data, out = new ImageData(FW, FH), o = out.data, S = 2.4;
    for (let yy = 0; yy < FH; yy++) for (let xx = 0; xx < FW; xx++) {
      const i = (yy * FW + xx) * 4, l = h[(yy * FW + Math.max(0, xx - 1)) * 4], r = h[(yy * FW + Math.min(FW - 1, xx + 1)) * 4], u = h[(Math.max(0, yy - 1) * FW + xx) * 4], dn = h[(Math.min(FH - 1, yy + 1) * FW + xx) * 4];
      let nx = (l - r) / 255 * S, ny = (dn - u) / 255 * S, nz = 1; const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
      const grain = ((xx * 73856093 ^ yy * 19349663) & 7) - 3.5;
      o[i] = (nx * .5 + .5) * 255 + grain * .6; o[i + 1] = (ny * .5 + .5) * 255 + grain * .6; o[i + 2] = nz * 255; o[i + 3] = 255;
    }
    const nc = document.createElement('canvas'); nc.width = FW; nc.height = FH; nc.getContext('2d').putImageData(out, 0, 0);
    const nt = new THREE.CanvasTexture(nc); nt.repeat.copy(faceTex.repeat); nt.offset.copy(faceTex.offset); nt.anisotropy = maxAniso;
    return nt;
  }
  function drawFace() {
    const x = faceTex.userData.ctx;
    x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = faceBase; x.fillRect(0, 0, FW, FH);
    // interior de los huecos: un poco más oscuro, con sombra arriba (la luz viene de arriba a la izquierda)
    wells(x, d => `rgba(0,0,0,${.05 + .1 * d})`);
    x.save(); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, FW * .4, FH); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,.05)'); x.fillStyle = g; x.fillRect(0, 0, FW, FH); x.restore();
    // serigrafía
    const [gx, gy] = C(-1.45, -.26); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = printColor; x.font = `italic 800 ${U(.4)}px ${BR}`; x.fillText('gavilanbe', gx, gy);
    const lw = x.measureText('gavilanbe').width; x.font = `800 ${U(.15)}px ${BR}`; x.fillText('POCKET', gx + lw + U(.1), gy); x.font = `500 ${U(.06)}px ${MO}`; x.fillText('TM', gx + lw + U(.1) + x.measureText('POCKET').width * 2.35, gy - U(.12));
    x.textAlign = 'center'; x.fillStyle = printColor; x.font = `700 ${U(.1)}px ${MO}`;
    x.fillText('A', aX + U(.02), aY + U(.49)); x.fillText('B', bX + U(.02), bY + U(.49));
    for (const [px, lab] of [[-.26, 'SELECT'], [.3, 'START']]) { const [cx, cy] = C(px, -2.03); x.save(); x.translate(cx, cy + U(.25)); x.rotate(-.42); x.fillStyle = printSoft; x.font = `500 ${U(.064)}px ${MO}`; x.fillText(lab, 0, 0); x.restore(); }
    x.save(); x.translate(...C(1.25, -2.62)); x.fillStyle = printSoft; x.font = `500 ${U(.055)}px ${MO}`; x.fillText('))) PHONES', 0, 0); x.restore();
    faceTex.needsUpdate = true; wake();
  }
  const faceMat = new PM({map: faceTex, roughness: .5, clearcoat: .35, clearcoatRoughness: .45, sheen: .35, sheenRoughness: .6, sheenColor: '#ffffff', normalScale: new THREE.Vector2(1, 1)});
  const face = add(new THREE.Mesh(new THREE.ShapeGeometry(shellShape, 32), faceMat), 0, 0, FR + .001);
  face.raycast = () => {};
  fonts.then(() => { faceMat.normalMap = drawHeight(); faceMat.needsUpdate = true; wake(); });
  // marco de la pantalla con volumen propio
  const bezelShape = rounded(2.92, 2.44, .13, .62);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {depth: .02, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 4, curveSegments: 24});
  const bezelMat = new PM({color: '#3a3848', roughness: .38, clearcoat: .6, clearcoatRoughness: .3});
  add(new THREE.Mesh(bezelGeo, bezelMat), 0, 1.25, FR);
  const BZ = FR + .046;
  const bezelTex = canvasTex(700, 590);
  const drawBezel = () => { const x = bezelTex.userData.ctx, K = 700 / 2.92; x.clearRect(0, 0, 700, 590);
    x.fillStyle = '#ff5b35'; x.fillRect(.14 * K, .12 * K, .66 * K, .03 * K); x.fillStyle = '#c6f432'; x.fillRect(.14 * K, .175 * K, .66 * K, .03 * K);
    x.fillStyle = '#ff5b35'; x.fillRect(2.12 * K, .12 * K, .66 * K, .03 * K); x.fillStyle = '#c6f432'; x.fillRect(2.12 * K, .175 * K, .66 * K, .03 * K);
    x.fillStyle = '#c9c6d6'; x.font = `500 ${.07 * K}px ${MO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PIXEL  COLOR  ·  STEREO  SOUND', 1.46 * K, .165 * K);
    x.fillStyle = '#9d99ad'; x.font = `500 ${.055 * K}px ${MO}`; x.fillText('BATTERY', .22 * K, 1.16 * K);
    bezelTex.needsUpdate = true; wake(); };
  add(new THREE.Mesh(new THREE.PlaneGeometry(2.92, 2.46), new THREE.MeshBasicMaterial({map: bezelTex, transparent: true, depthWrite: false})), 0, 1.25, BZ + .001).raycast = () => {};
  // pantalla, cristal y LED
  const SW = 480, SH = 300;
  const screenTex = canvasTex(SW, SH); const sx = screenTex.userData.ctx; screenTex.generateMipmaps = true; screenTex.minFilter = THREE.LinearMipmapLinearFilter;
  add(new THREE.Mesh(new THREE.PlaneGeometry(2.42, 1.58), new SM({color: '#15141a', roughness: .8})), .06, 1.32, BZ + .002);
  const screen = add(new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.4375), new THREE.MeshBasicMaterial({map: screenTex, toneMapped: false, color: '#f0f0f0'})), .06, 1.32, BZ + .004);
  screen.userData.action = 'screen';
  const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.1), new PM({color: '#fff', transparent: true, opacity: .07, roughness: .02, clearcoat: 1, envMapIntensity: 3.5, depthWrite: false})), 0, 1.25, BZ + .01);
  glass.raycast = () => {};
  const led = add(new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new SM({color: '#3a1512', emissive: '#ff2a1a', emissiveIntensity: 0})), -1.2, 1.4, BZ + .01);
  const glowTex = canvasTex(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,90,60,1)'); g.addColorStop(.3, 'rgba(255,60,40,.45)'); g.addColorStop(1, 'rgba(255,60,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
  const ledGlow = add(new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0})), -1.2, 1.4, BZ + .05);
  ledGlow.scale.setScalar(.5);
  // cruceta con flechas en relieve y hundimiento central
  const hits = [];
  const dpad = new THREE.Group(); dpad.position.set(-.92, -1.08, FR - .02); rig.add(dpad);
  const cross = new THREE.Shape(); const CA = .165, CL = .5;
  [[-CA, CL], [CA, CL], [CA, CA], [CL, CA], [CL, -CA], [CA, -CA], [CA, -CL], [-CA, -CL], [-CA, -CA], [-CL, -CA], [-CL, CA], [-CA, CA]].forEach(([px, py], i) => i ? cross.lineTo(px, py) : cross.moveTo(px, py));
  const dTex = canvasTex(256, 256, x => {
    const K = 256 / 1.14, P = v => (v + .57) * K;
    x.fillStyle = '#2d2c34'; x.fillRect(0, 0, 256, 256);
    const g = x.createRadialGradient(128, 128, 4, 128, 128, 60); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#4a4953';
    for (const a of [0, 1, 2, 3]) { x.save(); x.translate(128, 128); x.rotate(a * Math.PI / 2); x.beginPath(); x.moveTo(0, -.43 * K); x.lineTo(-.07 * K, -.33 * K); x.lineTo(.07 * K, -.33 * K); x.fill(); x.restore(); }
    void P;
  });
  dTex.repeat.set(1 / 1.14, 1 / 1.14); dTex.offset.set(.5, .5);
  add(new THREE.Mesh(new THREE.ExtrudeGeometry(cross, {depth: .09, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 4}), [new PM({map: dTex, roughness: .5, clearcoat: .5}), darkMat]), 0, 0, 0, dpad);
  [['left', -.33, 0], ['right', .33, 0], ['up', 0, .33], ['down', 0, -.33]].forEach(([a, x, y]) => { const h = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .25), new THREE.MeshBasicMaterial({visible: false})); h.position.set(x, y, .12); h.userData.action = a; dpad.add(h); hits.push(h); });
  // A y B: cúpulas cóncavas brillantes
  const redMat = new PM({color: '#c4284f', roughness: .22, clearcoat: 1, clearcoatRoughness: .06, sheen: .2, side: THREE.DoubleSide});
  const domeGeo = new THREE.LatheGeometry([[0, .15], [.1, .158], [.2, .15], [.25, .11], [.275, .05], [.28, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 40); domeGeo.rotateX(Math.PI / 2);
  const btn = {};
  for (const [x, y, a] of [[1.12, -.8, 'a'], [.42, -1.08, 'b']]) { const g = new THREE.Group(); g.position.set(x, y, FR - .03); rig.add(g); const b = add(new THREE.Mesh(domeGeo, redMat), 0, 0, 0, g); b.userData.action = a; hits.push(b); btn[a] = g; }
  const pillMat = new PM({color: '#7a7682', roughness: .85});
  const pillGeo = new THREE.CapsuleGeometry(.07, .34, 4, 14);
  for (const [a, x] of [['select', -.26], ['start', .3]]) { const g = new THREE.Group(); g.position.set(x, -2.03, FR - .005); g.rotation.z = -.42; rig.add(g); const p = add(new THREE.Mesh(pillGeo, pillMat), 0, 0, 0, g); p.rotation.z = Math.PI / 2; p.scale.set(1, 1, .7); p.userData.action = a; hits.push(p); btn[a] = g; }
  btn.left = btn.right = btn.up = btn.down = dpad;
  // arriba, lados y detrás
  add(new THREE.Mesh(new RoundedBoxGeometry(2.8, .2, .5, 2, .06), holeMat), 0, CH / 2 + .02, SLOT_Z);
  const power = add(new THREE.Mesh(new RoundedBoxGeometry(.42, .16, .22, 2, .05), darkMat), -1.2, CH / 2 + .07, .12);
  const wheel = add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .12, 24), darkMat), CW / 2 + .1, .9, 0); wheel.rotation.z = Math.PI / 2;
  add(new THREE.Mesh(new THREE.BoxGeometry(.06, .34, .36), holeMat), -CW / 2 - .1, 1.9, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.5, .08, 2, .05), shellMat), 0, -1.7, -FR - .01);
  const stickerTex = canvasTex(512, 512);
  const drawSticker = () => { const x = stickerTex.userData.ctx; x.fillStyle = '#f7f2e7'; rr(x, 0, 0, 512, 512, 30); x.fill(); x.fillStyle = '#1c1a22'; x.font = `800 44px ${BR}`; x.fillText('gavilanbe POCKET', 34, 90); x.font = `500 20px ${MO}`; ['MODELO GVB-01', 'HECHO A MANO CON', 'MODELOS QUE SUEÑAN', '', 'NO APTO PARA SOPLAR', '(SALVO EMERGENCIAS)'].forEach((l, i) => x.fillText(l, 34, 160 + i * 36)); x.fillStyle = '#ff5b35'; x.fillRect(34, 420, 444, 10); x.fillStyle = '#c6f432'; x.fillRect(34, 440, 444, 10); stickerTex.needsUpdate = true; wake(); };
  const stk = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new SM({map: stickerTex, roughness: .7})), 0, .8, -FR - .004); stk.rotation.y = Math.PI;

  // ── el ordenador (disquetes) ───────────────────
  const pc = new THREE.Group(); scene.add(pc);
  const beige = new PM({color: '#e6dcc5', roughness: .55, clearcoat: .2});
  const wood = new PM({color: '#b9895a', roughness: .5, clearcoat: .4});
  const desk = new THREE.Group(); desk.position.y = -2.4; pc.add(desk);
  add(new THREE.Mesh(new RoundedBoxGeometry(8.4, .3, 6.2, 2, .1), wood), 0, 2.25, .8, desk);
  const legGeo = new THREE.CylinderGeometry(.14, .12, 2.1, 10), legMat = new PM({color: '#2a2a31', roughness: .4});
  for (const [lx, lz] of [[-3.8, -1.9], [3.8, -1.9], [-3.8, 3.5], [3.8, 3.5]]) add(new THREE.Mesh(legGeo, legMat), lx, 1.05, lz, desk);
  const deskShadow = blob(11, 8, .7); deskShadow.position.set(0, .02, .8); desk.add(deskShadow);
  add(new THREE.Mesh(new RoundedBoxGeometry(5.6, 1.6, 4.4, 3, .14), beige), 0, .8, 0, pc);
  add(new THREE.Mesh(new RoundedBoxGeometry(3.1, .18, .12, 2, .05), holeMat), .9, .9, 2.2, pc);
  const driveLed = add(new THREE.Mesh(new THREE.BoxGeometry(.18, .08, .05), new SM({color: '#113311', emissive: '#39ff6a', emissiveIntensity: 0})), 2.6, .9, 2.2, pc);
  const pcFront = canvasTex(512, 128);
  const drawPcFront = () => { const x = pcFront.userData.ctx; x.clearRect(0, 0, 512, 128); x.fillStyle = '#3a3542'; x.font = `italic 800 38px ${BR}`; x.fillText('gavilanbe', 14, 52); x.font = `500 20px ${MO}`; x.fillText('486 DX2 · 66 MHz', 14, 88); x.fillStyle = '#ff5b35'; x.fillRect(14, 104, 120, 6); pcFront.needsUpdate = true; wake(); };
  add(new THREE.Mesh(new THREE.PlaneGeometry(2, .5), new SM({map: pcFront, transparent: true})), -1.6, .95, 2.205, pc);
  add(new THREE.Mesh(new RoundedBoxGeometry(5.0, 4.1, 3.9, 3, .3), beige), 0, 1.6 + 2.15, -.2, pc);
  add(new THREE.Mesh(new RoundedBoxGeometry(4.3, 3.35, .1, 2, .12), new SM({color: '#2b2a30', roughness: .6})), 0, 3.85, 1.76, pc);
  const TW = 512, TH = 384;
  const termTex = canvasTex(TW, TH); const tx = termTex.userData.ctx;
  const term = add(new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.78), new THREE.MeshBasicMaterial({map: termTex, toneMapped: false})), 0, 3.85, 1.82, pc);
  term.userData.action = 'term'; hits.push(term);
  const kb = add(new THREE.Mesh(new RoundedBoxGeometry(5.6, .32, 1.9, 2, .1), beige), 0, .16, 3.6, pc); kb.userData.action = 'keys'; hits.push(kb);
  const keysTex = canvasTex(512, 176, x => { x.fillStyle = '#d8ceb6'; x.fillRect(0, 0, 512, 176); for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { if (r === 4 && c > 4 && c < 10) continue; x.fillStyle = (r + c) % 7 ? '#f3ecdc' : '#bdb29a'; rr(x, 10 + c * 33, 8 + r * 33, 30, 28, 4); x.fill(); } x.fillStyle = '#f3ecdc'; rr(x, 175, 140, 160, 28, 4); x.fill(); });
  add(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.7), new SM({map: keysTex, roughness: .6})), 0, .325, 3.6, pc).rotation.x = -Math.PI / 2;

  // ── la cinta expositora ────────────────────────
  const belt = new THREE.Group(); scene.add(belt);
  const plinthMat = new PM({color: '#ffffff', roughness: .3, clearcoat: .7});
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(90, .36, 3.6, 2, .12), plinthMat); belt.add(plinth);
  const spotTex = canvasTex(128, 128, x => { const g = x.createRadialGradient(64, 64, 14, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshBasicMaterial({map: spotTex, transparent: true, depthWrite: false, toneMapped: false}));
  spot.rotation.x = -Math.PI / 2; belt.add(spot);
  const SLOTS = 11;
  const slots = Array.from({length: SLOTS}, (_, i) => { const sh = blob(2.4, 1.1, .6); belt.add(sh); return {k: i - 5, gi: -1, mesh: null, kind: '', sh}; });
  let list = [], kind = 'cart', beltPos = 0, beltTarget = 0, beltVel = 0, beltLast = 0, flipT = 0, flipTo = 0, beltScale = 1;
  const beltHide = new Set();
  const mod = (a, n) => ((a % n) + n) % n;
  function slotItem(s, gi) {
    if (s.mesh) { belt.remove(s.mesh); s.mesh = null; }
    s.gi = gi; s.kind = kind;
    if (gi < 0 || !list.length) return;
    const g = list[gi];
    s.mesh = kind === 'cart' ? makeCart(g) : makeFloppy(g);
    s.mesh.userData.gi = gi; belt.add(s.mesh);
  }
  function beltPose(o) {
    const a = Math.abs(o), lift = Math.max(0, 1 - a);
    return {x: o * 2.75 + Math.sign(o) * Math.min(a, 1) * .5, y: L.beltY + lift * lift * 1.1, z: -o * o * .12 + lift * .6, ry: -o * .2, s: (1 - Math.min(a, 6) * .05 + lift * lift * .16) * L.beltItem, lift};
  }
  function beltWorld(gi, out = new THREE.Vector3()) {
    const n = list.length; let o = gi - beltPos; o -= n * Math.round(o / n);
    const p = beltPose(o); out.set(p.x, p.y, p.z); return belt.localToWorld(out);
  }
  function updateBelt(dt) {
    const n = list.length; if (!n) return false;
    if (!drag || drag.mode !== 'belt') { const d = beltTarget - beltPos; beltVel += d * 60 * dt; beltVel *= Math.exp(-dt * 11); beltPos += beltVel * dt; if (Math.abs(d) < .0005 && Math.abs(beltVel) < .002) { beltPos = beltTarget; beltVel = 0; } }
    const base = Math.round(beltPos);
    if (base !== beltLast) { Sound.tick(base); beltLast = base; }
    flipT += (flipTo - flipT) * (1 - Math.exp(-dt * 7));
    spot.material.opacity = .6 - Math.min(.5, Math.abs(beltVel) * .1);
    for (const s of slots) {
      const i = base + s.k, gi = mod(i, n), o = i - beltPos;
      if (s.gi !== gi || s.kind !== kind) slotItem(s, gi);
      if (!s.mesh) continue;
      const p = beltPose(o), m = s.mesh, focused = Math.abs(o) < .5, vis = !beltHide.has(gi) && Math.abs(o) < 5.6;
      m.visible = vis; s.sh.visible = vis;
      m.position.set(p.x, p.y, p.z);
      m.rotation.set(focused ? -.05 : 0, p.ry + (focused ? mouse.x * .35 + flipT * Math.PI : 0), -beltVel * .012);
      m.scale.setScalar(p.s * beltScale * (hoverItem === m ? 1.06 : 1));
      s.sh.position.set(p.x, L.floorY + .37, p.z + .2); s.sh.scale.setScalar(p.s * beltScale * (1 - p.lift * .3)); s.sh.material.opacity = .55 - p.lift * .25;
    }
    return Math.abs(beltVel) > .002 || Math.abs(flipTo - flipT) > .002;
  }
  function setBeltList(newList, newKind, focusIdx) { list = newList; kind = newKind; beltPos = beltTarget = focusIdx; beltLast = Math.round(beltPos); for (const s of slots) s.gi = -1; }
  function focusBelt(i) { const n = list.length; if (!n) return; beltTarget = i + n * Math.round((beltPos - i) / n); flipTo = 0; wake(); }
  // fantasma: contorno del cartucho que está en la consola
  const ghostMat = new THREE.LineDashedMaterial({color: '#ffffff', transparent: true, opacity: .8, dashSize: .12, gapSize: .09});
  const ghost = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(cartShape(2.5, CART_H, .12, .4).getPoints(8)), ghostMat); ghost.computeLineDistances(); belt.add(ghost);
  function placeGhost() {
    const g = kind === 'cart' ? inSlot && inSlot.userData.game : null, gi = g ? list.indexOf(g) : -1;
    ghost.visible = gi >= 0 && beltHide.has(gi);
    if (!ghost.visible) return;
    const n = list.length; let o = gi - beltPos; o -= n * Math.round(o / n);
    if (Math.abs(o) > 5.5) { ghost.visible = false; return; }
    const p = beltPose(o); ghost.position.set(p.x, p.y, p.z); ghost.rotation.set(0, p.ry, 0); ghost.scale.setScalar(p.s);
  }

  // ── animación ─────────────────────────────────
  const anims = new Set();
  const E = {io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t};
  function anim(dur, fn, ease = E.io) { wake(); return new Promise(res => { if (REDUCE) dur = Math.min(dur, .01); anims.add({dur, fn, ease, t: 0, res}); }); }
  const wait = s => new Promise(r => setTimeout(r, REDUCE ? 0 : s * 1000));
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  function fly(obj, target, dur, {lift = 2.5, ease = E.io, spin = 0} = {}) {
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.x;
    return anim(dur, e => {
      const tg = target(), p1 = tg.pos, c = p0.clone().lerp(p1, .5); c.y = Math.max(p0.y, p1.y) + lift;
      const a = p0.clone().lerp(c, e), b = c.clone().lerp(p1, e); obj.position.copy(a.lerp(b, e));
      obj.quaternion.slerpQuaternions(q0, tg.quat, e);
      if (spin) obj.rotateY(Math.sin(e * Math.PI) * spin);
      obj.scale.setScalar(s0 + ((tg.scale ?? 1) - s0) * e);
    }, ease);
  }
  const slotTarget = (dy = 0) => () => ({pos: rig.localToWorld(new THREE.Vector3(0, SLOT_Y + dy, SLOT_Z)), quat: rig.getWorldQuaternion(Q()), scale: 1});
  // chispas
  const sparkGeo = new THREE.BufferGeometry(), SPN = 120, spPos = new Float32Array(SPN * 3), spCol = new Float32Array(SPN * 3), spVel = [], spLife = new Float32Array(SPN);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); sparkGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({size: .14, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  sparks.frustumCulled = false; scene.add(sparks);
  for (let i = 0; i < SPN; i++) { spVel.push(V()); spPos[i * 3 + 1] = -999; }
  let spI = 0, sparkAlive = 0;
  function burst(at, colors, n = 36, speed = 5, up = 3) {
    for (let k = 0; k < n; k++) { const i = spI++ % SPN, c = new THREE.Color(colors[k % colors.length]); spPos.set([at.x, at.y, at.z], i * 3); spCol.set([c.r, c.g, c.b], i * 3); spVel[i].set((Math.random() - .5) * speed, Math.random() * up + 1, (Math.random() - .2) * speed * .6); spLife[i] = .7 + Math.random() * .6; }
    sparkGeo.attributes.color.needsUpdate = true; sparkAlive = 1.4; wake();
  }
  function updateSparks(dt) {
    if (sparkAlive <= 0) return; sparkAlive -= dt;
    for (let i = 0; i < SPN; i++) { if (spLife[i] <= 0) { spPos[i * 3 + 1] = -999; continue; } spLife[i] -= dt; spVel[i].y -= 9 * dt; spPos[i * 3] += spVel[i].x * dt; spPos[i * 3 + 1] += spVel[i].y * dt; spPos[i * 3 + 2] += spVel[i].z * dt; }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  // ── pantalla de la consola: LCD nativo de 160×100, ampliado ×3 con rejilla de puntos ──
  let scr = {mode: 'off', t0: 0, g: null};
  const setScr = (mode, g) => { scr = {mode, t0: performance.now(), g: g || scr.g}; wake(); };
  const NW = 160, NH = 100;
  const nat = document.createElement('canvas'); nat.width = NW; nat.height = NH; const nx = nat.getContext('2d');
  const prev = document.createElement('canvas'); prev.width = NW; prev.height = NH; const pvx = prev.getContext('2d');
  const thumbs = new Map();
  function thumbOf(g) {
    if (!g) return null;
    if (!thumbs.has(g.name)) {
      thumbs.set(g.name, null);
      loadImg(g.thumb).then(img => { if (!img) return; const c = document.createElement('canvas'); c.width = NW; c.height = NH; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; const s = Math.max(NW / img.width, NH / img.height); x.drawImage(img, (NW - img.width * s) / 2, (NH - img.height * s) / 2, img.width * s, img.height * s); thumbs.set(g.name, c); wake(); });
    }
    return thumbs.get(g.name);
  }
  // texto pixelado de verdad: se rasteriza y se umbraliza (sin antialias)
  const txtCache = new Map();
  function pxText(text, color, size = 8, bold = false) {
    const key = text + color + size + bold;
    if (txtCache.has(key)) return txtCache.get(key);
    const m = document.createElement('canvas').getContext('2d'); m.font = `${bold ? 700 : 400} ${size}px ${PX}`;
    const w = Math.ceil(m.measureText(text).width) + 2, h = size + 4;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.font = m.font; x.textBaseline = 'top'; x.fillStyle = color; x.fillText(text, 1, 1);
    const d = x.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; x.putImageData(d, 0, 0);
    if (txtCache.size > 200) txtCache.clear();
    txtCache.set(key, c); return c;
  }
  const put = (c, x, y, align = 'left') => nx.drawImage(c, Math.round(align === 'center' ? x - c.width / 2 : align === 'right' ? x - c.width : x), Math.round(y));
  function fitText(text, color, maxW, bold) { let t = text; let c = pxText(t, color, 8, bold); while (c.width > maxW && t.length > 3) { t = t.slice(0, -2); c = pxText(t + '…', color, 8, bold); } return c; }
  // el gavilán en pixel art
  const HAWK = ['......#......', '.....###.....', '#...#####...#', '##.#######.##', '.###########.', '...#######...', '....#...#....', '...##...##...'];
  function hawk(x0, y0, color, k = 1) { nx.fillStyle = color; HAWK.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') nx.fillRect(x0 + x * k, y0 + y * k, k, k); }); }
  const LCD_ON = '#e8ecd6', INK = '#1b1726';
  const accentOf = g => (g && GB.EDITIONS[g.model] && GB.EDITIONS[g.model].accent) || '#ff5b35';
  // orden aleatorio fijo de bloques 4×4 para la disolución
  const BLOCKS = (() => { const a = []; for (let y = 0; y < NH / 4; y++) for (let x = 0; x < NW / 4; x++) a.push([x * 4, y * 4]); for (let i = a.length - 1; i > 0; i--) { const j = (i * 7919 + 13) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
  function drawTitle(g, now, x = nx) {
    const img = thumbOf(g);
    if (img) x.drawImage(img, 0, 0); else { x.fillStyle = '#9aa08c'; x.fillRect(0, 0, NW, NH); }
    x.fillStyle = 'rgba(16,12,24,.86)'; x.fillRect(0, 74, NW, 26);
    x.fillStyle = accentOf(g); x.fillRect(0, 74, NW, 1);
    const ctx0 = nx; if (x !== nx) return;
    put(fitText((g ? g.label : '').toUpperCase(), '#fff6e0', 150, true), 80, 77, 'center');
    if (Math.floor(now / 530) % 3 !== 2) put(pxText('PRESS START', '#c6f432'), 80, 88, 'center');
    nx.fillStyle = 'rgba(16,12,24,.8)'; const code = pxText(g ? g.code : '', '#fff6e0'); nx.fillRect(2, 2, code.width + 2, 11); put(code, 3, 2);
    void ctx0;
  }
  let lastScreenKey = '';
  function drawScreen(now) {
    const t = (now - scr.t0) / 1000, g = scr.g, still = scr.mode === 'off';
    const key = scr.mode + (g && g.name) + (thumbs.get(g && g.name) ? 1 : 0) + (still ? '' : Math.floor(now / 40));
    if (key === lastScreenKey) return; lastScreenKey = key;
    nx.imageSmoothingEnabled = false;
    if (scr.mode === 'off') {
      nx.fillStyle = '#2b3128'; nx.fillRect(0, 0, NW, NH);
    } else if (scr.mode === 'power') {
      const on = Math.min(1, t / .5), flick = t < .3 && Math.floor(t * 30) % 3 === 0 ? .6 : 1;
      const c = new THREE.Color('#2b3128').lerp(new THREE.Color(LCD_ON), on * flick);
      nx.fillStyle = '#' + c.getHexString(); nx.fillRect(0, 0, NW, NH);
    } else if (scr.mode === 'boot') {
      nx.fillStyle = LCD_ON; nx.fillRect(0, 0, NW, NH);
      const land = 16, y = Math.min(land, Math.floor(-40 + t / 1.1 * (land + 40)));
      const word = pxText('gavilanbe', INK, 16, true);
      hawk(80 - 13, y, INK, 2); put(word, 80, y + 19, 'center');
      if (t > 1.1 && t < 1.7) { // brillo que recorre el logo
        const sx0 = -30 + (t - 1.1) / .6 * 200; nx.save(); nx.globalCompositeOperation = 'source-atop'; nx.fillStyle = accentOf(g); for (let k = 0; k < 6; k++) nx.fillRect(Math.round(sx0 + k), 0, 1, NH); nx.fillStyle = '#ffffff'; nx.fillRect(Math.round(sx0 + 6), 0, 2, NH); nx.restore();
        nx.fillStyle = LCD_ON; nx.globalCompositeOperation = 'destination-over'; nx.fillRect(0, 0, NW, NH); nx.globalCompositeOperation = 'source-over';
      }
      if (t > 1.6) { const letters = 'POCKET', shown = Math.min(letters.length, Math.floor((t - 1.6) / .09) + 1); let px0 = 80 - 21; for (let i = 0; i < shown; i++) { const pop = (t - 1.6 - i * .09) < .08 ? -2 : 0; put(pxText(letters[i], accentOf(g), 8, true), px0 + i * 7, y + 40 + pop); } }
      if (t > 2.2) { put(pxText('™', INK), 80 + 24, y + 38); put(pxText('© gavilanbe', '#8a8f7a'), 80, 90, 'center'); }
      if (t > 2.5) { // disolución en bloques hacia la pantalla de título
        pvx.clearRect(0, 0, NW, NH); drawTitle(g, now, pvx);
        const n = Math.floor(Math.min(1, (t - 2.5) / .45) * BLOCKS.length);
        for (let i = 0; i < n; i++) { const [bx, by] = BLOCKS[i]; nx.drawImage(prev, bx, by, 4, 4, bx, by, 4, 4); }
      }
    } else if (scr.mode === 'title') {
      drawTitle(g, now);
    } else if (scr.mode === 'launch') {
      drawTitle(g, now);
      const a = Math.max(0, 1 - t / .7); nx.fillStyle = `rgba(255,255,255,${a})`; nx.fillRect(0, 0, NW, NH);
      nx.fillStyle = '#c6f432'; nx.fillRect(40, 40, 80, 18); nx.fillStyle = INK; nx.fillRect(40, 58, 80, 1);
      put(pxText('¡A JUGAR!', INK, 8, true), 80, 45, 'center');
    } else if (scr.mode === 'welcome') {
      drawTitle(g, now);
      nx.fillStyle = 'rgba(16,12,24,.7)'; nx.fillRect(0, 0, NW, NH);
      put(pxText('¡HAS VUELTO!', '#c6f432', 16, true), 80, 26, 'center');
      nx.fillStyle = '#ffd23f'; nx.fillRect(44, 56, 72, 14); put(pxText('+1 PEGATINA', INK), 80, 58, 'center');
    } else if (scr.mode === 'glitch') {
      const img = thumbOf(g);
      nx.fillStyle = '#12161a'; nx.fillRect(0, 0, NW, NH);
      for (let i = 0; i < 18; i++) { const yy = Math.floor(Math.random() * NH), h = 1 + Math.floor(Math.random() * 8); if (img) nx.drawImage(img, 0, yy, NW, h, Math.floor((Math.random() - .5) * 30), yy, NW, h); }
      for (let i = 0; i < 30; i++) { nx.fillStyle = ['#ff5b35', '#c6f432', '#6fd3ff', '#fff'][i % 4]; nx.fillRect(Math.floor(Math.random() * NW), Math.floor(Math.random() * NH), 2 + Math.floor(Math.random() * 10), 1); }
      nx.fillStyle = 'rgba(18,22,26,.9)'; nx.fillRect(14, 32, 132, 34); nx.fillStyle = '#ff5b35'; nx.fillRect(14, 32, 132, 1);
      put(pxText('ERROR DE LECTURA', '#fff6e0', 8, true), 80, 37, 'center');
      if (Math.floor(now / 400) % 2) put(pxText('SOPLA EL CARTUCHO', '#c6f432'), 80, 51, 'center');
    }
    // ×3 sin suavizado + rejilla de puntos del LCD + reflejo
    sx.imageSmoothingEnabled = false; sx.drawImage(nat, 0, 0, SW, SH);
    sx.fillStyle = lcdPat; sx.fillRect(0, 0, SW, SH);
    if (scr.mode !== 'off') { const gr = sx.createLinearGradient(0, 0, SW * .6, SH); gr.addColorStop(0, 'rgba(255,255,255,.07)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, SW, SH); }
    else { const gr = sx.createLinearGradient(0, 0, SW, SH); gr.addColorStop(0, 'rgba(255,255,255,.08)'); gr.addColorStop(.45, 'rgba(255,255,255,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, SW, SH); }
    screenTex.needsUpdate = true;
  }
  const lcdPat = (() => { const c = document.createElement('canvas'); c.width = c.height = 3; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.1)'; x.fillRect(0, 2, 3, 1); x.fillRect(2, 0, 1, 2); return sx.createPattern(c, 'repeat'); })();
  // monitor del ordenador
  let trm = {mode: 'idle', t0: performance.now(), g: null}, lastTermKey = '';
  function drawTerm(now) {
    const t = (now - trm.t0) / 1000, key = trm.mode + (trm.g && trm.g.name) + Math.floor(now / 60);
    if (key === lastTermKey) return; lastTermKey = key;
    tx.fillStyle = '#07120b'; tx.fillRect(0, 0, TW, TH);
    tx.font = `500 19px ${MO}`; tx.textBaseline = 'alphabetic';
    const lines = [];
    if (trm.mode === 'idle') lines.push('gavilanbe DOS 6.22', '', 'A:\\> dir', 'Inserta un disquete…', '');
    else {
      const g = trm.g, dir = g.repo.split('/').pop();
      const all = ['A:\\> leyendo disquete…', g.label.slice(0, 34), '', 'Este juego va en tu terminal:', '', '$ git clone', `  ${g.repo.replace('https://', '')}`, `$ cd ${dir}`, '', 'Pulsa la pantalla para copiar'];
      let chars = Math.floor(t * 42); for (const l of all) { if (chars <= 0) break; lines.push(l.slice(0, chars)); chars -= l.length + 3; }
    }
    lines.forEach((l, i) => { tx.fillStyle = l.startsWith('$') || l.startsWith('  ') ? '#d5ff6a' : '#7dff9a'; tx.fillText(l, 24, 42 + i * 31); });
    if (Math.floor(now / 480) % 2) { const last = lines.length ? lines[lines.length - 1] : ''; tx.fillStyle = '#7dff9a'; tx.fillRect(24 + tx.measureText(last).width + 4, 42 + (lines.length - 1) * 31 - 18, 12, 22); }
    tx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < TH; y += 3) tx.fillRect(0, y, TW, 1);
    const v = tx.createRadialGradient(TW / 2, TH / 2, TH * .3, TW / 2, TH / 2, TH * .8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); tx.fillStyle = v; tx.fillRect(0, 0, TW, TH);
    termTex.needsUpdate = true;
  }

  // ── acciones ──────────────────────────────────
  let inSlot = null, inDrive = null, token = 0, glitched = false, ledOn = 0, driveBlink = 0, jolt = 0, joltV = 0, diving = false, diveTimer = 0, powerOn = 0;
  const idxOf = g => GB.lists.cart.indexOf(g);
  async function ejectCart() {
    const o = inSlot; if (!o) return;
    inSlot = null; ledOn = 0; powerOn = 0; setScr('off'); Sound.eject();
    scene.attach(o);
    const gi = idxOf(o.userData.game);
    await anim(.22, (() => { const y0 = o.position.y; return e => { o.position.y = y0 + e * 2; }; })(), E.out);
    if (kind === 'cart' && gi >= 0) await fly(o, () => ({pos: beltWorld(gi), quat: belt.getWorldQuaternion(Q()), scale: beltPose(0).s}), .7, {lift: 1.5});
    else await fly(o, () => ({pos: o.position.clone().add(new THREE.Vector3(8, 4, 0)), quat: o.quaternion, scale: .3}), .5);
    scene.remove(o); beltHide.delete(gi); wake();
  }
  async function insertCart(g, opt = {}) {
    const my = ++token; GB.tip(null);
    const gi = idxOf(g);
    if (inSlot && inSlot.userData.game === g) { if (scr.mode === 'off') boot(g, my); return; }
    const prev = ejectCart();
    beltHide.add(gi);
    const cart = makeCart(g); scene.add(cart);
    if (opt.first) {
      rig.add(cart); cart.position.set(0, SLOT_Y, SLOT_Z); inSlot = cart; ledOn = 1; powerOn = 1;
      GB.setState(GB.firstNote, 'on');
      setScr('power', g); await wait(1.3); if (my !== token) return; Sound.power(); boot(g, my); return;
    }
    if (kind === 'cart' && gi >= 0) { beltWorld(gi, cart.position); cart.quaternion.copy(belt.getWorldQuaternion(Q())); cart.scale.setScalar(beltPose(0).s); }
    else { cart.position.set(con.position.x + 6, 9, 4); cart.rotation.set(.4, -1, .3); }
    inSlot = cart;
    GB.setState(opt.roulette ? 'Girando la ruleta…' : 'Metiendo el cartucho…', 'busy'); Sound.whoosh();
    if (opt.roulette && !REDUCE) {
      await fly(cart, () => ({pos: rig.localToWorld(new THREE.Vector3(-.2, .9, 3.2)), quat: rig.getWorldQuaternion(Q()), scale: 1.25}), .55, {lift: 1});
      const pool = GB.lists.cart; let d = .05, i = 0;
      while (d < .3) { if (my !== token) return; const r = pool[Math.floor(Math.random() * pool.length)]; cart.userData.label.material = matFor('f:' + r.name, frontTex(r)); cart.rotateY(Math.PI); Sound.spin(i++); wake(); await wait(d); d *= 1.17; }
      cart.userData.label.material = matFor('f:' + g.name, frontTex(g)); cart.quaternion.copy(rig.getWorldQuaternion(Q())); Sound.coin();
      burst(cart.position, ['#ffd23f', '#c6f432', '#fff'], 30, 4); await wait(.25);
    }
    if (my !== token) return;
    await fly(cart, slotTarget(2.5), opt.roulette ? .45 : .8, {lift: 2.2, spin: opt.roulette ? 0 : Math.PI * 2});
    if (my !== token) return;
    await anim(.18, (() => { const y0 = cart.position.y; return e => { const tg = slotTarget(0)(); cart.position.set(tg.pos.x, y0 + (tg.pos.y - y0) * e, tg.pos.z); cart.quaternion.copy(tg.quat); }; })(), E.in);
    if (my !== token) return;
    rig.attach(cart); cart.position.set(0, SLOT_Y, SLOT_Z); cart.rotation.set(0, 0, 0); cart.scale.setScalar(1);
    Sound.insert(); joltV = -7; navigator.vibrate && navigator.vibrate(30);
    burst(rig.localToWorld(new THREE.Vector3(0, CH / 2, 0)), ['#ffffff', '#ffd23f', (GB.EDITIONS[g.model] || {}).studio || '#fff'], 36, 6, 4);
    await prev; await wait(.2);
    if (my !== token) return;
    powerOn = 1; Sound.power(); ledOn = 1; setScr('power', g); await wait(.45);
    if (my !== token) return;
    if (!glitched && !opt.roulette && !REDUCE && Math.random() < .12) { glitched = true; setScr('glitch', g); Sound.error(); GB.setState('Error de lectura', 'glitch'); return; }
    boot(g, my);
  }
  async function boot(g, my) {
    setScr('boot', g); GB.setState('Arrancando…', 'busy');
    setTimeout(() => { if (my === token && scr.mode === 'boot') Sound.boot(); }, REDUCE ? 0 : 1100);
    await wait(2.95);
    if (my !== token || scr.mode !== 'boot') return;
    setScr('title', g); GB.setState('Pulsa START', 'on');
  }
  async function blow() {
    if (scr.mode !== 'glitch' || !inSlot) return;
    const my = ++token, cart = inSlot, g = cart.userData.game;
    GB.setState('Soplando…', 'busy'); ledOn = 0; setScr('off');
    scene.attach(cart);
    await fly(cart, () => ({pos: rig.localToWorld(new THREE.Vector3(0, 2.2, 3.4)), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.15, 0, 0)).premultiply(rig.getWorldQuaternion(Q())), scale: 1.2}), .5, {lift: 1});
    Sound.blow();
    const bottom = cart.localToWorld(new THREE.Vector3(0, -1.4, 0));
    for (let k = 0; k < 3; k++) setTimeout(() => burst(bottom, ['#c9b48a', '#a8966f', '#e2d4b2'], 26, 4, 2.5), k * 120);
    for (const z of [.35, -.35, .2, 0]) await anim(.1, (() => { const q0 = cart.quaternion.clone(), q1 = q0.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, z * .5))); return e => cart.quaternion.slerpQuaternions(q0, q1, e); })());
    await fly(cart, slotTarget(2.4), .5, {lift: .5});
    await anim(.16, (() => { const y0 = cart.position.y; return e => { const tg = slotTarget(0)(); cart.position.set(tg.pos.x, y0 + (tg.pos.y - y0) * e, tg.pos.z); }; })(), E.in);
    if (my !== token) return;
    rig.attach(cart); cart.position.set(0, SLOT_Y, SLOT_Z); cart.rotation.set(0, 0, 0); inSlot = cart;
    Sound.insert(); joltV = -7; ledOn = 1; setScr('power', g); await wait(.4); boot(g, my);
  }
  const DRIVE = () => pc.localToWorld(new THREE.Vector3(.9, .9, 2.3));
  async function ejectDisk() {
    const o = inDrive; if (!o) return; inDrive = null; trm = {mode: 'idle', t0: performance.now(), g: null};
    await anim(.3, (() => { const p0 = o.position.clone(); return e => { o.position.copy(p0).add(new THREE.Vector3(0, 0, 2 * e)); }; })(), E.out);
    const gi = GB.lists.disk.indexOf(o.userData.game);
    await fly(o, () => kind === 'disk' ? {pos: beltWorld(gi), quat: belt.getWorldQuaternion(Q()), scale: beltPose(0).s} : {pos: o.position.clone().add(new THREE.Vector3(0, 6, 0)), quat: o.quaternion, scale: .3}, .6, {lift: 1.2});
    scene.remove(o); beltHide.delete(gi); wake();
  }
  async function insertDisk(g, opt = {}) {
    const my = ++token; GB.tip(null);
    const gi = GB.lists.disk.indexOf(g);
    if (inDrive && inDrive.userData.game === g) return;
    const prev = ejectDisk();
    beltHide.add(gi);
    const f = makeFloppy(g); scene.add(f);
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    if (kind === 'disk' && gi >= 0 && !opt.first) { beltWorld(gi, f.position); f.quaternion.copy(belt.getWorldQuaternion(Q())); f.scale.setScalar(beltPose(0).s); }
    else { f.position.copy(DRIVE()).add(new THREE.Vector3(0, 0, 1.6)); f.quaternion.copy(flat); }
    inDrive = f;
    GB.setState('Metiendo el disquete…', 'busy'); Sound.whoosh();
    await prev;
    if (!opt.first) await fly(f, () => ({pos: DRIVE().add(new THREE.Vector3(0, .05, 1.7)), quat: flat, scale: 1}), .8, {lift: 2});
    if (my !== token) return;
    await anim(.35, (() => { const p0 = f.position.clone(); return e => { f.position.copy(p0).add(new THREE.Vector3(0, 0, -1.95 * e)); }; })(), E.in);
    if (my !== token) return;
    Sound.disk(); driveBlink = 1.6; navigator.vibrate && navigator.vibrate([20, 40, 20]);
    trm = {mode: 'load', t0: performance.now() + 600, g}; wake();
    GB.setState('Disquete leído · pulsa para copiar', 'on');
  }
  function dive() {
    if (!inSlot || diving) return;
    diving = true; setScr('launch', inSlot.userData.game); Sound.whoosh();
    clearTimeout(diveTimer);
    setTimeout(() => GB.flash(), REDUCE ? 0 : 750);
    diveTimer = setTimeout(back, 4200);
  }
  function back() {
    if (!diving) return;
    diving = false; clearTimeout(diveTimer); GB.undive && GB.undive(); wake();
    if (inSlot) { setScr('welcome', inSlot.userData.game); GB.setState('¡Has vuelto!', 'on'); setTimeout(() => { if (scr.mode === 'welcome') { setScr('title'); GB.setState('Pulsa START', 'on'); } }, 2600); }
  }
  function press(k) {
    const g = btn[k]; if (!g) return;
    if (g === dpad) { const r = {left: [0, -.3], right: [0, .3], up: [-.3, 0], down: [.3, 0]}[k]; dpad.rotation.set(r[0], r[1], 0); anim(.25, e => dpad.rotation.set(r[0] * (1 - e), r[1] * (1 - e), 0), E.out); }
    else { const z0 = g.userData.z0 ?? (g.userData.z0 = g.position.z); g.position.z = z0 - .07; anim(.2, e => { g.position.z = z0 - .07 * (1 - e); }, E.out); }
    Sound.press();
  }
  // carcasa
  const shellTo = new THREE.Color('#dcd6ca');
  let spin = 0, spinV = 0;
  function setShell(hex, gold) {
    if (gold) { shellTo.set('#d9a93f'); shellMat.metalness = .9; shellMat.roughness = .26; }
    else { shellTo.set(hex); shellMat.metalness = 0; shellMat.roughness = .42; }
    const l = shellTo.r * .3 + shellTo.g * .59 + shellTo.b * .11;
    printColor = l < .35 ? '#ece6da' : '#2a2640'; printSoft = l < .35 ? 'rgba(236,230,218,.6)' : 'rgba(42,38,64,.6)'; faceBase = '#' + shellTo.getHexString(); shellMat.color.copy(shellTo); faceMat.metalness = shellMat.metalness; faceMat.roughness = shellMat.roughness;
    fonts.then(drawFace);
    if (!REDUCE && started) spinV += gold ? 16 : 9;
    wake();
  }

  // ── plató: disposición y cámara ────────────────
  let W = 1, H = 1, L = {}, mode = 'cart';
  const ST = {cart: 0, disk: -30};
  const cam = {pos: new THREE.Vector3(0, 2, 30), look: new THREE.Vector3(0, 0, 0)}, camWant = {pos: V(), look: V()};
  function layout() {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const narrow = W < 760 || W / H < .9;
    const floorY = narrow ? -2.6 : -4.4;
    L = narrow
      ? {narrow, floorY, conPos: [0, 3.3, -1.6], pcPos: [0, floorY, -2.4], beltX: 0, beltZ: 4.2, beltY: floorY + .36 + 1.4, beltItem: .82,
         box: {cart: [-2.3, 2.3, floorY + .2, 7.2], disk: [-3.4, 3.4, floorY, floorY + 10.4]}, safe: [-.94, .94, -.3, .8]}
      : {narrow, floorY, conPos: [3.9, 1.0, 0], pcPos: [4.2, floorY, -1.6], beltX: .4, beltZ: 3, beltY: floorY + .36 + 1.1, beltItem: .78,
         box: {cart: [-2.2, 6.2, floorY + .1, 5.1], disk: [-2.2, 7.8, floorY + .1, floorY + 10.6]}, safe: [-.18, .86, -.72, .8]};
    floor.position.y = floorY; plinth.position.set(0, floorY + .18, 0); spot.position.set(0, floorY + .37, .3);
    con.position.set(ST.cart + L.conPos[0], L.conPos[1], L.conPos[2]);
    conShadow.position.set(con.position.x, floorY + .01, con.position.z + .4);
    pc.position.set(ST.disk + L.pcPos[0], L.pcPos[1] + 2.4, L.pcPos[2]); pc.scale.setScalar(narrow ? .78 : 1);
    belt.position.z = L.beltZ;
    wake();
  }
  function camPose(which, out) {
    const [bx0, bx1, by0, by1] = L.box[which], [sx0, sx1, sy0, sy1] = L.safe, tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const hH = Math.max((by1 - by0) / (sy1 - sy0), (bx1 - bx0) / (sx1 - sx0) / camera.aspect), hW = hH * camera.aspect;
    const D = hH / tan, cx = ST[which] + (bx0 + bx1) / 2 - ((sx0 + sx1) / 2) * hW, cy = (by0 + by1) / 2 - ((sy0 + sy1) / 2) * hH;
    out.look.set(cx, cy, 0); out.pos.set(cx + mouse.x * 1.1, cy + D * .075 - mouse.y * .6, D);
  }
  function divePose(out) {
    const c = screen.getWorldPosition(V()), n = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.getWorldQuaternion(Q()));
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max(.74, 1.17 / camera.aspect) / tan;
    out.look.copy(c); out.pos.copy(c).addScaledVector(n, d);
  }
  function setMode(m, newList, focusIdx, instant) {
    const changed = m !== mode || !list.length;
    mode = m; wake();
    if (!changed) { focusBelt(focusIdx); return; }
    if (instant || !list.length) { setBeltList(newList, m, focusIdx); belt.position.x = ST[m] + L.beltX; return; }
    const x0 = belt.position.x, x1 = ST[m] + L.beltX; let swapped = false;
    anim(1.1, e => { belt.position.x = x0 + (x1 - x0) * e; beltScale = Math.abs(1 - 2 * e) * .9 + .1; if (e > .5 && !swapped) { swapped = true; setBeltList(newList, m, focusIdx); } }, E.io).then(() => { beltScale = 1; });
  }

  // ── puntero ───────────────────────────────────
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), mouse = {x: 0, y: 0};
  let hoverItem = null, drag = null;
  const el = renderer.domElement;
  function pickAt(cx, cy) {
    const r = el.getBoundingClientRect();
    ptr.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const objs = [...hits, screen, body];
    for (const s of slots) if (s.mesh && s.mesh.visible) objs.push(s.mesh.userData.body, s.mesh.userData.label || s.mesh.userData.body);
    const hit = ray.intersectObjects(objs, false)[0];
    return hit ? hit.object : null;
  }
  const TIPS = {a: 'A · Meter / Jugar', b: 'B · Sorpresa', start: 'START · Jugar', select: 'SELECT · Color', left: '◀ Anterior', right: 'Siguiente ▶', up: '◀ Anterior', down: 'Siguiente ▶', keys: 'Teclear', term: 'Copiar el comando'};
  let pendingMove = null;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width - .5; mouse.y = (e.clientY - r.top) / r.height - .5; wake();
    if (drag) {
      const dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx);
      if (drag.mode === 'belt' && drag.moved > 4) { const upx = (2 * Math.tan(THREE.MathUtils.degToRad(15)) * (camera.position.z - L.beltZ) * camera.aspect) / W; const d = -dx * upx / 2.75; beltPos += d; beltVel = d / .016; }
      else if (drag.mode === 'spin') spin += dx * .012;
      return;
    }
    if (e.pointerType === 'mouse') pendingMove = {x: e.clientX, y: e.clientY, tx: e.clientX - r.left, ty: e.clientY - r.top};
  });
  function hoverPick() {
    if (!pendingMove) return; const pm = pendingMove; pendingMove = null;
    const o = pickAt(pm.x, pm.y), item = o && o.userData.item;
    hoverItem = item || null;
    el.dataset.cur = o && o.userData.action !== 'spin' ? 'hand' : 'grab';
    if (item) { const g = item.userData.game, foc = item.userData.gi === GB.st.focus; GB.tip(foc ? (kind === 'cart' ? `Meter «${g.label}»` : `Meter «${g.label}» en el PC`) : g.label, pm.tx, pm.ty); }
    else if (o === screen) GB.tip({title: 'START · Jugar', boot: 'Saltar intro', glitch: 'Soplar el cartucho', off: 'Meter el cartucho'}[scr.mode] || '', pm.tx, pm.ty);
    else if (o && TIPS[o.userData.action]) GB.tip(TIPS[o.userData.action], pm.tx, pm.ty);
    else if (o === body) GB.tip('Arrastra para girarla', pm.tx, pm.ty);
    else GB.tip(null);
  }
  el.addEventListener('pointerleave', () => { hoverItem = null; GB.tip(null); mouse.x = mouse.y = 0; wake(); });
  el.addEventListener('pointerdown', e => {
    const o = pickAt(e.clientX, e.clientY);
    drag = {x: e.clientX, moved: 0, o, mode: o === body ? 'spin' : 'belt'}; wake();
    try { el.setPointerCapture(e.pointerId); } catch {}
  });
  function up(e) {
    if (!drag) return;
    const d = drag; drag = null; wake();
    if (d.mode === 'belt' && d.moved > 4) { const n = list.length; const tgt = Math.round(beltPos + beltVel * .12); beltTarget = tgt; beltVel *= .3; GB.focus(mod(tgt, n), {from3d: true}); return; }
    if (d.moved > 6 || e.type === 'pointercancel') return;
    act(d.o);
  }
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  function act(o) {
    if (!o) return;
    const item = o.userData.item;
    if (item && item.userData.gi != null) { const gi = item.userData.gi; if (gi === GB.st.focus) GB.primary(); else GB.focus(gi); return; }
    if (o === screen) { press('start'); const m = scr.mode; if (m === 'title' || m === 'welcome') GB.start(); else if (m === 'boot') { setScr('title'); GB.setState('Pulsa START', 'on'); } else if (m === 'glitch') blow(); else GB.primary(); return; }
    const a = o.userData.action;
    if (a === 'keys') { Sound.key(); return; }
    if (a === 'term') { if (inDrive) GB.start(); return; }
    if (!a || a === 'spin') return;
    press(a);
    if (a === 'a' || a === 'start') GB.primary();
    else if (a === 'b') GB.surprise();
    else if (a === 'select') GB.cycleShell();
    else if (a === 'left' || a === 'up') GB.focus(GB.st.focus - 1);
    else if (a === 'right' || a === 'down') GB.focus(GB.st.focus + 1);
  }

  // ── bucle: 60 fps con movimiento, ~10 fps en reposo ─
  let visible = true, last = performance.now(), started = false, frames = 0, lastRender = 0, slowFrames = 0;
  function wake(ms = 1200) { awakeUntil = Math.max(awakeUntil, performance.now() + ms); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(host);
  new ResizeObserver(() => layout()).observe(host);
  document.addEventListener('visibilitychange', () => wake());
  layout();
  const white = new THREE.Color('#ffffff');
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if ((!visible || document.hidden) && frames > 3) return;
    const busyScreen = /power|boot|launch|glitch|welcome/.test(scr.mode) || (trm.mode === 'load' && now - trm.t0 < 4000) || driveBlink > 0;
    const active = now < awakeUntil || anims.size > 0 || busyScreen || !!drag || diving || sparkAlive > 0 || Math.abs(jolt) > .0005 || Math.abs(spinV) > .01;
    if (!active && now - lastRender < 110 && frames > 3) return;
    const fdt = Math.min(.05, (now - lastRender) / 1000 || dt); lastRender = now;
    const t = now / 1000;
    for (const a of [...anims]) { a.t += fdt; const p = a.dur ? Math.min(1, a.t / a.dur) : 1; a.fn(a.ease(p)); if (p >= 1) { anims.delete(a); a.res(); } }
    // plató
    studio.lerp(studioTo, 1 - Math.exp(-fdt * 4));
    scene.background.copy(studio); scene.fog.color.copy(studio); floorMat.color.copy(studio);
    plinthMat.color.copy(studio).lerp(white, .72); hemi.groundColor.copy(studio);
    // consola
    if (!drag || drag.mode !== 'spin') { spinV *= Math.exp(-fdt * 2.2); spin += spinV * fdt; const tgt = Math.round(spin / (Math.PI * 2)) * Math.PI * 2; if (Math.abs(spinV) < 2) spin += (tgt - spin) * (1 - Math.exp(-fdt * 4)); }
    joltV += (-jolt * 260 - joltV * 14) * fdt; jolt += joltV * fdt * .05;
    rig.position.y = jolt * 2;
    rig.scale.set(1 - jolt * 1.2, 1 + jolt * 2, 1 - jolt * 1.2);
    rig.rotation.x += ((REDUCE ? 0 : mouse.y * .2) - .03 - rig.rotation.x) * .1;
    rig.rotation.y += (((REDUCE || L.narrow ? 0 : mouse.x * .4) - (L.narrow ? 0 : .26)) + spin - rig.rotation.y) * (drag && drag.mode === 'spin' ? .5 : .12);
    power.position.x += ((powerOn ? -.92 : -1.2) - power.position.x) * .2;
    const li = ledOn ? 2.6 : 0; led.material.emissiveIntensity += (li - led.material.emissiveIntensity) * .2; ledGlow.material.opacity = led.material.emissiveIntensity / 2.6 * .9;
    driveBlink = Math.max(0, driveBlink - fdt); driveLed.material.emissiveIntensity = driveBlink > 0 ? (Math.sin(t * 40) > 0 ? 3 : .3) : (inDrive ? 1.2 : 0);
    if (updateBelt(fdt)) wake(300);
    placeGhost(); updateSparks(fdt); hoverPick();
    // cámara
    if (diving) divePose(camWant); else camPose(mode, camWant);
    const k = 1 - Math.exp(-fdt * (diving ? 5 : 3));
    cam.pos.lerp(camWant.pos, frames < 2 ? 1 : k); cam.look.lerp(camWant.look, frames < 2 ? 1 : k);
    if (cam.pos.distanceToSquared(camWant.pos) > 1e-4) wake(200);
    camera.position.copy(cam.pos); camera.lookAt(cam.look);
    drawScreen(now); if (mode === 'disk' || inDrive) drawTerm(now);
    renderer.render(scene, camera);
    // si va justo, baja la resolución
    if (active && frames > 30) { slowFrames = dt > .026 ? slowFrames + 1 : Math.max(0, slowFrames - 1); if (slowFrames > 40 && dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); layout(); slowFrames = 0; } }
    if (++frames === 3) onFirstFrames();
  });
  function screenRect() {
    const pts = [[-1.15, -.72], [1.15, .72]].map(([a, b]) => screen.localToWorld(new THREE.Vector3(a, b, 0)).project(camera));
    const r = el.getBoundingClientRect();
    const xs = pts.map(p => r.left + (p.x + 1) / 2 * r.width), ys = pts.map(p => r.top + (1 - p.y) / 2 * r.height);
    return {left: Math.min(...xs), top: Math.min(...ys), width: Math.abs(xs[1] - xs[0]), height: Math.abs(ys[1] - ys[0])};
  }
  function onFirstFrames() { started = true; Promise.race([fonts, wait(1.5)]).then(() => GB.hideLoader(screenRect())); }
  fonts.then(() => { drawFace(); drawBezel(); drawSticker(); drawPcFront(); txtCache.clear(); lastScreenKey = ''; lastTermKey = ''; wake(); });
  drawFace(); drawBezel(); drawSticker(); drawPcFront();

  GB.ready({
    mode: (m, l, f, instant) => setMode(m, l, f, instant),
    focus: i => focusBelt(i),
    insert: (g, opt = {}) => g.type === 'web' ? insertCart(g, opt) : insertDisk(g, opt),
    dive, back, blow, press,
    flip: v => { flipTo = v ? 1 : 0; wake(); },
    shell: (hex, gold) => setShell(hex, gold),
    studio: hex => { studioTo.set(hex); wake(1600); },
    get screenMode() { return scr.mode; },
  });
}
