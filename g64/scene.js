// La escena: monta la habitación, la consola, el mando y la tele; pone la luz y el acabado de imagen,
// mueve la cámara entre estaciones y hace volar los cartuchos de la pared a la consola.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {V, M4, C, tex, tint, tube, glow, blob, fontsReady, MATS, FONT} from './kit.js';
import {buildRoom, R, SH} from './room.js';
import {makeConsole, makePad, SLOT, PORT1, REAR, PAD_CABLE} from './console.js';
import {makeTV, SCREEN, TV_AV} from './tv.js';
import {CART} from './cart.js';

export async function createRoom({canvas, games, first, Sound, onStation, onPick, onPlay, tip}) {
  await fontsReady();
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, powerPreference: 'high-performance'});
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = tex(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2c2170'); g.addColorStop(.55, '#231a58'); g.addColorStop(1, '#140e34'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {mip: false});
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .22; pm.dispose();
  const camera = new THREE.PerspectiveCamera(27, 1, .3, 80);

  // ── luz: atardecer por la ventana, lamparita, neón y tele ──
  scene.add(new THREE.HemisphereLight('#b6adff', '#5a3b52', .85));
  const sun = new THREE.DirectionalLight('#ffa860', 3.6); sun.position.set(-9, 5.4, 3.3); sun.target.position.set(.6, 0, .25); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); Object.assign(sun.shadow.camera, {left: -5, right: 5, top: 5, bottom: -4, near: 1, far: 22}); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; sun.shadow.radius = 3.5;
  const fill = new THREE.DirectionalLight('#aaa8ff', 1.25); fill.position.set(6, 7, 8); scene.add(fill);
  // luz cenital tenue con sombra muy blanda: asienta los muebles en el suelo
  const top = new THREE.DirectionalLight('#cfc6ff', 1.1); top.position.set(1.2, 9, 2.2); top.target.position.set(.2, 0, 0); scene.add(top, top.target);
  top.castShadow = true; top.shadow.mapSize.set(1024, 1024); Object.assign(top.shadow.camera, {left: -4.6, right: 4.6, top: 4.6, bottom: -4.6, near: 1, far: 14}); top.shadow.camera.updateProjectionMatrix(); top.shadow.bias = -.0008; top.shadow.normalBias = .03; top.shadow.radius = 7; top.shadow.blurSamples = 16;
  const lampL = new THREE.PointLight('#ffc27a', 5.5, 5, 1.6), tvL = new THREE.PointLight('#8fd0ff', 8, 5.5, 1.5), neonL = new THREE.PointLight('#ffb070', 2.2, 4.5, 1.5), shelfL = new THREE.PointLight('#ffe2b0', 1.6, 4, 1.4);
  scene.add(lampL, tvL, neonL, shelfL);

  // ── piezas ──
  const room = buildRoom(scene, games);
  lampL.position.copy(room.lamp); neonL.position.set(SH.xc, 2.8, R.z0 + .6); shelfL.position.set(SH.xc, 1.5, R.z0 + 1.5);
  const TVP = V(-2.02, 0, -1.62), TVR = Math.PI / 4, tvDir = V(Math.sin(TVR), 0, Math.cos(TVR)), tvBase = M4(TVP.x, 0, TVP.z, TVR);
  const tvC = document.createElement('canvas'); tvC.width = 320; tvC.height = 240;
  const tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace; tvT.minFilter = tvT.magFilter = THREE.LinearFilter; tvT.generateMipmaps = false;
  const tv = makeTV(tvBase, tvT); scene.add(tv);
  const scrW = V(0, SCREEN.y, SCREEN.z).applyMatrix4(tvBase); tvL.position.copy(V(0, SCREEN.y, 1.15).applyMatrix4(tvBase));
  const CONP = TVP.clone().addScaledVector(tvDir, 1.85), conBase = M4(CONP.x, 0, CONP.z, TVR), con = makeConsole(conBase); scene.add(con);
  const slot = SLOT.clone().applyMatrix4(conBase), conQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, TVR, 0));
  const padBase = M4(CONP.x + tvDir.x * 1.0 - .62, 0, CONP.z + tvDir.z * 1.0 + .3, TVR - .55), pad = makePad(padBase); scene.add(pad);
  const put = (m, p, ry = 0) => { m.position.copy(p); m.position.y = .012; m.rotation.z = ry; scene.add(m); };
  put(blob(2.2, 1.8, .95), CONP, -TVR); put(blob(1.2, 1.2, .85), V(0, 0, 0).applyMatrix4(padBase).add(V(.1, 0, .1))); put(blob(3.0, 2.4, .9), TVP.clone().add(V(.15, 0, .15)), -TVR);
  // alfombra
  { const rug = tex(256, 256, x => { const cols = ['#17122a', '#ff5b35', '#ffd23f', '#35d0c0', '#3b2a78']; cols.forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(128, 128, 126 - i * 18, 0, 7); x.fill(); }); x.fillStyle = '#ff8fb0'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.beginPath(); x.arc(128 + Math.cos(a) * 40, 128 + Math.sin(a) * 40, 6, 0, 7); x.fill(); } x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.57, r = i % 2 ? 10 : 22; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.fill(); x.strokeStyle = 'rgba(23,18,42,.22)'; x.lineWidth = 1; for (let i = 0; i < 90; i++) { const a = i / 90 * 6.283; x.beginPath(); x.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20); x.lineTo(128 + Math.cos(a) * 126, 128 + Math.sin(a) * 126); x.stroke(); } });
    const r = new THREE.Mesh(new THREE.CircleGeometry(1.55, 48), new THREE.MeshStandardMaterial({map: rug, roughness: 1})); r.rotation.x = -Math.PI / 2; r.position.set(CONP.x + tvDir.x * .35, .008, CONP.z + tvDir.z * .35); r.receiveShadow = true; scene.add(r);
    const fr = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.62, 60, 1), new THREE.MeshStandardMaterial({color: '#f4efe4', roughness: 1, map: tex(256, 4, (x, w, h) => { for (let i = 0; i < w; i += 4) { x.fillStyle = '#fff'; x.fillRect(i, 0, 2, h); } }), transparent: true, alphaTest: .5})); fr.rotation.x = -Math.PI / 2; fr.position.copy(r.position).setY(.006); scene.add(fr); }
  // cables: mando → puerto 1, consola → tomas de la tele, consola → regleta
  const cable = (pts, r, hex) => { const m = new THREE.Mesh(tint(tube(pts, r, 6, 40), hex, 1, 1), MATS.rubber); m.castShadow = true; scene.add(m); };
  { const a = PAD_CABLE.clone().applyMatrix4(padBase), b = PORT1.clone().applyMatrix4(conBase), mid = a.clone().lerp(b, .5).add(V(.3, 0, .25)).setY(.016); cable([a, a.clone().lerp(mid, .45).setY(.02), mid, b.clone().lerp(mid, .5).setY(.02), b.clone().add(V(tvDir.x * .08, -.02, tvDir.z * .08)), b], .011, '#24232c');
    const r0 = REAR[0].clone().applyMatrix4(conBase), av = TV_AV.clone().applyMatrix4(tvBase); cable([r0, r0.clone().addScaledVector(tvDir, -.25).setY(.02), r0.clone().addScaledVector(tvDir, -.6).add(V(.5, 0, -.2)).setY(.016), av.clone().addScaledVector(tvDir, .5).setY(.02), av.clone().addScaledVector(tvDir, .2).setY(.45), av.clone().addScaledVector(tvDir, .05)], .009, '#17161c');
    const r1 = REAR[1].clone().applyMatrix4(conBase); cable([r1, r1.clone().addScaledVector(tvDir, -.3).setY(.02), V(-1.9, .016, -.55), V(-2.5, .016, -.62), V(-2.7, .04, -.7)], .009, '#17161c'); }

  // ── la pantalla de la tele ──
  let selected = null, tvT0 = performance.now(), cover = null, tvMode = 'boot';
  function drawTV(now) {
    const x = tvC.getContext("2d"), w = 320, h = 240, t = Math.max(0, (now - tvT0) / 1000);
    if (selected && cover && tvMode === 'game' && t > .5) {
      const s = Math.max(w / cover.width, 196 / cover.height), sw = w / s, sh = 196 / s; x.imageSmoothingQuality = 'high';
      x.drawImage(cover, (cover.width - sw) / 2, (cover.height - sh) / 2, sw, sh, 0, 0, w, 196);
      x.fillStyle = '#17122a'; x.fillRect(0, 192, w, 48); x.fillStyle = selected.ed.plastic; x.fillRect(0, 189, w, 5);
      x.fillStyle = '#ffe95c'; x.font = `22px ${FONT}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(selected.label.toUpperCase(), 22, 215, 160);
      if (Math.floor(t * 2.2) % 2) { x.fillStyle = '#c6f432'; x.beginPath(); x.roundRect(w - 130, 203, 108, 24, 12); x.fill(); x.fillStyle = '#17122a'; x.font = `12px ${FONT}`; x.textAlign = 'center'; x.fillText(selected.web ? 'PULSA START' : 'START: COPIAR', w - 76, 216); }
      if (t < .9) { x.fillStyle = `rgba(255,255,255,${1 - (t - .5) / .4})`; x.fillRect(0, 0, w, h); }
    } else {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2338b0'); g.addColorStop(1, '#0c0b2a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 34; i++) { x.fillStyle = `rgba(255,255,255,${.25 + (i % 3) * .2})`; x.fillRect((i * 97 + t * (10 + i % 5 * 6)) % w, (i * 53) % h, 2, 2); }
      const cols = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'], grow = Math.min(1, t / .6), e = 1 - Math.pow(1 - grow, 3); x.lineWidth = 19 * e; cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); const a = t * 1.3 - .35 + i * 1.42 + (1 - e) * 4; x.arc(160, 90, 38 * e, a, a + 1.44); x.stroke(); });
      if (t > .45) { x.globalAlpha = Math.min(1, (t - .45) / .3); x.textBaseline = 'middle'; x.font = `38px ${FONT}`; x.lineWidth = 8; x.lineJoin = 'round'; x.strokeStyle = '#0a0820'; x.textAlign = 'center'; x.strokeText('gavilanbe 64', 160, 176); const w1 = x.measureText('gavilanbe 64').width, wg = x.measureText('gavilanbe ').width; x.textAlign = 'left'; x.fillStyle = '#ffe95c'; x.fillText('gavilanbe', 160 - w1 / 2, 176); x.fillStyle = '#ff5b35'; x.fillText('64', 160 - w1 / 2 + wg, 176); x.globalAlpha = 1; }
      if (!intro && t > 1.0 && Math.floor(t * 2) % 2) { x.textAlign = 'center'; x.font = `13px ${FONT}`; x.fillStyle = '#fff'; x.fillText(selected ? 'LEYENDO EL CARTUCHO…' : 'ELIGE UN CARTUCHO', 160, 214); }
      if (!intro && selected && cover && tvMode === 'boot' && t > 2.6) { tvMode = 'game'; tvT0 = now - 500; }
    }
    x.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < h; y += 2) x.fillRect(0, y, w, 1);
    tvT.needsUpdate = true;
  }

  // ── acabado de imagen ──
  let dpr = 1, composer = null, bloom = null;
  function setup() {
    const w = innerWidth, h = innerHeight; dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {type: THREE.HalfFloatType, samples: 4});
    composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), .2, .6, .96); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  setup();
  let rsT = 0; addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(setup, 120); });

  // ── cámara por estaciones ──
  const portrait = () => innerWidth / innerHeight < .9;
  const ST = {
    hero: {pos: V(8.5, 6.1, 9.8), at: V(.15, 1.02, -.1), fov: 27, ppos: V(7.4, 9.4, 13.4), pat: V(-.2, 1.1, -.2), pfov: 40},
    wall: {pos: V(SH.xc, 1.28, 2.05), at: V(SH.xc, 1.26, R.z0), fov: 27, ppos: V(SH.xc, 1.28, 2.6), pat: V(SH.xc, 1.26, R.z0), pfov: 36, pan: true},
    tv: {pos: CONP.clone().addScaledVector(tvDir, 6.0).add(V(.8, 2.3, -.8)), at: scrW.clone().lerp(CONP.clone().setY(.2), .5), fov: 27, ppos: CONP.clone().addScaledVector(tvDir, 7.2).add(V(.3, 3.0, -.3)), pat: scrW.clone().lerp(CONP.clone().setY(.2), .5), pfov: 34},
  };
  // el título: dentro de la tele, hasta que se pulsa START
  const titlePos = () => scrW.clone().addScaledVector(tvDir, portrait() ? 2.6 : 1.42);
  let cur = 'hero', pan = 0, zoom = 0, zoomRes = null, intro = true, speed = 3.3, off = 0;
  const cam = {pos: titlePos(), at: scrW.clone(), fov: 27}, ptr = {x: 0, y: 0};
  function go(name) { if (!ST[name]) return; cur = name; onStation(name); tip.classList.remove('on'); hover = null; }
  const halfPan = () => Math.max(0, (SH.x1 - SH.x0) / 2 - (portrait() ? .45 : 1.3));

  // ── cartuchos: asomar, volar, entrar ──
  const {carts, pickables} = room, flights = [], cartOf = g => carts.find(c => c.userData.game === g);
  let hover = null, bump = 0, dimSet = null;
  const homeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1, 0, 0));
  function fly(obj, to, dur, done) { for (let i = flights.length - 1; i >= 0; i--) if (flights[i].obj === obj) flights.splice(i, 1); flights.push({obj, from: {p: obj.position.clone(), q: obj.quaternion.clone()}, to, t: 0, dur, done}); }
  const seat = () => slot.clone().add(V(0, CART.H / 2 - .062, 0));
  function insert(g, animate = true) {
    const cart = cartOf(g); if (!cart) return;
    if (selected && selected !== g) { const old = cartOf(selected), h = old.userData.home; Sound.pop(); animate ? fly(old, {p: h.pos.clone(), q: homeQ, arc: .7, spin: -1}, .8) : (old.position.copy(h.pos), old.quaternion.copy(homeQ)); }
    selected = g; cover = null; tvMode = 'boot'; tvT0 = performance.now();
    const i = new Image(); i.onload = () => { if (selected === g) cover = i; }; i.src = g.thumbL;
    tvL.color.set(g.ed.plastic).lerp(C('#ffffff'), .4); tv.userData.halo.material.color.copy(tvL.color);
    if (!animate) { cart.position.copy(seat()); cart.quaternion.copy(conQ); return; }
    Sound.whoosh();
    fly(cart, {p: slot.clone().add(V(0, .75, 0)), q: conQ, arc: .7, spin: 1}, 1.0, () => fly(cart, {p: seat(), q: conQ, ease: 'in'}, .2, () => { bump = 1; Sound.clack(); setTimeout(() => Sound.boot(), 250); }));
    go('tv');
  }
  function dim(set) { dimSet = set && set.size < games.length ? set : null; }

  // ── puntero ──
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(), plane = new THREE.Plane(V(0, 0, 1), -(R.z0 + .35)), hitP = V();
  const setRay = e => { m2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(m2, camera); };
  const cartAt = e => { setRay(e); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.cart : null; };
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = {x: e.clientX, y: e.clientY, pan, moved: 0}; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1;
    if (down) { down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y)); if (cur === 'wall' && halfPan() > 0) pan = Math.max(-1, Math.min(1, down.pan - (e.clientX - down.x) / innerWidth * 2.7 / halfPan())); }
    if (e.pointerType !== 'mouse' || cur !== 'wall' || (down && down.moved > 6)) return;
    const c = cartAt(e), ok = c && c.userData.game !== selected ? c : null;
    if (ok !== hover) { hover = ok; if (ok) Sound.hover(); }
    canvas.style.cursor = ok ? 'pointer' : 'grab';
    if (ok) { tip.innerHTML = `${ok.userData.game.label.replace(/[&<>]/g, '')}<small>${ok.userData.game.ed.model}</small>`; tip.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-170%)`; tip.classList.add('on'); } else tip.classList.remove('on');
  });
  canvas.addEventListener('pointerup', e => {
    const d = down; down = null; if (!d || d.moved > 8) return;
    const c = cartAt(e);
    if (cur === 'wall') { if (c) { Sound.pop(); onPick(c.userData.game); } return; }
    if (cur === 'tv') { setRay(e); if (ray.intersectObject(tv.userData.screen)[0]) return onPlay(); if (c && c.userData.game !== selected) { go('wall'); } return; }
    setRay(e); Sound.move();
    if (ray.ray.intersectPlane(plane, hitP) && hitP.x > SH.x0 - .1 && hitP.x < SH.x1 + .1 && hitP.y > .1 && hitP.y < 2.4) { pan = halfPan() ? Math.max(-1, Math.min(1, (hitP.x - SH.xc) / halfPan())) : 0; go('wall'); } else go('tv');
  });
  canvas.addEventListener('pointerleave', () => { hover = null; tip.classList.remove('on'); });
  addEventListener('wheel', e => { if (cur === 'wall' && !e.target.closest('.panel')) pan = Math.max(-1, Math.min(1, pan + (e.deltaX + e.deltaY) * .0014)); }, {passive: true});

  // ── bucle ──
  let last = performance.now(), time = 0, raf = 0;
  const tmp = V(), yAxis = V(0, 1, 0), sq = new THREE.Quaternion(), tpos = V(), tat = V(), launchPos = scrW.clone().addScaledVector(tvDir, .95);
  const neon = scene.children.find(o => o.userData.neon);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; if (document.hidden) return; time += dt;
    const s = ST[cur], p = portrait(); speed += (3.3 - speed) * dt * .35; const k = 1 - Math.exp(-dt * speed);
    tpos.copy(p ? s.ppos : s.pos); tat.copy(p ? s.pat : s.at);
    if (intro) { tpos.copy(titlePos()); tat.copy(scrW); }
    if (s.pan) { if (!down && !mobile && Math.abs(ptr.x) > .72 && Math.abs(ptr.y) < .7) pan = Math.max(-1, Math.min(1, pan + Math.sign(ptr.x) * dt * .55)); tpos.x += pan * halfPan(); tat.x += pan * halfPan(); }
    let fov = p ? s.pfov : s.fov;
    if (zoomRes) { zoom = Math.min(1, zoom + dt / .9); const e = zoom * zoom * zoom; tpos.lerp(launchPos, e); tat.lerp(scrW, e); fov -= e * 6; if (zoom >= 1) { const r = zoomRes; zoomRes = null; r(); } cam.pos.lerp(tpos, .2 + e * .8); cam.at.lerp(tat, .2 + e * .8); }
    else { cam.pos.lerp(tpos, k); cam.at.lerp(tat, k); }
    cam.fov += (fov - cam.fov) * k;
    const sway = (cur === 'hero' ? 1 : .25) * (zoomRes || intro ? 0 : 1) * (mobile ? 0 : 1);
    camera.position.copy(cam.pos).add(tmp.set(ptr.x * .5 * sway, -ptr.y * .28 * sway + Math.sin(time * .5) * .03, -ptr.x * .22 * sway));
    off += ((intro || zoomRes || p ? 0 : cur === 'hero' ? 3.4 : cur === 'wall' ? 4.6 : 3.2) - off) * k; camera.filmOffset = -off;
    camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(cam.at);
    const moving = new Set(flights.map(f => f.obj));
    for (const c of carts) { const g = c.userData.game; if (g === selected || moving.has(c)) continue; const h = c.userData.home, on = c === hover, off = dimSet && !dimSet.has(g), sp = Math.min(1, dt * 14); c.position.z += ((h.pos.z + (on ? .1 : off ? -.075 : 0)) - c.position.z) * sp; c.position.y += ((h.pos.y + (on ? .022 : 0)) - c.position.y) * sp; c.rotation.x += ((on ? .02 : -.1) - c.rotation.x) * sp; }
    for (const f of [...flights]) {
      f.t = Math.min(1, f.t + dt / f.dur); const e = f.to.ease === 'in' ? f.t * f.t : f.t < .5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
      f.obj.position.lerpVectors(f.from.p, f.to.p, e); if (f.to.arc) f.obj.position.y += Math.sin(Math.PI * f.t) * f.to.arc;
      f.obj.quaternion.slerpQuaternions(f.from.q, f.to.q, e); if (f.to.spin) f.obj.quaternion.multiply(sq.setFromAxisAngle(yAxis, e * Math.PI * 2 * f.to.spin));
      if (f.t >= 1) { flights.splice(flights.indexOf(f), 1); f.done && f.done(); }
    }
    tvL.intensity = 8 + Math.sin(time * 12) * .35 + Math.sin(time * 2.7) * .5 + bump * 7; bump *= .9;
    con.userData.led.material.opacity = .7 + Math.sin(time * 3) * .12 + bump * .3;
    if (neon) neon.material.opacity = Math.sin(time * 31) > .985 || Math.sin(time * 1.7 + 2) > .995 ? .55 : 1;
    room.anim(time); drawTV(now);
    composer.render(dt);
  }
  // el primero ya está puesto en la consola
  insert(first, false);
  renderer.compile(scene, camera);
  raf = requestAnimationFrame(frame);
  return {
    go, insert, dim, get station() { return cur; },
    start() { intro = false; speed = .9; tvT0 = performance.now() - 1200; setTimeout(() => Sound.boot(), 500); },
    key(d) { if (cur === 'wall') pan = Math.max(-1, Math.min(1, pan + d * .3)); else { const o = ['hero', 'wall', 'tv']; go(o[(o.indexOf(cur) + d + 3) % 3]); } },
    launch() { go('tv'); zoom = 0; return new Promise(res => { zoomRes = res; }).then(() => { setTimeout(() => { zoom = 0; }, 600); }); },
    destroy() { cancelAnimationFrame(raf); },
  };
}
