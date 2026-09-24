// gavilanbe POCKET · el plató 3D (three.js). La interfaz vive en index.html (window.GB).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const GB = window.GB;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (GB) { try { main(); } catch (e) { console.error('POCKET 3D', e); } }

function main() {
  const host = document.getElementById('stage');
  const LOW = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  host.append(renderer.domElement);
  const Sound = GB.sound;

  const scene = new THREE.Scene();
  const studio = new THREE.Color('#cfc9bf'), studioTo = studio.clone();
  scene.background = studio.clone();
  scene.fog = new THREE.Fog(studio.clone(), 34, 90);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 300);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9ab95', .45); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff4e4', 1.7);
  key.position.set(9, 18, 14); key.castShadow = true;
  key.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
  Object.assign(key.shadow.camera, {left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70});
  key.shadow.radius = 10; key.shadow.blurSamples = 16; key.shadow.bias = -.0006;
  scene.add(key); scene.add(key.target);
  const rim = new THREE.DirectionalLight('#dfe7ff', 1.1); rim.position.set(-12, 7, -10); scene.add(rim);

  const floorMat = new THREE.MeshStandardMaterial({color: studio.clone(), roughness: .92});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  let composer = null, bloom = null;
  if (!LOW) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .22, .4, .97);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ── lienzos ─────────────────────────────────────
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
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

  // etiquetas de cartucho (delante y detrás) y de disquete
  const texCache = new Map();
  function once(key, w, h, draw, needsImg) {
    if (texCache.has(key)) return texCache.get(key);
    const t = canvasTex(w, h, x => draw(x, null));
    texCache.set(key, t);
    Promise.all([needsImg ? loadImg(needsImg) : null, fonts]).then(([img]) => { draw(t.userData.ctx, img); t.needsUpdate = true; });
    return t;
  }
  const frontTex = g => once('f:' + g.name, 400, 400, (x, img) => {
    const a = ACC(g.model);
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
  const backTex = g => once('b:' + g.name, 400, 400, x => {
    const a = ACC(g.model);
    x.fillStyle = '#f7f2e7'; rr(x, 0, 0, 400, 400, 16); x.fill();
    x.fillStyle = '#1c1a22'; x.font = `800 26px ${BR}`; x.textBaseline = 'alphabetic'; x.fillText('gavilanbe POCKET', 20, 44);
    x.fillStyle = a; x.fillRect(20, 58, 360, 5);
    x.fillStyle = '#1c1a22'; x.font = `800 22px ${BR}`; const tl = g.label.length > 30 ? g.label.slice(0, 29) + '…' : g.label; x.fillText(tl, 20, 96);
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

  // ── materiales ─────────────────────────────────
  const PM = THREE.MeshPhysicalMaterial, SM = THREE.MeshStandardMaterial;
  const edMats = {};
  function edMat(id) {
    if (edMats[id]) return edMats[id];
    const f = {
      'opus-4.6': () => new PM({color: '#cfcac1', roughness: .5, clearcoat: .3}),
      'opus-4.7': () => new PM({color: '#2d2d33', roughness: .38, clearcoat: .6, clearcoatRoughness: .25}),
      'opus-4.8': () => new PM({color: '#e4b24b', metalness: .92, roughness: .24}),
      'fable': () => new PM({color: '#b17df8', transmission: .7, thickness: .8, roughness: .14, ior: 1.42, attenuationColor: '#5b1fc2', attenuationDistance: .9, clearcoat: .7}),
      'fable-5.1': () => new PM({color: '#dcf3ff', transmission: .85, thickness: .8, roughness: .08, ior: 1.45, attenuationColor: '#59b3e8', attenuationDistance: 1.3, clearcoat: .7}),
      'astra': () => new PM({color: '#c0f77e', transmission: .72, thickness: .8, roughness: .16, emissive: '#53c21f', emissiveIntensity: .25, attenuationColor: '#56c21f', attenuationDistance: 1, clearcoat: .6}),
      'opus-5.5': () => new PM({color: '#f3eefb', metalness: .5, roughness: .14, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [160, 860], clearcoat: 1}),
    }[id];
    return edMats[id] = f ? f() : new PM({color: '#cbc4b8', roughness: .5});
  }
  const CLEAR = new Set(['fable', 'fable-5.1', 'astra']);
  const pcbTex = canvasTex(256, 256, x => {
    x.fillStyle = '#1d6e3e'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#48b074'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { x.beginPath(); const a = 20 + i * 16; x.moveTo(a, 200); x.lineTo(a, 120 - (i % 4) * 14); x.lineTo(a + 30, 90 - (i % 3) * 10); x.stroke(); }
    x.fillStyle = '#141418'; x.fillRect(70, 40, 110, 60); x.fillRect(30, 124, 50, 36);
    x.fillStyle = '#e7b73c'; for (let i = 0; i < 22; i++) x.fillRect(12 + i * 10.6, 214, 7, 42);
  });
  const paperMat = new SM({color: '#f1ebdd', roughness: .75});

  // ── cartuchos y disquetes ──────────────────────
  function cartShape(w, h, r, n) {
    const s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - n); s.lineTo(x1 - n, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }
  const CART_H = 2.8;
  const cartGeo = new THREE.ExtrudeGeometry(cartShape(2.5, CART_H, .12, .4), {depth: .26, bevelEnabled: true, bevelThickness: .045, bevelSize: .045, bevelSegments: 4, curveSegments: 8});
  cartGeo.translate(0, 0, -.13);
  const labelGeo = new THREE.PlaneGeometry(2.04, 2.04);
  const gripGeo = new THREE.BoxGeometry(1.5, .05, .035);
  const topGeo = new THREE.BoxGeometry(.05, .26, .03);
  const pcbGeo = new THREE.PlaneGeometry(2.05, 2.3);
  function makeCart(g) {
    const grp = new THREE.Group(), mat = edMat(g.model);
    const body = new THREE.Mesh(cartGeo, mat); body.castShadow = true; body.receiveShadow = true; grp.add(body);
    if (CLEAR.has(g.model)) { const p = new THREE.Mesh(pcbGeo, new SM({map: pcbTex, roughness: .6})); p.position.y = -.15; grp.add(p); }
    const label = new THREE.Mesh(labelGeo, new SM({map: frontTex(g), roughness: .55, transparent: true}));
    label.position.set(0, .22, .177); grp.add(label);
    const back = new THREE.Mesh(labelGeo, new SM({map: backTex(g), roughness: .6, transparent: true}));
    back.rotation.y = Math.PI; back.position.set(0, .22, -.177); back.scale.set(.92, .92, 1); grp.add(back);
    for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(gripGeo, mat); r.position.set(0, -1.02 - i * .085, .176); grp.add(r); }
    for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(topGeo, mat); r.position.set(-.75 + i * .2, 1.2, .176); grp.add(r); }
    body.userData.item = grp; label.userData.item = grp; back.userData.item = grp;
    grp.userData = {game: g, label, back, body};
    return grp;
  }
  const floppyGeo = new RoundedBoxGeometry(2.7, 2.8, .12, 3, .05);
  const shutterMat = new PM({color: '#dfe4ea', metalness: 1, roughness: .28});
  function makeFloppy(g) {
    const grp = new THREE.Group(), mat = edMat(g.model);
    const body = new THREE.Mesh(floppyGeo, mat); body.castShadow = true; grp.add(body);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, .14), shutterMat); sh.position.set(.1, .9, 0); grp.add(sh);
    const hole = new THREE.Mesh(new THREE.BoxGeometry(.26, .62, .145), new SM({color: '#4a3a2a'})); hole.position.set(.36, .92, 0); grp.add(hole);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.31), new SM({map: floppyTex(g), roughness: .7})); lab.position.set(0, -.6, .062); grp.add(lab);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .04, 32), shutterMat); hub.rotation.x = Math.PI / 2; hub.position.set(0, -.1, -.05); grp.add(hub);
    body.userData.item = grp; lab.userData.item = grp; sh.userData.item = grp;
    grp.userData = {game: g, body, floppy: true};
    return grp;
  }

  // ── la consola ─────────────────────────────────
  const CW = 3.4, CH = 5.6, CD = .95, FR = CD / 2, SLOT_Y = 3.0, SLOT_Z = -.1;
  const con = new THREE.Group(); scene.add(con);
  const rig = new THREE.Group(); con.add(rig);
  const shellMat = new PM({color: '#ebe4d6', roughness: .36, clearcoat: .55, clearcoatRoughness: .22, sheen: .25, sheenColor: '#ffffff'});
  const darkMat = new PM({color: '#2a2a31', roughness: .42, clearcoat: .5});
  const holeMat = new SM({color: '#16161a', roughness: .9});
  const add = (mesh, x = 0, y = 0, z = 0, parent = rig) => { mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const body = add(new THREE.Mesh(new RoundedBoxGeometry(CW, CH, CD, 8, .34), shellMat));
  body.userData.action = 'spin';
  add(new THREE.Mesh(new RoundedBoxGeometry(CW + .005, CH + .005, .035, 8, .02), new SM({color: '#6b6770', roughness: .8})), 0, 0, -.12);
  // marco y pantalla
  const bezelTex = canvasTex(580, 460);
  const drawBezel = () => { const x = bezelTex.userData.ctx; x.clearRect(0, 0, 580, 460); x.fillStyle = '#34343f'; rr(x, 0, 0, 580, 460, [22, 22, 110, 22]); x.fill(); x.fillStyle = '#ff5b35'; x.fillRect(36, 22, 140, 5); x.fillStyle = '#c6f432'; x.fillRect(36, 31, 140, 5); x.fillStyle = '#b9b6c6'; x.font = `500 16px ${MO}`; x.textAlign = 'center'; x.fillText('GAVILANBE COLOR LCD', 290, 37); x.fillStyle = '#ff5b35'; x.fillRect(404, 22, 140, 5); x.fillStyle = '#c6f432'; x.fillRect(404, 31, 140, 5); x.fillStyle = '#8e8a9c'; x.font = `500 12px ${MO}`; x.textAlign = 'left'; x.fillText('POWER', 12, 178); bezelTex.needsUpdate = true; };
  drawBezel(); fonts.then(drawBezel);
  add(new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.3), new SM({map: bezelTex, transparent: true, roughness: .3})), 0, 1.2, FR + .002).castShadow = false;
  const SW = 480, SH = 300;
  const screenTex = canvasTex(SW, SH); const sx = screenTex.userData.ctx;
  const screenMat = new THREE.MeshBasicMaterial({map: screenTex, toneMapped: false, color: '#e8e8e8'});
  const screen = add(new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.4), screenMat), .02, 1.18, FR + .006);
  screen.castShadow = false; screen.userData.action = 'screen';
  const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.55), new PM({color: '#fff', transparent: true, opacity: .1, roughness: .02, clearcoat: 1, envMapIntensity: 2.5})), .02, 1.18, FR + .012);
  glass.castShadow = false; glass.raycast = () => {};
  const led = add(new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new SM({color: '#3a1512', emissive: '#ff2a1a', emissiveIntensity: 0})), -1.24, 1.44, FR + .01);
  // serigrafía
  const printTex = canvasTex(700, 820);
  let printColor = '#2a2640';
  function drawPrint() {
    const x = printTex.userData.ctx; x.clearRect(0, 0, 700, 820); x.fillStyle = printColor; x.textBaseline = 'alphabetic';
    x.font = `italic 800 64px ${BR}`; x.fillText('gavilanbe', 66, 92); x.font = `500 28px ${MO}`; x.fillText('POCKET', 424, 90);
    x.textAlign = 'center'; x.font = `700 28px ${MO}`; x.fillText('A', 580, 318); x.fillText('B', 436, 374);
    x.font = `500 15px ${MO}`; x.fillText('JUGAR', 580, 340); x.fillText('SORPRESA', 436, 396);
    x.save(); x.translate(300, 552); x.rotate(-.42); x.fillText('SELECT', 0, 0); x.restore(); x.save(); x.translate(416, 552); x.rotate(-.42); x.fillText('START', 0, 0); x.restore();
    x.textAlign = 'left'; printTex.needsUpdate = true;
  }
  drawPrint(); fonts.then(drawPrint);
  add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.98), new SM({map: printTex, transparent: true, roughness: .5})), 0, -1.6, FR + .003).castShadow = false;
  // cruceta
  const hits = [];
  const dpad = new THREE.Group(); dpad.position.set(-.92, -1.08, FR); rig.add(dpad);
  const cross = new THREE.Shape(); const CA = .16, CL = .48;
  [[-CA, CL], [CA, CL], [CA, CA], [CL, CA], [CL, -CA], [CA, -CA], [CA, -CL], [-CA, -CL], [-CA, -CA], [-CL, -CA], [-CL, CA], [-CA, CA]].forEach(([px, py], i) => i ? cross.lineTo(px, py) : cross.moveTo(px, py));
  const crossGeo = new THREE.ExtrudeGeometry(cross, {depth: .08, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 3});
  const dp = add(new THREE.Mesh(crossGeo, darkMat), 0, 0, .02, dpad);
  add(new THREE.Mesh(new THREE.CircleGeometry(.64, 40), new SM({color: '#000', transparent: true, opacity: .1})), 0, 0, .003, dpad).castShadow = false;
  add(new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .02, 20), holeMat), 0, 0, .135, dpad).rotation.x = Math.PI / 2;
  [['left', -.32, 0], ['right', .32, 0], ['up', 0, .32], ['down', 0, -.32]].forEach(([a, x, y]) => { const h = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .25), new THREE.MeshBasicMaterial({visible: false})); h.position.set(x, y, .1); h.userData.action = a; dpad.add(h); hits.push(h); });
  // A y B
  const redMat = new PM({color: '#d8345a', roughness: .28, clearcoat: 1, clearcoatRoughness: .1, side: THREE.DoubleSide});
  const domeGeo = new THREE.LatheGeometry([[0, .19], [.12, .185], [.21, .16], [.265, .1], [.28, .02], [.28, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 36); domeGeo.rotateX(Math.PI / 2);
  const btn = {};
  function roundBtn(x, y, action) {
    const g = new THREE.Group(); g.position.set(x, y, FR); rig.add(g);
    add(new THREE.Mesh(new THREE.CircleGeometry(.35, 36), new SM({color: '#000', transparent: true, opacity: .13})), 0, 0, .003, g).castShadow = false;
    const b = add(new THREE.Mesh(domeGeo, redMat), 0, 0, .0, g); b.userData.action = action; hits.push(b);
    btn[action] = g; return g;
  }
  roundBtn(1.12, -.78, 'a'); roundBtn(.42, -1.05, 'b');
  const pillMat = new PM({color: '#77737f', roughness: .7});
  [['select', -.26], ['start', .3]].forEach(([a, x]) => {
    const g = new THREE.Group(); g.position.set(x, -2.03, FR); g.rotation.z = -.42; rig.add(g);
    add(new THREE.Mesh(new THREE.CapsuleGeometry(.09, .36, 6, 16), holeMat), 0, 0, -.04, g).rotation.z = Math.PI / 2;
    const p = add(new THREE.Mesh(new THREE.CapsuleGeometry(.066, .32, 6, 16), pillMat), 0, 0, .03, g); p.rotation.z = Math.PI / 2; p.userData.action = a; hits.push(p);
    btn[a] = g;
  });
  btn.left = btn.right = btn.up = btn.down = dpad;
  // altavoz
  const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(.042, .042, .06, 12), holeMat, 24);
  let hi = 0; const hm = new THREE.Matrix4(), hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const px = .72 + c * .15 + r * .08, py = -1.92 - r * .14 + c * .06; hm.compose(new THREE.Vector3(px, py, FR - .02), hq, new THREE.Vector3(1, 1, 1)); holes.setMatrixAt(hi++, hm); }
  rig.add(holes);
  // arriba, lados y detrás
  add(new THREE.Mesh(new RoundedBoxGeometry(2.8, .2, .54, 2, .06), holeMat), 0, CH / 2 - .02, SLOT_Z);
  const power = add(new THREE.Mesh(new RoundedBoxGeometry(.42, .16, .22, 2, .05), darkMat), -1.2, CH / 2 + .05, .12);
  const wheel = add(new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .12, 28), darkMat), CW / 2 + .02, .9, 0); wheel.rotation.z = Math.PI / 2;
  add(new THREE.Mesh(new THREE.BoxGeometry(.06, .34, .4), holeMat), -CW / 2 - .01, 1.9, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.5, .06, 2, .05), shellMat), 0, -1.7, -FR - .01);
  for (const [px, py] of [[-1.3, 2.4], [1.3, 2.4], [-1.3, -2.4], [1.3, -2.4]]) add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .04, 16), new PM({color: '#9aa0a8', metalness: 1, roughness: .35})), px, py, -FR - .01).rotation.x = Math.PI / 2;
  const stickerTex = canvasTex(512, 512);
  const drawSticker = () => { const x = stickerTex.userData.ctx; x.fillStyle = '#f7f2e7'; rr(x, 0, 0, 512, 512, 30); x.fill(); x.fillStyle = '#1c1a22'; x.font = `800 44px ${BR}`; x.fillText('gavilanbe POCKET', 34, 90); x.font = `500 20px ${MO}`; ['MODELO GVB-01', 'HECHO A MANO CON', 'MODELOS QUE SUEÑAN', '', 'NO APTO PARA SOPLAR', '(SALVO EMERGENCIAS)'].forEach((l, i) => x.fillText(l, 34, 160 + i * 36)); x.fillStyle = '#ff5b35'; x.fillRect(34, 420, 444, 10); x.fillStyle = '#c6f432'; x.fillRect(34, 440, 444, 10); stickerTex.needsUpdate = true; };
  drawSticker(); fonts.then(drawSticker);
  const stk = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new SM({map: stickerTex, roughness: .7})), 0, .8, -FR - .004); stk.rotation.y = Math.PI; stk.castShadow = false;

  // ── el ordenador (disquetes) ───────────────────
  const pc = new THREE.Group(); scene.add(pc);
  const beige = new PM({color: '#e6dcc5', roughness: .55, clearcoat: .2});
  const wood = new PM({color: '#b9895a', roughness: .5, clearcoat: .4});
  const desk = new THREE.Group(); desk.position.y = -2.4; pc.add(desk);
  add(new THREE.Mesh(new RoundedBoxGeometry(8.4, .3, 6.2, 3, .1), wood), 0, 2.25, .8, desk);
  for (const [lx, lz] of [[-3.8, -1.9], [3.8, -1.9], [-3.8, 3.5], [3.8, 3.5]]) add(new THREE.Mesh(new THREE.CylinderGeometry(.14, .12, 2.1, 12), new PM({color: '#2a2a31', roughness: .4})), lx, 1.05, lz, desk);
  add(new THREE.Mesh(new RoundedBoxGeometry(5.6, 1.6, 4.4, 4, .14), beige), 0, .8, 0, pc);
  add(new THREE.Mesh(new RoundedBoxGeometry(3.1, .18, .12, 2, .05), holeMat), .9, .9, 2.2, pc);
  const driveLed = add(new THREE.Mesh(new THREE.BoxGeometry(.18, .08, .05), new SM({color: '#113311', emissive: '#39ff6a', emissiveIntensity: 0})), 2.6, .9, 2.2, pc);
  const pcFront = canvasTex(512, 128);
  const drawPcFront = () => { const x = pcFront.userData.ctx; x.clearRect(0, 0, 512, 128); x.fillStyle = '#3a3542'; x.font = `italic 800 38px ${BR}`; x.fillText('gavilanbe', 14, 52); x.font = `500 20px ${MO}`; x.fillText('486 DX2 · 66 MHz', 14, 88); x.fillStyle = '#ff5b35'; x.fillRect(14, 104, 120, 6); pcFront.needsUpdate = true; };
  drawPcFront(); fonts.then(drawPcFront);
  add(new THREE.Mesh(new THREE.PlaneGeometry(2, .5), new SM({map: pcFront, transparent: true})), -1.6, .95, 2.205, pc).castShadow = false;
  add(new THREE.Mesh(new RoundedBoxGeometry(5.0, 4.1, 3.9, 4, .3), beige), 0, 1.6 + 2.15, -.2, pc);
  add(new THREE.Mesh(new RoundedBoxGeometry(4.3, 3.35, .1, 3, .12), new SM({color: '#2b2a30', roughness: .6})), 0, 3.85, 1.76, pc);
  const TW = 512, TH = 384;
  const termTex = canvasTex(TW, TH); const tx = termTex.userData.ctx;
  const term = add(new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.78), new THREE.MeshBasicMaterial({map: termTex, toneMapped: false})), 0, 3.85, 1.82, pc);
  term.castShadow = false; term.userData.action = 'term';
  add(new THREE.Mesh(new RoundedBoxGeometry(5.6, .32, 1.9, 2, .1), beige), 0, .16, 3.6, pc).userData.action = 'keys';
  const keysTex = canvasTex(512, 176, x => { x.fillStyle = '#d8ceb6'; x.fillRect(0, 0, 512, 176); for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { const w = r === 4 && c > 4 && c < 10 ? 0 : 30; if (!w) continue; x.fillStyle = (r + c) % 7 ? '#f3ecdc' : '#bdb29a'; rr(x, 10 + c * 33, 8 + r * 33, w, 28, 4); x.fill(); } x.fillStyle = '#f3ecdc'; rr(x, 175, 140, 160, 28, 4); x.fill(); });
  add(new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.7), new SM({map: keysTex, roughness: .6})), 0, .325, 3.6, pc).rotation.x = -Math.PI / 2;
  pc.traverse(o => { if (o.userData.action === 'keys') hits.push(o); });
  hits.push(term);

  // ── la cinta expositora ────────────────────────
  const belt = new THREE.Group(); scene.add(belt);
  const plinthMat = new PM({color: '#ffffff', roughness: .25, clearcoat: .8, transparent: true, opacity: .92});
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(90, .36, 3.6, 3, .12), plinthMat);
  plinth.receiveShadow = true; plinth.castShadow = true; belt.add(plinth);
  const spotTex = canvasTex(256, 256, x => { const g = x.createRadialGradient(128, 128, 30, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), new THREE.MeshBasicMaterial({map: spotTex, transparent: true, depthWrite: false, toneMapped: false}));
  spot.rotation.x = -Math.PI / 2; belt.add(spot);
  const SLOTS = 15;
  const slots = Array.from({length: SLOTS}, (_, i) => ({k: i - 7, gi: -1, mesh: null, kind: ''}));
  let list = [], kind = 'cart', beltPos = 0, beltTarget = 0, beltVel = 0, beltLast = 0, flipT = 0, flipTo = 0, beltScale = 1, beltHide = new Set();
  const mod = (a, n) => ((a % n) + n) % n;
  function slotItem(s, gi) {
    if (s.mesh) { belt.remove(s.mesh); s.mesh = null; }
    s.gi = gi; s.kind = kind;
    if (gi < 0 || !list.length) return;
    const g = list[gi];
    s.mesh = kind === 'cart' ? makeCart(g) : makeFloppy(g);
    s.mesh.userData.gi = gi; belt.add(s.mesh);
  }
  function beltWorld(gi, out = new THREE.Vector3()) {
    const n = list.length; let o = gi - beltPos; o -= n * Math.round(o / n);
    const p = beltPose(o); out.set(p.x, p.y, p.z); return belt.localToWorld(out);
  }
  function beltPose(o) {
    const a = Math.abs(o), lift = Math.max(0, 1 - a);
    return {x: o * 2.75 + Math.sign(o) * Math.min(a, 1) * .5, y: L.beltY + lift * lift * 1.1, z: -o * o * .12 + lift * .6, ry: -o * .2, s: (1 - Math.min(a, 6) * .05 + lift * lift * .16) * L.beltItem};
  }
  function updateBelt(dt, t) {
    const n = list.length; if (!n) return;
    // muelle hacia el objetivo
    if (!drag || drag.mode !== 'belt') { const d = beltTarget - beltPos; beltVel += d * 60 * dt; beltVel *= Math.exp(-dt * 11); beltPos += beltVel * dt; }
    const base = Math.round(beltPos);
    if (base !== beltLast) { Sound.tick(base); beltLast = base; }
    flipT += (flipTo - flipT) * (1 - Math.exp(-dt * 7));
    spot.material.opacity = .55 + Math.sin(t * 3) * .15 - Math.min(.5, Math.abs(beltVel) * .1);
    for (const s of slots) {
      const i = base + s.k, gi = mod(i, n), o = i - beltPos;
      if (s.gi !== gi || s.kind !== kind) slotItem(s, gi);
      if (!s.mesh) continue;
      const p = beltPose(o), m = s.mesh, focused = Math.abs(o) < .5;
      m.visible = !beltHide.has(gi) && Math.abs(o) < 7.2;
      m.position.set(p.x, p.y + (focused && !REDUCE ? Math.sin(t * 2) * .06 : 0), p.z);
      m.rotation.set(focused ? -.05 : 0, p.ry + (focused ? mouse.x * .35 + flipT * Math.PI : 0), -beltVel * .012);
      m.scale.setScalar(p.s * beltScale * (hoverItem === m ? 1.06 : 1));
    }
  }
  // fantasma: el hueco del cartucho que está en la consola
  const ghostMat = new THREE.LineDashedMaterial({color: '#ffffff', transparent: true, opacity: .8, dashSize: .12, gapSize: .09});
  const ghost = new THREE.Group();
  const outline = new THREE.Shape(cartShape(2.5, CART_H, .12, .4).getPoints(10));
  const gl = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outline.getPoints()), ghostMat); gl.computeLineDistances(); ghost.add(gl);
  belt.add(ghost);
  function placeGhost(t) {
    const g = kind === 'cart' ? inSlot && inSlot.userData.game : null, gi = g ? list.indexOf(g) : -1;
    ghost.visible = gi >= 0 && beltHide.has(gi);
    if (!ghost.visible) return;
    const n = list.length; let o = gi - beltPos; o -= n * Math.round(o / n);
    if (Math.abs(o) > 7) { ghost.visible = false; return; }
    const p = beltPose(o); ghost.position.set(p.x, p.y, p.z); ghost.rotation.set(0, p.ry + Math.sin(t) * .1, 0); ghost.scale.setScalar(p.s);
    ghostMat.opacity = .55 + Math.sin(t * 3) * .3;
  }
  function setBeltList(newList, newKind, focusIdx) { list = newList; kind = newKind; beltPos = beltTarget = focusIdx; beltLast = Math.round(beltPos); for (const s of slots) s.gi = -1; }
  function focusBelt(i) { const n = list.length; if (!n) return; beltTarget = i + n * Math.round((beltPos - i) / n); flipTo = 0; }

  // ── animación ─────────────────────────────────
  const anims = new Set();
  const E = {io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }};
  function anim(dur, fn, ease = E.io) { return new Promise(res => { if (REDUCE) dur = Math.min(dur, .01); anims.add({dur, fn, ease, t: 0, res}); }); }
  const wait = s => new Promise(r => setTimeout(r, REDUCE ? 0 : s * 1000));
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  // vuela un objeto (en coordenadas de mundo) por un arco hasta donde diga target()
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
  const sparkGeo = new THREE.BufferGeometry(), SPN = 160, spPos = new Float32Array(SPN * 3), spCol = new Float32Array(SPN * 3), spVel = [], spLife = new Float32Array(SPN);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); sparkGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({size: .14, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  sparks.frustumCulled = false; scene.add(sparks);
  for (let i = 0; i < SPN; i++) spVel.push(V());
  let spI = 0;
  function burst(at, colors, n = 40, speed = 5, up = 3) {
    for (let k = 0; k < n; k++) {
      const i = spI++ % SPN, c = new THREE.Color(colors[k % colors.length]);
      spPos.set([at.x, at.y, at.z], i * 3); spCol.set([c.r, c.g, c.b], i * 3);
      spVel[i].set((Math.random() - .5) * speed, Math.random() * up + 1, (Math.random() - .2) * speed * .6); spLife[i] = .7 + Math.random() * .6;
    }
  }
  function updateSparks(dt) {
    for (let i = 0; i < SPN; i++) {
      if (spLife[i] <= 0) { spPos[i * 3 + 1] = -999; continue; }
      spLife[i] -= dt; spVel[i].y -= 9 * dt;
      spPos[i * 3] += spVel[i].x * dt; spPos[i * 3 + 1] += spVel[i].y * dt; spPos[i * 3 + 2] += spVel[i].z * dt;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  // ── pantalla de la consola ─────────────────────
  let scr = {mode: 'off', t0: 0, g: null};
  const setScr = (mode, g) => { scr = {mode, t0: performance.now(), g: g || scr.g}; };
  const thumbs = new Map();
  const thumbOf = g => { if (!g) return null; if (!thumbs.has(g.name)) { thumbs.set(g.name, null); loadImg(g.thumb).then(i => thumbs.set(g.name, i)); } return thumbs.get(g.name); };
  const pix = document.createElement('canvas'); pix.width = 160; pix.height = 100; const px = pix.getContext('2d');
  function pixText(text, size, color, y) { px.clearRect(0, 0, 160, 100); px.font = `700 ${size}px ${PX}`; px.textAlign = 'center'; px.textBaseline = 'middle'; px.fillStyle = color; px.fillText(text, 80, 50); sx.imageSmoothingEnabled = false; sx.drawImage(pix, 0, y - 150, 480, 300); sx.imageSmoothingEnabled = true; }
  function lcd(a = .06) { sx.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < SH; y += 3) sx.fillRect(0, y, SW, 1); for (let x = 0; x < SW; x += 3) sx.fillRect(x, 0, 1, SH); }
  function blinkBox(text, y, bg = 'rgba(28,26,34,.85)', fg = '#fff') { sx.font = `400 20px ${PX}`; const w = sx.measureText(text).width + 34; sx.fillStyle = bg; sx.fillRect(SW / 2 - w / 2, y - 20, w, 40); sx.fillStyle = fg; sx.textAlign = 'center'; sx.textBaseline = 'middle'; sx.fillText(text, SW / 2, y + 1); sx.textBaseline = 'alphabetic'; sx.textAlign = 'left'; }
  function drawScreen(now) {
    const t = (now - scr.t0) / 1000, g = scr.g;
    sx.globalAlpha = 1; sx.textAlign = 'left';
    if (scr.mode === 'off') {
      sx.fillStyle = '#10140f'; sx.fillRect(0, 0, SW, SH);
      const gr = sx.createLinearGradient(0, 0, SW, SH); gr.addColorStop(0, 'rgba(255,255,255,.06)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, SW, SH);
    } else if (scr.mode === 'power' || scr.mode === 'boot') {
      const on = scr.mode === 'power' ? Math.min(1, t / .45) : 1;
      sx.fillStyle = `rgb(${16 + 230 * on},${20 + 222 * on},${15 + 217 * on})`; sx.fillRect(0, 0, SW, SH);
      if (scr.mode === 'boot') {
        const y = Math.min(1, t / .9), yy = -60 + (SH / 2 - 10 + 60) * (1 - Math.pow(1 - y, 2));
        pixText('gavilanbe', 22, '#1c1a22', yy);
        if (t > .9) { const s = Math.min(1, (t - .9) / .35); sx.save(); sx.globalCompositeOperation = 'source-atop'; sx.fillStyle = 'rgba(255,91,53,.95)'; sx.fillRect(-120 + s * 720, 0, 70, SH); sx.restore(); }
        if (t > 1.15) { sx.globalAlpha = Math.min(1, (t - 1.15) / .3); sx.fillStyle = '#ff5b35'; sx.font = `400 16px ${PX}`; sx.textAlign = 'center'; sx.fillText('P O C K E T', SW / 2, SH / 2 + 44); const cols = ['#ff5b35', '#c6f432', '#6fd3ff', '#7a55cf']; for (let i = 0; i < 4; i++) { const b = Math.abs(Math.sin(t * 6 + i)) * 9; sx.fillStyle = cols[i]; sx.fillRect(SW / 2 - 42 + i * 24, SH / 2 + 64 - b, 12, 12); } sx.globalAlpha = 1; sx.textAlign = 'left'; }
      }
    } else if (scr.mode === 'title' || scr.mode === 'launch' || scr.mode === 'welcome') {
      const img = thumbOf(g), z = 1.05 + .035 * Math.sin(now / 2400);
      cover(sx, img, 0, 0, SW, SH, z, Math.sin(now / 3100) * 10);
      const gr = sx.createLinearGradient(0, SH * .45, 0, SH); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.72)'); sx.fillStyle = gr; sx.fillRect(0, 0, SW, SH);
      sx.fillStyle = 'rgba(0,0,0,.55)'; sx.fillRect(10, 10, 96, 22); sx.fillStyle = '#fff'; sx.font = `400 12px ${PX}`; sx.fillText(g ? g.code : '', 18, 26);
      if (scr.mode === 'launch') { const a = Math.max(0, 1 - t / .6); sx.fillStyle = `rgba(255,255,255,${a})`; sx.fillRect(0, 0, SW, SH); blinkBox('¡A JUGAR!', SH - 52, '#c6f432', '#1c1a22'); }
      else if (scr.mode === 'welcome') { sx.fillStyle = 'rgba(28,26,34,.6)'; sx.fillRect(0, 0, SW, SH); pixText('¡HAS VUELTO!', 17, '#c6f432', SH / 2 - 26); blinkBox('+1 PEGATINA', SH / 2 + 46, '#ffd23f', '#1c1a22'); }
      else if (Math.floor(now / 520) % 2 === 0) blinkBox('PRESS START', SH - 50);
    } else if (scr.mode === 'glitch') {
      sx.fillStyle = '#12161a'; sx.fillRect(0, 0, SW, SH);
      const img = thumbOf(g);
      for (let i = 0; i < 16; i++) { const y = Math.random() * SH, h = 4 + Math.random() * 30; if (img) sx.drawImage(img, 0, y / SH * img.height, img.width, h / SH * img.height, (Math.random() - .5) * 70, y, SW, h); }
      for (let i = 0; i < 40; i++) { sx.fillStyle = ['#ff5b35', '#c6f432', '#6fd3ff', '#fff'][i % 4]; sx.fillRect(Math.random() * SW, Math.random() * SH, 4 + Math.random() * 30, 3); }
      sx.fillStyle = 'rgba(18,22,26,.85)'; sx.fillRect(34, SH / 2 - 48, SW - 68, 96);
      sx.fillStyle = '#fff'; sx.textAlign = 'center'; sx.font = `700 22px ${PX}`; sx.fillText('ERROR DE LECTURA', SW / 2, SH / 2 - 6);
      sx.fillStyle = '#c6f432'; sx.font = `400 14px ${PX}`; sx.fillText('SOPLA EL CARTUCHO', SW / 2, SH / 2 + 26); sx.textAlign = 'left';
    }
    lcd(scr.mode === 'off' ? .03 : .06);
    screenTex.needsUpdate = true;
  }
  // monitor del ordenador
  let trm = {mode: 'idle', t0: performance.now(), g: null};
  function drawTerm(now) {
    const t = (now - trm.t0) / 1000;
    tx.fillStyle = '#07120b'; tx.fillRect(0, 0, TW, TH);
    tx.font = `500 19px ${MO}`; tx.fillStyle = '#7dff9a'; tx.textBaseline = 'alphabetic';
    const lines = [];
    if (trm.mode === 'idle') { lines.push('gavilanbe DOS 6.22', '', 'A:\\> dir', 'Inserta un disquete…', ''); }
    else {
      const g = trm.g, dir = g.repo.split('/').pop();
      const all = ['A:\\> leyendo disquete…', `${g.label.slice(0, 34)}`, '', 'Este juego va en tu terminal:', '', '$ git clone', `  ${g.repo.replace('https://', '')}`, `$ cd ${dir}`, '', 'Pulsa la pantalla para copiar'];
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
    if (kind === 'cart' && gi >= 0) {
      await fly(o, () => { const p = beltWorld(gi); const s = beltPose(0).s; return {pos: p, quat: belt.getWorldQuaternion(Q()), scale: s}; }, .7, {lift: 1.5});
    } else await fly(o, () => ({pos: o.position.clone().add(new THREE.Vector3(8, 4, 0)), quat: o.quaternion, scale: .3}), .5);
    scene.remove(o); beltHide.delete(gi);
  }
  async function insertCart(g, opt = {}) {
    const my = ++token;
    GB.tip(null);
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
    // sale de la cinta
    if (kind === 'cart' && gi >= 0) { beltWorld(gi, cart.position); cart.quaternion.copy(belt.getWorldQuaternion(Q())); cart.scale.setScalar(beltPose(0).s); }
    else { cart.position.set(con.position.x + 6, 9, 4); cart.rotation.set(.4, -1, .3); }
    inSlot = cart;
    GB.setState(opt.roulette ? 'Girando la ruleta…' : 'Metiendo el cartucho…', 'busy');
    Sound.whoosh();
    if (opt.roulette && !REDUCE) {
      await fly(cart, () => ({pos: rig.localToWorld(new THREE.Vector3(-.2, .9, 3.2)), quat: rig.getWorldQuaternion(Q()), scale: 1.25}), .55, {lift: 1});
      const pool = GB.lists.cart; let d = .05, i = 0;
      while (d < .3) { if (my !== token) return; cart.userData.label.material.map = frontTex(pool[Math.floor(Math.random() * pool.length)]); cart.rotateY(Math.PI); Sound.spin(i++); await wait(d); d *= 1.17; }
      cart.userData.label.material.map = frontTex(g); cart.quaternion.copy(rig.getWorldQuaternion(Q())); Sound.coin();
      burst(cart.position, ['#ffd23f', '#c6f432', '#fff'], 30, 4); await wait(.25);
    }
    if (my !== token) return;
    await fly(cart, slotTarget(2.5), opt.roulette ? .45 : .8, {lift: 2.2, spin: opt.roulette ? 0 : Math.PI * 2});
    if (my !== token) return;
    await anim(.18, (() => { const y0 = cart.position.y; return e => { const tg = slotTarget(0)(); cart.position.lerpVectors(new THREE.Vector3(tg.pos.x, y0, tg.pos.z), tg.pos, e); cart.quaternion.copy(tg.quat); }; })(), E.in);
    if (my !== token) return;
    rig.attach(cart); cart.position.set(0, SLOT_Y, SLOT_Z); cart.rotation.set(0, 0, 0); cart.scale.setScalar(1);
    Sound.insert(); joltV = -7; navigator.vibrate && navigator.vibrate(30);
    burst(rig.localToWorld(new THREE.Vector3(0, CH / 2, 0)), ['#ffffff', '#ffd23f', GB.EDITIONS[g.model] ? GB.EDITIONS[g.model].studio : '#fff'], 36, 6, 4);
    await prev; await wait(.2);
    if (my !== token) return;
    powerOn = 1; Sound.power(); ledOn = 1; setScr('power', g); await wait(.45);
    if (my !== token) return;
    if (!glitched && !opt.roulette && !REDUCE && Math.random() < .12) { glitched = true; setScr('glitch', g); Sound.error(); GB.setState('Error de lectura', 'glitch'); return; }
    boot(g, my);
  }
  async function boot(g, my) {
    setScr('boot', g); GB.setState('Arrancando…', 'busy');
    setTimeout(() => { if (my === token && scr.mode === 'boot') Sound.boot(); }, REDUCE ? 0 : 900);
    await wait(2.3);
    if (my !== token || scr.mode !== 'boot') return;
    setScr('title', g); GB.setState('Pulsa START', 'on');
  }
  async function blow() {
    if (scr.mode !== 'glitch' || !inSlot) return;
    const my = ++token, cart = inSlot, g = cart.userData.game;
    GB.setState('Soplando…', 'busy'); ledOn = 0; setScr('off');
    scene.attach(cart);
    const camDir = camera.position.clone();
    await fly(cart, () => ({pos: rig.localToWorld(new THREE.Vector3(0, 2.2, 3.4)), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.15, 0, 0)).premultiply(rig.getWorldQuaternion(Q())), scale: 1.2}), .5, {lift: 1});
    Sound.blow();
    const bottom = cart.localToWorld(new THREE.Vector3(0, -1.4, 0));
    for (let k = 0; k < 3; k++) setTimeout(() => burst(bottom, ['#c9b48a', '#a8966f', '#e2d4b2'], 26, 4, 2.5), k * 120);
    for (const z of [.35, -.35, .2, 0]) await anim(.1, (() => { const q0 = cart.quaternion.clone(), q1 = q0.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, z * .5))); return e => cart.quaternion.slerpQuaternions(q0, q1, e); })());
    void camDir;
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
    scene.remove(o); beltHide.delete(gi);
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
    trm = {mode: 'load', t0: performance.now() + 600, g};
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
    diving = false; clearTimeout(diveTimer); GB.undive && GB.undive();
    if (inSlot) { setScr('welcome', inSlot.userData.game); GB.setState('¡Has vuelto!', 'on'); setTimeout(() => { if (scr.mode === 'welcome') { setScr('title'); GB.setState('Pulsa START', 'on'); } }, 2600); }
  }
  function press(k) {
    const g = btn[k];
    if (!g) return;
    if (g === dpad) { const r = {left: [0, -.3], right: [0, .3], up: [-.3, 0], down: [.3, 0]}[k]; dpad.rotation.set(r[0], r[1], 0); anim(.25, e => dpad.rotation.set(r[0] * (1 - e), r[1] * (1 - e), 0), E.out); }
    else { const z0 = g.userData.z0 ?? (g.userData.z0 = g.position.z); g.position.z = z0 - .07; anim(.2, e => { g.position.z = z0 - .07 * (1 - e); }, E.out); }
    Sound.press();
  }
  // carcasa
  const shellTo = new THREE.Color('#ebe4d6');
  let spin = 0, spinV = 0;
  function setShell(hex, gold) {
    if (gold) { shellTo.set('#d9a93f'); shellMat.metalness = .9; shellMat.roughness = .24; }
    else { shellTo.set(hex); shellMat.metalness = 0; shellMat.roughness = .36; }
    const l = shellTo.r * .3 + shellTo.g * .59 + shellTo.b * .11;
    printColor = l < .35 ? '#ece6da' : '#2a2640'; fonts.then(drawPrint);
    if (!REDUCE && started) spinV += gold ? 16 : 9;
  }

  // ── plató: disposición y cámara ────────────────
  let W = 1, H = 1, L = {}, mode = 'cart';
  const ST = {cart: 0, disk: -30};
  const cam = {pos: new THREE.Vector3(0, 2, 30), look: new THREE.Vector3(0, 0, 0)}, camWant = {pos: V(), look: V()};
  function layout() {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
    renderer.setSize(W, H, false); if (composer) { composer.setSize(W, H); }
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const narrow = W < 760 || W / H < .9;
    const floorY = narrow ? -2.6 : -4.4;
    L = narrow
      ? {narrow, floorY, conPos: [0, 3.3, -1.6], conScale: 1, pcPos: [0, floorY, -2.4], beltX: 0, beltZ: 4.2, beltY: floorY + .36 + 1.4, beltItem: .82,
         box: {cart: [-2.3, 2.3, floorY + .2, 7.2], disk: [-3.4, 3.4, floorY, floorY + 10.4]}, safe: [-.94, .94, -.3, .8]}
      : {narrow, floorY, conPos: [3.9, 1.0, 0], conScale: 1, pcPos: [4.2, floorY, -1.6], beltX: .4, beltZ: 3, beltY: floorY + .36 + 1.1, beltItem: .78,
         box: {cart: [-2.2, 6.2, floorY + .1, 5.1], disk: [-2.2, 7.8, floorY + .1, floorY + 10.6]}, safe: [-.18, .86, -.72, .8]};
    floor.position.y = floorY; plinth.position.set(0, floorY + .18, 0); spot.position.set(0, floorY + .37, .3);
    con.position.set(ST.cart + L.conPos[0], L.conPos[1], L.conPos[2]); con.scale.setScalar(L.conScale);
    pc.position.set(ST.disk + L.pcPos[0], L.pcPos[1] + 2.4, L.pcPos[2]); pc.scale.setScalar(narrow ? .78 : 1);
    belt.position.z = L.beltZ;
    if (bloom) bloom.resolution.set(W / 2, H / 2);
  }
  function camPose(which, out) {
    const [bx0, bx1, by0, by1] = L.box[which], [sx0, sx1, sy0, sy1] = L.safe, tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const hH = Math.max((by1 - by0) / (sy1 - sy0), (bx1 - bx0) / (sx1 - sx0) / camera.aspect), hW = hH * camera.aspect;
    const D = hH / tan, cx = ST[which] + (bx0 + bx1) / 2 - ((sx0 + sx1) / 2) * hW, cy = (by0 + by1) / 2 - ((sy0 + sy1) / 2) * hH;
    out.look.set(cx, cy, 0); out.pos.set(cx + mouse.x * 1.1, cy + D * .075 - mouse.y * .6, D);
  }
  function divePose(out) {
    const c = screen.getWorldPosition(V()), n = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.getWorldQuaternion(Q()));
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max(.72, 1.14 / camera.aspect) / tan;
    out.look.copy(c); out.pos.copy(c).addScaledVector(n, d);
  }
  function setMode(m, newList, focusIdx, instant) {
    const changed = m !== mode || !list.length;
    mode = m;
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
    for (const s of slots) if (s.mesh && s.mesh.visible) objs.push(s.mesh.userData.body || s.mesh.children[0], s.mesh.userData.label || s.mesh.children[0]);
    const hit = ray.intersectObjects(objs, false)[0];
    return hit ? hit.object : null;
  }
  const TIPS = {a: 'A · Meter / Jugar', b: 'B · Sorpresa', start: 'START · Jugar', select: 'SELECT · Color', left: '◀ Anterior', right: 'Siguiente ▶', up: '◀ Anterior', down: 'Siguiente ▶', keys: 'Teclear', term: 'Copiar el comando'};
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width - .5; mouse.y = (e.clientY - r.top) / r.height - .5;
    if (drag) {
      const dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx);
      if (drag.mode === 'belt' && drag.moved > 4) { const upx = (2 * Math.tan(THREE.MathUtils.degToRad(15)) * (camera.position.z - L.beltZ) * camera.aspect) / W; const d = -dx * upx / 2.75; beltPos += d; beltVel = d / .016; }
      else if (drag.mode === 'spin') spin += dx * .012;
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const o = pickAt(e.clientX, e.clientY), item = o && o.userData.item;
    hoverItem = item || null;
    el.style.cursor = o ? (o.userData.action === 'spin' ? 'grab' : 'pointer') : 'grab';
    const tx = e.clientX - r.left, ty = e.clientY - r.top;
    if (item) { const g = item.userData.game, foc = item.userData.gi === GB.st.focus; GB.tip(foc ? (kind === 'cart' ? `Meter «${g.label}»` : `Meter «${g.label}» en el PC`) : g.label, tx, ty); }
    else if (o === screen) GB.tip({title: 'START · Jugar', boot: 'Saltar intro', glitch: 'Soplar el cartucho', off: 'Meter el cartucho', power: ''}[scr.mode] || '', tx, ty);
    else if (o && TIPS[o.userData.action]) GB.tip(TIPS[o.userData.action], tx, ty);
    else if (o === body) GB.tip('Arrastra para girarla', tx, ty);
    else GB.tip(null);
  });
  el.addEventListener('pointerleave', () => { hoverItem = null; GB.tip(null); mouse.x = mouse.y = 0; });
  el.addEventListener('pointerdown', e => {
    const o = pickAt(e.clientX, e.clientY);
    drag = {x: e.clientX, x0: e.clientX, moved: 0, o, mode: o === body ? 'spin' : 'belt', t: performance.now()};
    try { el.setPointerCapture(e.pointerId); } catch {}
  });
  function up(e) {
    if (!drag) return;
    const d = drag; drag = null;
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

  // ── bucle ─────────────────────────────────────
  let visible = true, last = performance.now(), started = false, frames = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  new ResizeObserver(() => { layout(); }).observe(host);
  layout();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if ((!visible || document.hidden) && frames > 3) return;
    const t = now / 1000;
    for (const a of [...anims]) { a.t += dt; const p = a.dur ? Math.min(1, a.t / a.dur) : 1; a.fn(a.ease(p)); if (p >= 1) { anims.delete(a); a.res(); } }
    // plató
    studio.lerp(studioTo.set(getComputedStyle(document.documentElement).getPropertyValue('--studio').trim() || '#cfc9bf'), 1 - Math.exp(-dt * 4));
    scene.background.copy(studio); scene.fog.color.copy(studio); floorMat.color.copy(studio).multiplyScalar(.97);
    plinthMat.color.copy(studio).lerp(new THREE.Color('#ffffff'), .72);
    hemi.groundColor.copy(studio);
    // consola viva
    if (!drag || drag.mode !== 'spin') { spinV *= Math.exp(-dt * 2.2); spin += spinV * dt; const tgt = Math.round(spin / (Math.PI * 2)) * Math.PI * 2; if (Math.abs(spinV) < 2) spin += (tgt - spin) * (1 - Math.exp(-dt * 4)); }
    joltV += (-jolt * 260 - joltV * 14) * dt; jolt += joltV * dt * .05;
    const bob = REDUCE ? 0 : Math.sin(t * 1.1) * .1;
    rig.position.y = bob + jolt * 2;
    rig.scale.set(1 - jolt * 1.2, 1 + jolt * 2, 1 - jolt * 1.2);
    rig.rotation.x += ((REDUCE ? 0 : mouse.y * .22) - .03 - rig.rotation.x) * .08;
    rig.rotation.y += (((REDUCE || L.narrow ? 0 : mouse.x * .45) - (L.narrow ? 0 : .28)) + spin - rig.rotation.y) * (drag && drag.mode === 'spin' ? .5 : .1);
    rig.rotation.z = Math.sin(t * .7) * .02;
    shellMat.color.lerp(shellTo, 1 - Math.exp(-dt * 6));
    power.position.x += ((powerOn ? -.92 : -1.2) - power.position.x) * .2;
    led.material.emissiveIntensity += ((ledOn ? 3 + Math.sin(t * 3) * .4 : 0) - led.material.emissiveIntensity) * .15;
    driveBlink = Math.max(0, driveBlink - dt); driveLed.material.emissiveIntensity = driveBlink > 0 ? (Math.sin(t * 40) > 0 ? 3 : .3) : (inDrive ? 1.2 : 0);
    updateBelt(dt, t); placeGhost(t); updateSparks(dt);
    // cámara
    if (diving) divePose(camWant); else camPose(mode, camWant);
    const k = 1 - Math.exp(-dt * (diving ? 5 : 2.6));
    cam.pos.lerp(camWant.pos, frames < 2 ? 1 : k); cam.look.lerp(camWant.look, frames < 2 ? 1 : k);
    camera.position.copy(cam.pos); camera.lookAt(cam.look);
    key.position.set(cam.look.x + 9, 18, 14); key.target.position.set(cam.look.x, 0, 0);
    drawScreen(now); if (mode === 'disk' || inDrive) drawTerm(now);
    if (composer) composer.render(); else renderer.render(scene, camera);
    if (++frames === 3) onFirstFrames();
  });
  function screenRect() {
    const pts = [[-1.12, -.7], [1.12, .7]].map(([a, b]) => screen.localToWorld(new THREE.Vector3(a, b, 0)).project(camera));
    const r = el.getBoundingClientRect();
    const xs = pts.map(p => r.left + (p.x + 1) / 2 * r.width), ys = pts.map(p => r.top + (1 - p.y) / 2 * r.height);
    return {left: Math.min(...xs), top: Math.min(...ys), width: Math.abs(xs[1] - xs[0]), height: Math.abs(ys[1] - ys[0])};
  }
  function onFirstFrames() { started = true; Promise.race([fonts, wait(1.5)]).then(() => GB.hideLoader(screenRect())); }

  GB.ready({
    mode: (m, l, f, instant) => setMode(m, l, f, instant),
    focus: i => { focusBelt(i); },
    insert: (g, opt = {}) => g.type === 'web' ? insertCart(g, opt) : insertDisk(g, opt),
    dive, back, blow, press,
    get screenMode() { return scr.mode; },
    flip: v => { flipTo = v ? 1 : 0; },
    shell: (hex, gold) => setShell(hex, gold),
  });
}
