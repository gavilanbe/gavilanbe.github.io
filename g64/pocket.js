// La escena de bolsillo (teléfonos): la gavilanbe POCKET sobre el edredón de la misma habitación y, en vez de
// la pared, el estuche de la colección, una tira larga con dos cartuchos por fila que se arrastra con el dedo.
// Misma interfaz que scene.js: go, insert, dim, station, start, key, launch.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {V, M4, C, Kit, tex, ext, decal, glow, blob, fontsReady, FONT, MONO} from './kit.js';
import {makeHandheld, setShell, HH, BIG, SEAT, LCD} from './handheld.js';
import {makeCart, CART} from './cart.js';
import {makeFX} from './fx.js';
import {EDITIONS, edition, SHELLS} from '../editions.js';

const CS = 1.25, COLX = .19, PITCH = .3, HEAD = .2, SW = .8;           // el estuche: escala de cartucho, columnas, filas
const FOV = 30, TILT = .2, HOVER = .14;
const rr = (w, h, r, n = 5) => { const p = [], a = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const t = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } }; a(w / 2 - r, h / 2 - r, 0); a(-w / 2 + r, h / 2 - r, Math.PI / 2); a(-w / 2 + r, -h / 2 + r, Math.PI); a(w / 2 - r, -h / 2 + r, Math.PI * 1.5); return p; };
const FLAT = -Math.PI / 2;

export async function createPocket({canvas, games, first, Sound, onStation, onPick, onPlay, onStep, onJump, onSection, store}) {
  await fontsReady();
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, powerPreference: 'high-performance'});
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#150f38');
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .3; scene.environmentRotation.set(1.15, .6, 0); pm.dispose();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .2, 60);

  // ── luz: el mismo atardecer de la habitación, entrando por la izquierda ──
  scene.add(new THREE.HemisphereLight('#e4e2ff', '#7d7888', .72));
  const sun = new THREE.DirectionalLight('#fff1e0', 2.3), SUN = V(-3.2, 3.4, -1.3); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left: -1.5, right: 1.5, top: 1.9, bottom: -1.9, near: .5, far: 12}); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0004; sun.shadow.normalBias = .012; sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight('#a9a6ff', 1.15); fill.position.set(3, 6, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight('#9fc0ff', 1.1); rim.position.set(3.5, 2.2, -2.5); scene.add(rim);
  const scrL = new THREE.PointLight('#8fd0ff', 0, 1.6, 1.6); scene.add(scrL);

  // ── el edredón (el de la cama de la habitación) ──
  {
    const duvet = tex(256, 256, (x, w, h) => {
      x.fillStyle = '#3b2a78'; x.fillRect(0, 0, w, h);
      const tri = (a, b, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(a, b - 18); x.lineTo(a + 18, b + 14); x.lineTo(a - 18, b + 14); x.fill(); };
      x.globalAlpha = .82; tri(40, 48, '#ffd23f'); tri(176, 184, '#ffd23f'); tri(196, 44, '#ff5b8d');
      x.lineWidth = 10; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#35d0c0'; x.beginPath(); x.moveTo(92, 60); x.quadraticCurveTo(110, 32, 128, 60); x.quadraticCurveTo(146, 88, 164, 60); x.stroke();
      x.strokeStyle = '#ff5b8d'; x.beginPath(); x.moveTo(20, 168); x.lineTo(40, 144); x.lineTo(60, 168); x.lineTo(80, 144); x.stroke();
      x.strokeStyle = '#ffd23f'; x.beginPath(); x.moveTo(112, 212); x.lineTo(152, 200); x.stroke();
      x.fillStyle = '#ff5b35'; x.beginPath(); x.arc(132, 132, 14, 0, 7); x.fill(); x.fillStyle = '#35d0c0'; x.beginPath(); x.arc(224, 120, 10, 0, 7); x.fill(); x.globalAlpha = 1;
      // trama de la tela
      for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '255,235,255' : '14,6,40'},.05)`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 1); }
    }, {repeat: [22, 22]});
    const g = new THREE.PlaneGeometry(9, 9, 40, 40), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setZ(i, Math.sin(u * 2.3 + v * 1.1) * .012 + Math.sin(v * 3.1 - u * .7) * .01); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({map: duvet, roughness: 1, color: '#a79fcc'})); m.rotation.x = FLAT; m.position.y = -.02; m.receiveShadow = true; scene.add(m);
    // la luz de la ventana, cruzada por la sombra de la cruceta
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .16, map: tex(256, 256, (x, w, h) => {
      x.filter = 'blur(7px)'; x.fillStyle = '#ff9a55'; x.transform(1, .28, -.5, 1, 86, -22);
      for (const [a, b] of [[40, 34], [128, 34], [40, 122], [128, 122]]) x.fillRect(a, b, 76, 76);
    })}));
    win.rotation.x = FLAT; win.position.set(-.25, .012, -.25); win.renderOrder = 1; scene.add(win);
  }

  const vig = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, map: tex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 22, 64, 64, 66); g.addColorStop(0, 'rgba(12,7,36,0)'); g.addColorStop(.6, 'rgba(12,7,36,.42)'); g.addColorStop(1, 'rgba(12,7,36,.86)'); x.fillStyle = g; x.fillRect(0, 0, w, h); })}));
  vig.rotation.x = FLAT; vig.position.y = .002; vig.renderOrder = 2; scene.add(vig);

  // ── la consola ──
  const con = makeHandheld(), CP = con.userData.parts; scene.add(con);
  con.traverse(o => { if (o.isMesh && o.material.visible !== false && !o.material.transparent) o.castShadow = o.receiveShadow = true; });
  const shells = SHELLS, shellAt = Math.max(0, shells.findIndex(s => s.id === store.get('shell', 'crema')));
  let shell = shellAt; setShell(con, shells[shell]);
  const conShadow = blob(1.5, 2.1, .75); conShadow.position.set(.05, .004, .06); scene.add(conShadow);
  const fx = makeFX(scene, {size: .075});
  const L = (x, y, z) => con.localToWorld(V(x, y, z));          // de la consola al mundo
  const seatP = () => L(SEAT.x, SEAT.y, SEAT.z), conQ = () => con.getWorldQuaternion(new THREE.Quaternion());

  // ── el estuche ──
  const caseG = new THREE.Group(); scene.add(caseG);
  const carts = [], pickables = [], sections = [], byGame = new Map();
  let LEN = 0;
  {
    const k = new Kit(), edIds = Object.keys(EDITIONS).filter(id => games.some(g => g.model === id));
    let z = .06;
    for (const id of edIds) {
      const list = games.filter(g => g.model === id), ed = edition(id), rows = Math.ceil(list.length / 2);
      sections.push({id, z: z - .04, z1: z + HEAD + rows * PITCH});
      // placa del modelo, como las de la pared
      const plate = decal(SW - .08, .13, 760, (x, cw, ch) => {
        x.fillStyle = ed.plastic; x.beginPath(); x.roundRect(0, 0, cw, ch, 16); x.fill(); x.fillStyle = 'rgba(0,0,0,.16)'; x.beginPath(); x.roundRect(0, ch - 14, cw, 14, [0, 0, 16, 16]); x.fill();
        const ink = ed.dark ? '#fff' : '#17122a'; x.fillStyle = ink; x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = `${ch * .5}px ${FONT}`; x.fillText(ed.model.toUpperCase(), 26, ch * .47);
        x.textAlign = 'right'; x.font = `700 ${ch * .19}px ${MONO}`; x.fillText(ed.name.toUpperCase(), cw - 26, ch * .34); x.globalAlpha = .75; x.fillText(`${list.length} ${list.length === 1 ? 'CARTUCHO' : 'CARTUCHOS'}`, cw - 26, ch * .62);
      }, {lit: true, rough: .7});
      plate.rotation.x = FLAT; plate.position.set(0, .034, z + .085); caseG.add(plate);
      k.add(ext(rr(SW - .06, .15, .028), .008, .002), '#0c2a30', M4(0, .027, z + .085, 0, FLAT), 'matte', 1, 1);
      z += HEAD;
      list.forEach((g, i) => {
        const x = (i % 2 ? 1 : -1) * COLX, cz = z + Math.floor(i / 2) * PITCH + .135;
        // bandeja rehundida y su cinta con el nombre
        k.add(ext(rr(.34, .27, .03), .01, .003, {segs: 1}), '#2a7a84', M4(x, .028, cz + .006, 0, FLAT), 'matte', 1, 1);
        k.add(ext(rr(.316, .246, .02), .006, 0), '#123c44', M4(x, .033, cz + .006, 0, FLAT), 'matte', 1, 1);
        const tag = decal(.33, .058, 860, (c, cw, ch) => {
          c.fillStyle = '#fff3dc'; c.beginPath(); c.roundRect(0, 0, cw, ch, 9); c.fill(); c.fillStyle = 'rgba(60,30,10,.16)'; c.beginPath(); c.roundRect(0, ch - 6, cw, 6, [0, 0, 9, 9]); c.fill();
          c.fillStyle = ed.plastic; c.beginPath(); c.roundRect(10, ch / 2 - 12, 21, 21, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = '#17122a'; c.stroke();
          c.fillStyle = '#17122a'; c.textBaseline = 'middle'; c.textAlign = 'left'; let fs = 27; c.font = `${fs}px ${FONT}`; const max = cw - 54, w0 = c.measureText(g.label).width; if (w0 > max) { fs = Math.max(19, fs * max / w0); c.font = `${fs}px ${FONT}`; }
          let t = g.label; while (t.length > 2 && c.measureText(t).width > max) t = t.slice(0, -2).trimEnd() + '…'; c.fillText(t, 42, ch / 2 - 1);
        }, {lit: true, rough: .8});
        tag.rotation.x = FLAT; tag.position.set(x, .0995, cz + .123); tag.castShadow = true; caseG.add(tag);
        k.box(.33, .062, .058, '#fff3dc', x, .068, cz + .123, 'matte', .6, 1);
        const c = makeCart(g); c.rotation.x = FLAT; c.scale.setScalar(CS); c.position.set(x, .037 + CART.D * CS / 2, cz - .012);
        c.userData.home = {pos: c.position.clone(), q: c.quaternion.clone()}; c.userData.pick.forEach(m => { m.userData.cart = c; });
        caseG.add(c); carts.push(c); pickables.push(...c.userData.pick); byGame.set(g, c);
      });
      z += rows * PITCH + .05;
    }
    LEN = z + .1;
    // la tira: base con ribete y cremallera a los lados
    k.add(ext(rr(SW + .1, LEN + .16, .07, 8), .03, .008, {segs: 2}), '#174a54', M4(0, .012, LEN / 2 - .02, 0, FLAT), 'fabric', 1, 1);
    for (const s of [-1, 1]) { k.box(.018, .016, LEN + .02, '#ff5b35', s * (SW / 2 + .028), .034, LEN / 2 - .02, 'fabric', 1, 1); k.box(.012, .01, LEN, '#ffd23f', s * (SW / 2 + .008), .03, LEN / 2 - .02, 'gold', 1, 1); }
    const body = k.build(); body.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); caseG.add(body);
  }
  const homeW = c => caseG.localToWorld(c.userData.home.pos.clone()), homeQ = c => c.userData.home.q;

  // ── la pantalla ──
  let selected = null, cover = null, tvMode = 'boot', tvT0 = performance.now(), intro = true;
  const sx = CP.canvas.getContext('2d'), SWp = LCD.px[0], SHp = LCD.px[1], ART = 292;
  let noise = null;
  function drawScreen(now) {
    const x = sx, w = SWp, h = SHp, t = Math.max(0, (now - tvT0) / 1000);
    if (tvMode === 'collapse' || tvMode === 'off' || tvMode === 'on') {
      x.fillStyle = '#05050a'; x.fillRect(0, 0, w, h);
      if (tvMode === 'collapse') { const u = Math.min(1, t / .14), hh = Math.max(3, h * (1 - u) * (1 - u)); x.fillStyle = '#fff'; x.fillRect(0, (h - hh) / 2, w, hh); if (u >= 1) { tvMode = 'off'; tvT0 = now; } }
      else if (tvMode === 'off') { const a = Math.max(0, .8 - t * 2.4); if (a > 0) { x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(w * .2, h / 2 - 2, w * .6, 3); } }
      else if (t < .14) { const u = t / .14, hh = Math.max(3, h * u * u); x.fillStyle = '#fff'; x.fillRect(0, (h - hh) / 2, w, hh); }
      else if (t < .42) { if (!noise) { noise = document.createElement('canvas'); noise.width = 96; noise.height = 72; } const nx = noise.getContext('2d'), d = nx.createImageData(96, 72), a = d.data; for (let i = 0; i < a.length; i += 4) { const v = Math.random() * 255; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255; } nx.putImageData(d, 0, 0); x.imageSmoothingEnabled = false; x.drawImage(noise, 0, 0, w, h); x.imageSmoothingEnabled = true; x.fillStyle = `rgba(255,255,255,${.5 * (1 - (t - .14) / .28)})`; x.fillRect(0, 0, w, h); }
      else { tvMode = 'boot'; tvT0 = now; }
      CP.tex.needsUpdate = true; return;
    }
    if (selected && cover && tvMode === 'game' && t > .5) {
      const g = selected, s = Math.max(w / cover.width, ART / cover.height), sw = w / s, sh = ART / s; x.imageSmoothingQuality = 'high';
      x.drawImage(cover, (cover.width - sw) / 2, (cover.height - sh) / 2, sw, sh, 0, 0, w, ART);
      x.fillStyle = '#17122a'; x.fillRect(0, ART, w, h - ART); x.fillStyle = g.ed.plastic; x.fillRect(0, ART - 4, w, 7);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#ffe95c'; x.font = `30px ${FONT}`; x.fillText(g.label.toUpperCase(), 18, ART + 36, w - 196);
      const on = Math.floor(t * 2.2) % 2; x.fillStyle = on ? '#c6f432' : '#8fb81c'; x.beginPath(); x.roundRect(w - 164, ART + 16, 148, 38, 19); x.fill();
      x.fillStyle = '#ff5b35'; x.beginPath(); x.arc(w - 144, ART + 35, 13, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = `17px ${FONT}`; x.textAlign = 'center'; x.fillText('A', w - 144, ART + 36);
      x.fillStyle = '#17122a'; x.font = `18px ${FONT}`; x.fillText(g.web ? 'JUGAR' : 'COPIAR', w - 78, ART + 36);
      // número de serie y avisos sobre la carátula
      const no = `${String(games.indexOf(g) + 1).padStart(3, '0')}/${String(games.length).padStart(3, '0')}`; x.font = `700 15px ${MONO}`; x.textAlign = 'left'; const nw = x.measureText(no).width + 20;
      x.fillStyle = 'rgba(12,8,34,.78)'; x.beginPath(); x.roundRect(12, 12, nw, 26, 13); x.fill(); x.fillStyle = '#fff'; x.fillText(no, 22, 26);
      if (g.new) { x.fillStyle = '#c6f432'; x.beginPath(); x.roundRect(w - 96, 12, 84, 26, 13); x.fill(); x.fillStyle = '#17122a'; x.font = `15px ${FONT}`; x.textAlign = 'center'; x.fillText('¡NUEVO!', w - 54, 26); }
      if (t < .9) { x.fillStyle = `rgba(255,255,255,${1 - (t - .5) / .4})`; x.fillRect(0, 0, w, h); }
    } else {
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2c44c8'); gr.addColorStop(1, '#0c0b2a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${.25 + (i % 3) * .2})`; x.fillRect((i * 97 + t * (14 + i % 5 * 8)) % w, (i * 53) % h, 3, 3); }
      const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'], grow = Math.min(1, t / .5), e = 1 - Math.pow(1 - grow, 3); x.lineWidth = 28 * e; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); const a = t * 1.3 - .35 + i * 1.42 + (1 - e) * 4; x.arc(w / 2, 128, 56 * e, a, a + 1.44); x.stroke(); });
      if (t > .35) { x.globalAlpha = Math.min(1, (t - .35) / .3); x.textBaseline = 'middle'; x.font = `50px ${FONT}`; x.lineWidth = 11; x.lineJoin = 'round'; x.strokeStyle = '#0a0820'; const full = 'gavilanbe POCKET'; x.font = `44px ${FONT}`; const w1 = x.measureText(full).width, wg = x.measureText('gavilanbe ').width, x0 = (w - w1) / 2; x.textAlign = 'left'; x.strokeText(full, x0, 252); x.fillStyle = '#ffe95c'; x.fillText('gavilanbe', x0, 252); x.fillStyle = '#ff5b35'; x.fillText('POCKET', x0 + wg, 252); x.globalAlpha = 1; }
      if (!intro && t > .8 && Math.floor(t * 2) % 2) { x.textAlign = 'center'; x.font = `18px ${FONT}`; x.fillStyle = '#fff'; x.fillText(selected ? 'LEYENDO EL CARTUCHO…' : 'ELIGE UN CARTUCHO', w / 2, 312); }
      if (!intro && selected && cover && tvMode === 'boot' && t > 1.5) { tvMode = 'game'; tvT0 = now - 500; }
    }
    // trama del LCD
    x.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);
    CP.tex.needsUpdate = true;
  }

  // ── acabado de imagen ──
  let dpr = 1, cap = 2, composer = null, VW = 1, VH = 1;
  function setup() {
    VW = innerWidth; VH = innerHeight; dpr = Math.min(devicePixelRatio || 1, cap);
    renderer.setPixelRatio(dpr); renderer.setSize(VW, VH, false); camera.aspect = VW / VH; camera.updateProjectionMatrix();
    const rt = new THREE.WebGLRenderTarget(VW * dpr, VH * dpr, {type: THREE.HalfFloatType, samples: 4});
    composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(VW, VH);
    composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(VW, VH), .16, .5, .97)); composer.addPass(new OutputPass());
    layout();
  }

  // ── encuadres: se calculan con los huecos que deja la interfaz ──
  const TOP = HH.H / 2 + .105;                                  // de la consola al borde del cartucho que asoma
  const FR = {tv: {cz: 0, e: 1}, wall: {cz: 0, e: 1}, intro: {cz: -LCD.y, e: .47}};
  let Z0 = 0, maxScroll = 0, ppuW = 400, hideZ = .2, catchZ = -.1;
  const tanF = Math.tan(FOV * Math.PI / 360);
  function layout() {
    const card = document.getElementById('card'), keys = document.getElementById('keys'), land = VW > VH;
    const cardH = card && card.offsetHeight ? VH - card.getBoundingClientRect().top : VH * .3, keysH = keys && keys.offsetHeight ? VH - keys.getBoundingClientRect().top : 70;
    // consola: entre la cabecera y la ficha
    const t = land ? 12 : 66, b = land ? 12 : Math.max(cardH, keysH) + 6, avail = Math.max(120, VH - t - b), full = HH.H + .105 + .04;
    const ppu = Math.min(avail / full, VW * (land ? .5 : .9) / HH.W);
    FR.tv.e = VW / ppu; FR.tv.cz = -.0525 + (VH / 2 - (t + avail / 2)) / ppu; FR.tv.cx = land ? (VW * .23) / ppu : 0;
    // estuche: a lo ancho, con la consola asomando abajo
    ppuW = Math.min(VW / (SW + .14), land ? VH / 1.3 : 1e9); const peek = keysH + (land ? 70 : Math.min(150, VH * .19));
    FR.wall.e = VW / ppuW; FR.wall.cz = -TOP - (VH / 2 - peek) / ppuW; FR.wall.cx = 0;
    Z0 = FR.wall.cz + ((land ? 60 : 116) - VH / 2) / ppuW;
    hideZ = (peek - keysH - 56) / ppuW; catchZ = -Math.min(70, VH * .09) / ppuW;
    maxScroll = Math.max(0, LEN - (FR.wall.cz + (VH / 2 - keysH - 96) / ppuW - Z0));
    FR.intro.e = Math.max(.47, .37 * VW / VH);
  }
  setup();
  let rsT = 0; addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(setup, 120); });

  // ── estado ──
  let cur = 'tv', scroll = 0, vel = 0, away = 1, zoom = 0, zoomRes = null, shake = 0, hitstop = 0, power = 0, powerTo = 0, bump = 0, trail = null, section = null;
  const cam = {cz: FR.intro.cz, cx: 0, e: FR.intro.e}, ptr = {x: 0, y: 0}, glowCol = C('#ff5b35');
  class Spring { constructor(k = 220, d = 13) { this.v = 0; this.vel = 0; this.to = 0; this.k = k; this.d = d; } step(dt) { this.vel += ((this.to - this.v) * this.k - this.vel * this.d) * dt; this.v += this.vel * dt; return this.v; } }
  const sq = new Spring(300, 12), kick = new Spring(210, 11), lift = new Spring(120, 16), rise = new Spring(150, 17), tiltX = new Spring(90, 12), tiltY = new Spring(90, 12);
  function go(name) { if (name === 'hero') name = 'tv'; if (name !== 'tv' && name !== 'wall') return; if (cur !== name) { cur = name; vel = 0; } onStation(name); }
  const setPower = (on, g) => { powerTo = on ? 1 : 0; if (g) glowCol.set(g.ed.plastic).lerp(C('#ffffff'), .15); };

  // ── cartuchos: vuelos en el mundo con destino vivo (la consola y el estuche se mueven) ──
  const flights = [], cues = []; let seq = 0;
  const at = (delay, fn) => cues.push({t: delay, fn, seq});
  const val = v => typeof v === 'function' ? v() : v;
  function fly(obj, to, dur, done) { for (let i = flights.length - 1; i >= 0; i--) if (flights[i].obj === obj) flights.splice(i, 1); if (obj.parent !== scene) scene.attach(obj); flights.push({obj, from: {p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.x}, to, t: 0, dur, done}); }
  function dock(c) { for (let i = flights.length - 1; i >= 0; i--) if (flights[i].obj === c) flights.splice(i, 1); caseG.add(c); c.position.copy(c.userData.home.pos); c.quaternion.copy(c.userData.home.q); c.scale.setScalar(CS); }
  function seat(c) { for (let i = flights.length - 1; i >= 0; i--) if (flights[i].obj === c) flights.splice(i, 1); con.add(c); c.position.copy(SEAT); c.quaternion.identity(); c.scale.setScalar(BIG); }
  function impact(g, big = true) {
    const col = g.ed.plastic, p = L(0, HH.H / 2 - .12, .1), k = big ? 1 : .45;
    hitstop = big ? .07 : .03; shake = k; sq.vel = -8 * k; kick.vel = 3.4 * k; bump = k;
    fx.spawn(p, col, {n: big ? 90 : 26, speed: 1.5 * (big ? 1 : .7), up: .9, spread: 1.5, life: .7, gravity: 3, drag: 1.6, jitter: .16});
    fx.spawn(p, '#ffffff', {n: big ? 22 : 8, speed: 1.9, up: .4, spread: 1.57, life: .28, gravity: 1, drag: 3, white: 1, jitter: .16});
    if (big) { fx.ring(con.position, col, {from: .5, to: 2.6, dur: .7, y: .02}); fx.ring(con.position, '#ffffff', {from: .3, to: 1.6, dur: .4, delay: .05, y: .02}); }
    Sound.chunk ? Sound.chunk() : Sound.clack(); buzz(big ? [18, 30, 12] : 10);
  }
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  function insert(g, animate = true) {
    const cart = byGame.get(g); if (!cart) return;
    const mySeq = ++seq, prev = selected && selected !== g ? byGame.get(selected) : null;
    cues.length = 0; trail = null;
    selected = g; cover = null; cart.userData.sharp && cart.userData.sharp();
    const im = new Image(); im.onload = () => { if (selected === g) cover = im; }; im.src = g.thumbL;
    scrL.color.set(g.ed.plastic).lerp(C('#ffffff'), .45); CP.halo.material.color.copy(scrL.color);
    for (const c of carts) if (c !== cart && c !== prev && c.parent !== caseG) dock(c);
    if (!animate) { if (prev) dock(prev); seat(cart); tvMode = intro ? 'boot' : 'on'; tvT0 = performance.now(); setPower(true, g); if (intro) power = 1; return; }
    const hover = () => L(0, SEAT.y + .42, .34);
    if (cur === 'tv') {
      // en la mano: cambio rápido, uno sale por arriba y el otro cae
      tvMode = 'collapse'; tvT0 = performance.now(); Sound.eject ? Sound.eject() : Sound.pop(); sq.vel = 2.5;
      const out = () => L(0, SEAT.y + 1.25, .3);
      if (prev) fly(prev, {p: out, q: conQ, ease: 'in', s: BIG}, .16, () => dock(prev));
      seat(cart); scene.attach(cart); cart.position.copy(out());
      at(.1, () => fly(cart, {p: seatP, q: conQ, ease: 'in', s: BIG, stretch: .16}, .15, () => { if (seq !== mySeq) return; seat(cart); impact(g, false); setPower(true, g); tvMode = 'on'; tvT0 = performance.now(); Sound.tick && Sound.tick(); }));
      return;
    }
    // desde el estuche: el viejo vuelve a su bandeja, el nuevo se levanta, vuela y entra de golpe
    if (prev) {
      tvMode = 'collapse'; tvT0 = performance.now(); setPower(false); Sound.eject ? Sound.eject() : Sound.pop(); sq.vel = 3;
      fx.spawn(L(0, HH.H / 2 - .1, .1), prev.userData.game.ed.plastic, {n: 14, speed: .7, up: .8, spread: .8, life: .4, gravity: 3});
      fly(prev, {p: hover, q: conQ, ease: 'out', s: BIG * 1.05}, .2, () => fly(prev, {p: () => homeW(prev), q: () => homeQ(prev), arc: .45, spin: -1, s: CS}, .7, () => { dock(prev); Sound.tick && Sound.tick(); }));
    } else { tvMode = 'off'; tvT0 = performance.now(); setPower(false); }
    Sound.pop(); buzz(8);
    const wig = new THREE.Quaternion().setFromEuler(new THREE.Euler(FLAT + .22, 0, .2));
    fly(cart, {p: () => homeW(cart).add(V(0, .34, .02)), q: wig, ease: 'back', s: CS * 1.22}, .28, () => {
      if (seq !== mySeq) return;
      Sound.whoosh(); trail = {cart, col: g.ed.plastic};
      fly(cart, {p: hover, q: conQ, arc: .5, spin: 1, s: BIG * 1.1}, .8, () => {
        if (seq !== mySeq) return; trail = null; Sound.tick && Sound.tick();
        fly(cart, {p: () => L(0, SEAT.y + .5, .42), q: conQ, ease: 'out', s: BIG * 1.16}, .18, () => fly(cart, {p: seatP, q: conQ, ease: 'in', s: BIG, stretch: .22}, .11, () => {
          if (seq !== mySeq) return;
          seat(cart); impact(g);
          at(.3, () => { setPower(true, g); tvMode = 'on'; tvT0 = performance.now(); Sound.power && Sound.power(); Sound.crt && Sound.crt(); });
          at(.95, () => { go('tv'); Sound.boot(); });
        }));
      });
    });
  }

  // ── botones de la consola ──
  let held = null, dir = [0, 0];
  const press = (name, on) => { const g = CP[name]; if (g) g.userData.to = on ? 1 : 0; };
  function act(name, d) {
    buzz(7);
    if (name === 'dpad') { Sound.click(); if (d[0]) onStep(d[0]); else if (d[1]) onJump(-d[1]); }
    else if (name === 'a' || name === 'start') onPlay();
    else if (name === 'b') { Sound.move(); go('wall'); }
    else if (name === 'select') { shell = (shell + 1) % shells.length; setShell(con, shells[shell]); store.set('shell', shells[shell].id); Sound.pop(); sq.vel = -3; fx.spawn(L(0, 0, .12), shells[shell].face, {n: 40, speed: 1.3, up: .6, spread: 1.57, life: .5, gravity: 2, jitter: .5, white: .3}); }
  }

  // ── puntero ──
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(), ground = new THREE.Plane(V(0, 1, 0), -.05), hitP = V();
  const setRay = e => { m2.set(e.clientX / VW * 2 - 1, -(e.clientY / VH) * 2 + 1); ray.setFromCamera(m2, camera); };
  const groundZ = e => { setRay(e); return ray.ray.intersectPlane(ground, hitP) ? hitP.z : 0; };
  const btnAt = e => { setRay(e); const h = ray.intersectObjects(CP.hits, false)[0]; if (!h) return null; const n = h.object.userData.btn; if (n === 'dpad') { const p = h.object.worldToLocal(h.point.clone()); return {name: n, d: Math.abs(p.x) > Math.abs(p.y) ? [Math.sign(p.x), 0] : [0, Math.sign(p.y)]}; } return {name: n}; };
  const cartAt = e => { setRay(e); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.cart : null; };
  let down = null, pressed = null;
  canvas.addEventListener('pointerdown', e => {
    if (intro) return;
    down = {x: e.clientX, y: e.clientY, moved: 0, z: groundZ(e), scroll, t: performance.now(), lz: 0, lt: performance.now()}; down.lz = down.z; vel = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    const b = btnAt(e); down.btn = b;
    if (cur === 'tv' && b && CP[b.name]) { held = b.name; dir = b.d || [0, 0]; press(b.name, true); Sound.tick && Sound.tick(); buzz(5); }
    if (cur === 'wall' && !b) { const c = cartAt(e); pressed = c && c.parent === caseG ? c : null; }
  });
  canvas.addEventListener('pointermove', e => {
    ptr.x = e.clientX / VW * 2 - 1; ptr.y = e.clientY / VH * 2 - 1;
    if (!down) return;
    down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    if (down.moved > 8) { pressed = null; if (held && down.moved > 26) { press(held, false); held = null; } }
    if (cur === 'wall' && !(down.btn && down.moved < 8)) { const z = groundZ(e), now = performance.now(); scroll = down.scroll - (z - down.z); const dtm = Math.max(1, now - down.lt); vel = vel * .6 + (-(z - down.lz) / dtm * 1000) * .4; down.lz = z; down.lt = now; const o = scroll < 0 ? scroll : scroll > maxScroll ? scroll - maxScroll : 0; if (o) scroll -= o * .55; }
  });
  const up = e => {
    const d = down; down = null; const p = pressed; pressed = null;
    if (held) { press(held, false); const h = held, dd = dir; held = null; if (d && d.moved < 26) act(h, dd); return; }
    if (!d) return;
    if (d.moved > 8) { if (cur === 'tv') { const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) onStep(dx < 0 ? 1 : -1); else if (dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.5) { Sound.move(); go('wall'); } } return; }
    vel = 0;
    const b = btnAt(e);
    if (cur === 'wall') { if (b) { Sound.move(); return go('tv'); } const c = cartAt(e); if (c && c.parent === caseG && c === p) onPick(c.userData.game); return; }
    if (b && b.name === 'screen') return onPlay();
    if (b && b.name === 'cart') { Sound.move(); return go('wall'); }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { if (held) press(held, false); held = null; down = null; pressed = null; });
  addEventListener('wheel', e => { if (cur === 'wall' && !e.target.closest?.('.panel')) { scroll += e.deltaY / ppuW; vel = 0; } }, {passive: true});
  // inclinación del teléfono (donde no hay que pedir permiso)
  const tiltDev = {x: 0, y: 0};
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') addEventListener('deviceorientation', e => { if (e.gamma == null) return; tiltDev.x = Math.max(-1, Math.min(1, e.gamma / 28)); tiltDev.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 42) / 28)); });

  // ── bucle ──
  let last = performance.now(), time = 0, raf = 0, slow = 0, frames = 0;
  const tmp = V(), yAxis = V(0, 1, 0), sqq = new THREE.Quaternion(), look = V();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const real = Math.min(.05, (now - last) / 1000); last = now; if (document.hidden) return;
    // si el teléfono no llega, baja la resolución
    if (!intro && frames++ > 40) { slow += real > .03 ? 1 : -.25; slow = Math.max(0, slow); if (slow > 45 && cap > 1.25) { cap = cap > 1.5 ? 1.5 : 1.25; slow = 0; frames = 0; setup(); } }
    hitstop = Math.max(0, hitstop - real); const dt = hitstop > 0 ? real * .04 : real; time += dt;
    for (let i = cues.length - 1; i >= 0; i--) { const c = cues[i]; c.t -= dt; if (c.t <= 0) { cues.splice(i, 1); if (c.seq === seq) c.fn(); } }
    // estuche: inercia, topes elásticos y sección a la vista
    if (!down || cur !== 'wall') {
      scroll += vel * dt; vel *= Math.exp(-dt * 2.6);
      const o = scroll < 0 ? scroll : scroll > maxScroll ? scroll - maxScroll : 0; if (o) { scroll -= o * Math.min(1, dt * 12); vel *= Math.exp(-dt * 18); }
      if (jumpTo != null) { scroll += (jumpTo - scroll) * Math.min(1, dt * 9); if (Math.abs(jumpTo - scroll) < .004) jumpTo = null; }
    } else jumpTo = null;
    away += ((cur === 'wall' && !intro ? 0 : 1) - away) * Math.min(1, dt * 7);
    caseG.position.set(-away * away * 1.5 * (FR.wall.e / .94), 0, Z0 - scroll); caseG.visible = away < .985;
    { const zc = -TOP - .5 - Z0 + scroll; let s = sections[0]; for (const q of sections) if (q.z <= zc - .7) s = q; if (scroll <= .02) s = sections[0]; if (s.id !== section) { section = s.id; onSection && onSection(section); } }
    // cámara
    const F = intro ? FR.intro : FR[cur], k = 1 - Math.exp(-dt * (intro ? 20 : 5.2));
    let tz = F.cz, te = F.e, tx = F.cx || 0;
    if (zoomRes) { zoom = Math.min(1, zoom + dt / .8); const e = zoom * zoom * zoom; tz += (-LCD.y - tz) * e; te += (.3 - te) * e; tx *= 1 - e; if (zoom >= 1) { const r = zoomRes; zoomRes = null; r(); } cam.cz += (tz - cam.cz) * (.2 + e * .8); cam.e += (te - cam.e) * (.2 + e * .8); cam.cx += (tx - cam.cx) * (.2 + e * .8); }
    else { cam.cz += (tz - cam.cz) * k; cam.e += (te - cam.e) * k; cam.cx += (tx - cam.cx) * k; }
    const h = cam.e / (2 * camera.aspect * tanF);
    look.set(cam.cx, 0, cam.cz); camera.position.set(cam.cx, h * Math.cos(TILT), cam.cz + h * Math.sin(TILT));
    if (shake > .002) { const a = shake * shake * .03; camera.position.add(tmp.set((Math.random() - .5) * a, 0, (Math.random() - .5) * a)); look.add(tmp); shake *= Math.pow(.0008, real); }
    camera.lookAt(look);
    vig.position.set(cam.cx, .002, cam.cz); vig.scale.set(cam.e * 1.5, cam.e / camera.aspect * 1.25, 1);
    sun.target.position.set(0, 0, cam.cz); sun.position.copy(sun.target.position).add(SUN);
    // la consola: flota, se inclina con el dedo, se aplasta con el golpe
    const tv = cur === 'tv' || intro; lift.to = tv ? 1 : 0; const lv = lift.step(dt);
    tiltX.to = tv && !zoomRes ? (down ? ptr.x : tiltDev.x) * .12 : 0; tiltY.to = tv && !zoomRes ? (down ? ptr.y : tiltDev.y) * .08 : 0;
    const sv = sq.step(dt), kv = kick.step(dt), bob = tv ? Math.sin(time * 1.4) : 0;
    busy = flights.length > 0 || cues.length > 0; rise.to = tv ? 0 : busy ? 0 : 1; const rv = rise.step(dt), wz = tv ? 0 : (busy ? catchZ : 0);
    conZ += ((tv ? 0 : busy ? catchZ : hideZ) - conZ) * Math.min(1, dt * (busy ? 9 : 6));
    con.position.set(0, HOVER + lv * .05 + bob * .006, conZ + kv * .05);
    con.rotation.set(FLAT + TILT * lv + tiltY.step(dt) + Math.sin(time * .9) * .012 * lv, 0, 0); con.rotateY(tiltX.step(dt) + Math.sin(time * .7) * .016 * lv);
    con.scale.set(1 - sv * .1, 1 + sv * .16, 1 - sv * .1);
    conShadow.position.z = .05 + conZ + kv * .05; conShadow.material.opacity = .7;
    for (const n of ['a', 'b', 'start', 'select', 'dpad']) { const g = CP[n], u = g.userData; u.vel += ((u.to - u.v) * 700 - u.vel * 30) * dt; u.v += u.vel * dt; if (n === 'dpad') { g.rotation.set(-dir[1] * u.v * .13, dir[0] * u.v * .13, 0); g.position.z = HH.D / 2 - u.v * .003; } else g.position.z = HH.D / 2 - u.v * .011; }
    // cartuchos del estuche: el que se toca se levanta
    for (const c of carts) { if (c.parent !== caseG) continue; const hm = c.userData.home, on = c === pressed, sp = Math.min(1, dt * 16); c.position.y += (hm.pos.y + (on ? .07 : 0) - c.position.y) * sp; const s = CS * (on ? 1.07 : 1); c.scale.setScalar(c.scale.x + (s - c.scale.x) * sp); }
    for (const f of [...flights]) {
      f.t = Math.min(1, f.t + dt / f.dur); const u = f.t, e = f.to.ease === 'in' ? u * u * u : f.to.ease === 'out' ? 1 - Math.pow(1 - u, 3) : f.to.ease === 'back' ? 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2) : u < .5 ? 4 * u ** 3 : 1 - Math.pow(-2 * u + 2, 3) / 2;
      f.obj.position.lerpVectors(f.from.p, val(f.to.p), e); if (f.to.arc) f.obj.position.y += Math.sin(Math.PI * u) * f.to.arc;
      f.obj.quaternion.slerpQuaternions(f.from.q, val(f.to.q), Math.min(1, Math.max(0, e))); if (f.to.spin) f.obj.quaternion.multiply(sqq.setFromAxisAngle(yAxis, e * Math.PI * 2 * f.to.spin));
      const sc = f.from.s + ((f.to.s ?? 1) - f.from.s) * e, st = f.to.stretch ? Math.sin(Math.PI * u) * f.to.stretch : 0; f.obj.scale.set(sc * (1 - st * .5), sc * (1 + st), sc * (1 - st * .5));
      if (u >= 1) { flights.splice(flights.indexOf(f), 1); f.done && f.done(); }
    }
    if (trail) fx.spawn(trail.cart.position, trail.col, {n: 2, speed: .12, spread: 3.1, life: .45, gravity: .3, drag: 2, jitter: .06});
    // luces de la consola
    power += (powerTo - power) * Math.min(1, dt * 9); const pulse = .85 + Math.sin(time * 3.2) * .15, lit = tvMode === 'off' || tvMode === 'collapse' ? .1 : 1;
    CP.pilot.material.color.setRGB(.16 + power * 1.3, .08 + power * .2, .07 + power * .12); CP.led.material.opacity = power * (.7 + Math.sin(time * 3) * .1 + bump * .3);
    CP.halo.material.opacity = bump * .1; CP.mouth.material.color.copy(glowCol); CP.mouth.material.opacity = bump * .7;
    CP.aGlow.material.opacity = tvMode === 'game' && tv && !zoomRes ? .16 + Math.sin(time * 5.2) * .12 : 0;
    scrL.position.copy(L(0, LCD.y, .35)); scrL.intensity = power * lit * .5 + bump * 2.2; bump *= Math.pow(.004, dt);
    fx.update(dt); drawScreen(now);
    composer.render(dt);
  }
  let jumpTo = null, busy = false, conZ = 0;
  insert(first, false);
  renderer.compile(scene, camera);
  raf = requestAnimationFrame(frame);
  return {
    go, insert, dim() {}, layout, pocket: true, get station() { return cur; }, get section() { return section; },
    start() { intro = false; cur = 'tv'; tvT0 = performance.now() - 900; power = 1; setTimeout(() => Sound.boot(), 400); },
    key(d) { if (cur === 'wall') { scroll += d * PITCH * 2; vel = 0; } else onStep(d); },
    jump(id) { const s = sections.find(q => q.id === id); if (s) { jumpTo = Math.max(0, Math.min(maxScroll, s.z)); vel = 0; } },
    reveal(g) { const c = byGame.get(g); if (c) { jumpTo = Math.max(0, Math.min(maxScroll, c.userData.home.pos.z - .55)); vel = 0; } },
    button(name, d) { if (CP[name]) { dir = d || [0, 0]; press(name, true); setTimeout(() => press(name, false), 110); } },
    launch() { go('tv'); zoom = 0; return new Promise(res => { zoomRes = res; }).then(() => { setTimeout(() => { zoom = 0; }, 600); }); },
    debug: {get scroll() { return scroll; }, set scroll(v) { scroll = v; vel = 0; }, get max() { return maxScroll; }, cam, FR, con},
    destroy() { cancelAnimationFrame(raf); },
  };
}
