// La habitación en corte: suelo, paredes, ventana, la pared de la colección, los muebles y el atrezo.
import {THREE, C, V, M4, Kit, loft, lathe, squircle, scaleRing, rbox, cyl, ellipsoid, ext, rrect, decal, glow, blob, tex, tint, tube, rnd, FONT, MONO} from './kit.js';
import {makeCart, CART} from './cart.js';
import {EDITIONS, edition} from '../editions.js';

export const R = {x0: -3, x1: 3.1, z0: -2.6, z1: 2.7, h: 3.05, t: .16};
const WIN = {z0: .5, z1: 2.05, y0: 1.12, y1: 2.42};
export const SH = {x0: -1.472, y0: .42, z: R.z0 + .17, rows: 6, px: .272, py: .262};
const std = o => new THREE.MeshStandardMaterial(o);

export function buildRoom(scene, games) {
  const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); scene.add(m); return m; };
  const shadow = (x, z, sx, sz, o = .85, ry = 0) => { const b = blob(sx, sz, o); b.rotation.z = ry; add(b, x, .012, z); };
  const W = R.x1 - R.x0, D = R.z1 - R.z0, xc = (R.x0 + R.x1) / 2, zc = (R.z0 + R.z1) / 2;

  // ── suelo de tarima ──
  const wood = tex(256, 256, (x, w, h) => {
    for (let r = 0; r < 8; r++) { const y = r * 32, off = (r * 53) % 90; for (let c = -1; c < 4; c++) { const v = rnd(); x.fillStyle = `hsl(${22 + v * 9},${48 + v * 14}%,${42 + v * 11}%)`; x.fillRect(c * 96 + off, y, 95, 31); x.fillStyle = 'rgba(40,16,6,.5)'; x.fillRect(c * 96 + off + 95, y, 1, 31); x.fillStyle = 'rgba(30,12,4,.7)'; x.fillRect(c * 96 + off + 4, y + 6, 2, 2); x.fillRect(c * 96 + off + 4, y + 23, 2, 2); } x.fillStyle = 'rgba(40,16,6,.6)'; x.fillRect(0, y + 31, w, 1); x.fillStyle = 'rgba(255,220,170,.12)'; x.fillRect(0, y, w, 1); }
    for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '255,225,180' : '60,25,8'},.07)`; x.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 30, 1); }
  }, {repeat: [2.4, 2.1]});
  const fl = new THREE.Mesh(tint(new THREE.PlaneGeometry(W, D, 14, 12), '#ffffff', 1, 1), std({map: wood, vertexColors: true, roughness: .62}));
  { const p = fl.geometry.attributes.position, c = fl.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + W / 2) / W, v = (-p.getY(i) + D / 2) / D, k = .58 + .44 * Math.min(1, Math.min(u * 3.4, v * 3.4)); c.setXYZ(i, k, k * .97, k * .95); } }
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; add(fl, xc, 0, zc);

  // ── paredes: zócalo de lamas, papel pintado y cantos del corte ──
  const k = new Kit(), cut = '#f6ead2', lower = '#2a7a84', rail = '#fff3dc', base = '#1c5660';
  const paper = tex(128, 128, (x, w, h) => { x.fillStyle = '#f0d2a2'; x.fillRect(0, 0, w, h); x.fillStyle = '#ecc892'; for (let i = 0; i < 4; i++) x.fillRect(i * 32, 0, 14, h); x.strokeStyle = '#e2b877'; x.lineWidth = 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const a = i * 64 + (j ? 32 : 0) + 8, b = j * 64 + 14; x.beginPath(); x.moveTo(a, b + 10); x.lineTo(a + 7, b); x.lineTo(a + 14, b + 10); x.closePath(); x.stroke(); x.beginPath(); x.arc(a + 36, b + 34, 5, 0, 7); x.stroke(); x.beginPath(); x.moveTo(a + 4, b + 40); x.quadraticCurveTo(a + 9, b + 32, a + 14, b + 40); x.quadraticCurveTo(a + 19, b + 48, a + 24, b + 40); x.stroke(); } });
  const lamas = tex(64, 64, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,30,40,.28)'; x.fillRect(0, 0, 2, h); x.fillRect(32, 0, 2, h); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(3, 0, 1, h); x.fillRect(35, 0, 1, h); });
  const panel = (w, h, t, x, y, z, ry, hex, k0, k1) => { const tt = t.clone(); tt.needsUpdate = true; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(w / (t === paper ? 1.15 : .42), t === paper ? h / 1.15 : 1); const m = new THREE.Mesh(tint(new THREE.PlaneGeometry(w, h, 1, 4), hex, k0, k1), std({map: tt, vertexColors: true, roughness: .95})); m.rotation.y = ry; m.receiveShadow = true; add(m, x, y, z); };
  // fondo
  k.box(W + R.t, .3, D + R.t, '#3a2550', xc - R.t / 2, -.151, zc - R.t / 2, 'matte', .55, 1);
  k.box(W, R.h, R.t, '#e9cfa3', xc, R.h / 2, R.z0 - R.t / 2 - .002, 'matte', .8, 1);
  panel(W, 1.0, lamas, xc, .5, R.z0, 0, lower, .58, 1); panel(W, R.h - 1, paper, xc, 1 + (R.h - 1) / 2, R.z0, 0, '#ffffff', .86, 1.03);
  k.add(rbox(W, .07, .06, .02), rail, M4(xc, 1.0, R.z0 + .02), 'matte', .9, 1).box(W, .13, .04, base, xc, .065, R.z0 + .02, 'matte', .8, 1);
  // izquierda, con el hueco de la ventana
  const lw = (z0, z1, y0, y1) => k.box(R.t, y1 - y0, z1 - z0, '#e9cfa3', R.x0 - R.t / 2 - .002, (y0 + y1) / 2, (z0 + z1) / 2, 'matte', .86, 1);
  lw(R.z0 - R.t, R.z1, 0, WIN.y0); lw(R.z0 - R.t, WIN.z0, WIN.y0, R.h); lw(WIN.z1, R.z1, WIN.y0, R.h); lw(WIN.z0, WIN.z1, WIN.y1, R.h);
  panel(D, 1.0, lamas, R.x0, .5, zc, Math.PI / 2, lower, .58, 1);
  const pz = (z0, z1, y0, y1) => panel(z1 - z0, y1 - y0, paper, R.x0, (y0 + y1) / 2, (z0 + z1) / 2, Math.PI / 2, '#ffffff', .9, 1.02);
  pz(R.z0, WIN.z0, 1, R.h); pz(WIN.z1, R.z1, 1, R.h); pz(WIN.z0, WIN.z1, 1, WIN.y0); pz(WIN.z0, WIN.z1, WIN.y1, R.h);
  k.add(rbox(.06, .07, D, .02), rail, M4(R.x0 + .02, 1.0, zc), 'matte', .9, 1).box(.04, .13, D, base, R.x0 + .02, .065, zc, 'matte', .8, 1);
  k.box(W + R.t, .03, R.t, cut, xc - R.t / 2, R.h + .015, R.z0 - R.t / 2, 'matte', 1, 1).box(R.t, .03, D, cut, R.x0 - R.t / 2, R.h + .015, zc, 'matte', 1, 1);
  k.box(R.t, R.h + .3, .012, cut, R.x0 - R.t / 2, R.h / 2 - .15, R.z1 + .004, 'matte', .9, 1).box(.012, R.h + .3, R.t, cut, R.x1 + .004, R.h / 2 - .15, R.z0 - R.t / 2, 'matte', .9, 1);
  // ── ventana: marco, alféizar, cruceta, barra y cortinas con pliegues ──
  const wz = (WIN.z0 + WIN.z1) / 2, wy = (WIN.y0 + WIN.y1) / 2, ww = WIN.z1 - WIN.z0, wh = WIN.y1 - WIN.y0;
  k.add(rbox(.3, .05, ww + .22, .02), rail, M4(R.x0 - .02, WIN.y0 - .02, wz), 'matte', .9, 1.05).add(rbox(.2, .07, ww + .16, .02), rail, M4(R.x0 - .07, WIN.y1 + .03, wz), 'matte', .9, 1);
  for (const z of [WIN.z0 - .03, WIN.z1 + .03]) k.add(rbox(.2, wh + .1, .07, .02), rail, M4(R.x0 - .07, wy, z), 'matte', .9, 1);
  k.box(.05, wh, .045, rail, R.x0 - .1, wy, wz, 'matte', .9, 1).box(.05, .045, ww, rail, R.x0 - .1, wy + .12, wz, 'matte', .9, 1);
  k.cyl(.018, .018, ww + .7, 8, '#7a4a2a', R.x0 + .1, WIN.y1 + .2, wz, 'wood', 1, 1, Math.PI / 2);
  for (const z of [WIN.z0 - .37, WIN.z1 + .37]) k.add(ellipsoid(.04, .04, .04, 8, 6), '#ffd23f', M4(R.x0 + .1, WIN.y1 + .2, z), 'gold', 1, 1);
  for (const [z, s] of [[WIN.z0 - .1, 1], [WIN.z1 + .1, -1]]) {
    const cg = new THREE.PlaneGeometry(.62, wh + .5, 14, 8), p = cg.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = (p.getY(i) + (wh + .5) / 2) / (wh + .5), pinch = 1 - .45 * Math.exp(-Math.pow((v - .32) / .16, 2)); p.setZ(i, Math.sin(u * 30) * .04 * (1.1 - v * .3)); p.setX(i, u * pinch - s * (1 - pinch) * .2); }
    cg.computeVertexNormals(); cg.rotateY(Math.PI / 2);
    k.add(cg, '#ff6f4f', M4(R.x0 + .1, wy - .08, z + s * .12), 'fabric', .72, 1.1);
    k.add(rbox(.06, .05, .3, .015), '#ffd23f', M4(R.x0 + .1, WIN.y0 + .34, z + s * .14), 'fabric', 1, 1);
  }
  // macetita con cactus en el alféizar
  k.add(lathe([[.05, 0], [.07, .1], [.075, .1]], 10), '#e06a3c', M4(R.x0 + .06, WIN.y0, WIN.z0 + .22), 'matte', .8, 1.1).add(ellipsoid(.045, .11, .045, 8, 8), '#3fae4a', M4(R.x0 + .06, WIN.y0 + .19, WIN.z0 + .22), 'matte', .7, 1.15).add(ellipsoid(.025, .05, .025, 6, 6), '#3fae4a', M4(R.x0 + .06, WIN.y0 + .22, WIN.z0 + .28, 0, .5), 'matte', .8, 1.15);
  scene.add(k.build());
  // cielo, sol y siluetas tras el cristal
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww + .1, wh + .1), new THREE.MeshBasicMaterial({map: tex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a3fb0'); g.addColorStop(.45, '#ff6f7a'); g.addColorStop(.8, '#ffb65c'); g.addColorStop(1, '#ffe9a8'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#fff6c8'; x.beginPath(); x.arc(84, 92, 17, 0, 7); x.fill(); x.fillStyle = 'rgba(255,140,120,.55)'; x.beginPath(); x.ellipse(36, 52, 34, 6, 0, 0, 7); x.ellipse(100, 34, 26, 5, 0, 0, 7); x.fill(); x.fillStyle = '#3b2468'; x.fillRect(0, 112, w, 16); for (const [a, b, c] of [[6, 22, 96], [30, 14, 104], [48, 26, 90], [80, 16, 106], [100, 24, 98]]) x.fillRect(a, c, b, 40); x.fillStyle = '#ffd23f'; for (let i = 0; i < 26; i++) x.fillRect(6 + rnd() * 116 | 0, 96 + rnd() * 28 | 0, 2, 2); })}));
  sky.rotation.y = Math.PI / 2; add(sky, R.x0 - .15, wy, wz);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: tex(32, 32, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(.2, 'rgba(255,255,255,0)'); g.addColorStop(.4, 'rgba(255,255,255,.22)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.62, 'rgba(255,255,255,.12)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); })}));
  glass.rotation.y = Math.PI / 2; add(glass, R.x0 - .09, wy, wz);
  const wg = glow(2.6, '#ff9a5c', .22); wg.rotation.y = Math.PI / 2; add(wg, R.x0 + .05, wy, wz);
  shadow(xc, R.z0 + .08, W * 1.2, 1.1, .7); shadow(R.x0 + .08, zc, D * 1.2, 1.1, .7, Math.PI / 2);

  // ── la pared de la colección ──
  const carts = [], pickables = [];
  {
    const edIds = Object.keys(EDITIONS).filter(id => games.some(g => g.model === id)), s = new Kit(), w1 = '#b87644', w2 = '#8a5530', cream = '#fff3dc', top = SH.y0 + SH.rows * SH.py;
    let col = 0; const blocks = [];
    for (const id of edIds) {
      const list = games.filter(g => g.model === id), ed = edition(id), cols = Math.ceil(list.length / SH.rows), x0 = SH.x0 + col * SH.px, w = cols * SH.px;
      s.box(w - .02, SH.rows * SH.py, .02, ed.plastic, x0 + w / 2, SH.y0 + SH.rows * SH.py / 2, SH.z - .135, 'matte', .2, .46);
      s.add(rbox(.03, SH.rows * SH.py + .02, .25, .008), cream, M4(x0, SH.y0 + SH.rows * SH.py / 2, SH.z - .03), 'matte', .78, 1.03);
      // placa del modelo con su recuento
      const pw = Math.max(w - .04, .23), plate = decal(pw, .15, 620, (x, cw, ch) => { x.fillStyle = ed.plastic; x.beginPath(); x.roundRect(0, 0, cw, ch, 10); x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, ch - 8, cw, 8); const ink = ed.dark ? '#fff' : '#17122a'; x.fillStyle = ink; x.textBaseline = 'middle'; x.textAlign = 'center'; if (cols > 1) { x.font = `${ch * .5}px ${FONT}`; x.fillText(ed.model.toUpperCase(), cw / 2, ch * .4, cw - 16); x.font = `600 ${ch * .2}px ${MONO}`; x.fillText(`${ed.name.toUpperCase()} · ${list.length}`, cw / 2, ch * .76, cw - 12); } else { x.font = `${ch * .4}px ${FONT}`; const [a, b] = ed.model.toUpperCase().split(' '); x.fillText(a, cw / 2, ch * .32, cw - 10); x.fillText(b || '', cw / 2, ch * .68, cw - 10); } });
      add(plate, x0 + w / 2, top + .135, SH.z + .1);
      list.forEach((g, i) => { const c = makeCart(g), cc = Math.floor(i / SH.rows), rr = i % SH.rows; c.position.set(x0 + SH.px / 2 + cc * SH.px, SH.y0 + (SH.rows - 1 - rr) * SH.py + CART.H / 2 + .034, SH.z + .02); c.rotation.x = -.1; c.userData.home = {pos: c.position.clone(), rx: -.1}; scene.add(c); carts.push(c); pickables.push(...c.userData.pick); });
      blocks.push({id, x: x0 + w / 2, w}); col += cols;
    }
    const SW = col * SH.px, sx = SH.x0 + SW / 2; SH.x1 = SH.x0 + SW; SH.xc = sx; SH.blocks = blocks;
    for (let r = 0; r <= SH.rows; r++) { s.add(rbox(SW, .024, .22, .006), cream, M4(sx, SH.y0 + r * SH.py, SH.z - .03), 'matte', .86, 1.03); if (r < SH.rows) s.add(rbox(SW - .01, .03, .012, .005), '#ffe1b3', M4(sx, SH.y0 + r * SH.py + .022, SH.z + .078), 'matte', .9, 1.05); }
    // costados, cornisa, zócalo con cajones
    for (const x of [SH.x0 - .035, SH.x1 + .035]) s.add(rbox(.07, top + .32, .32, .015), w1, M4(x, (top + .32) / 2, SH.z - .03), 'wood', .6, 1.06);
    s.add(rbox(SW + .2, .06, .36, .02), w1, M4(sx, top + .3, SH.z - .02), 'wood', .9, 1.08).add(rbox(SW + .02, .22, .05, .01), '#17122a', M4(sx, top + .135, SH.z + .07), 'matte', 1, 1);
    s.add(rbox(SW + .1, SH.y0 - .02, .34, .015), w2, M4(sx, (SH.y0 - .02) / 2, SH.z - .02), 'wood', .58, 1);
    const nd = 8; for (let i = 0; i < nd; i++) { const dx = SH.x0 + (i + .5) * SW / nd; s.add(rbox(SW / nd - .04, SH.y0 - .14, .03, .012), w1, M4(dx, SH.y0 / 2 + .01, SH.z + .15), 'wood', .72, 1.04).add(rbox(.12, .022, .03, .01), '#ffd23f', M4(dx, SH.y0 / 2 + .06, SH.z + .175), 'gold', 1, 1.1); }
    // tira de luz bajo la cornisa
    s.box(SW, .014, .02, '#fff0c8', sx, top + .255, SH.z + .12, 'glow', 2.4, 2.4);
    // ── cosas encima del mueble ──
    const ty = top + .33, tz = SH.z - .02;
    // radiocasete
    const bb = M4(SH.x0 + .55, ty, tz, .12);
    s.add(rbox(.62, .3, .17, .03), '#2e2d38', bb.clone().multiply(M4(0, .15, 0)), 'plastic', .75, 1.12).add(rbox(.2, .09, .01, .01), '#101015', bb.clone().multiply(M4(0, .2, .087)), 'gloss', 1, 1).add(rbox(.56, .02, .1, .008), '#c9c5d0', bb.clone().multiply(M4(0, .305, 0)), 'metal', 1, 1);
    for (const sx2 of [-1, 1]) { s.add(lathe([[.105, 0], [.105, .01], [.09, .016], [.03, .006], [.0001, .012]], 18), '#15141a', bb.clone().multiply(M4(sx2 * .2, .14, .086, 0, Math.PI / 2)), 'rubber', .9, 1.2); s.add(lathe([[.112, 0], [.112, .014], [.1, .014]], 18), '#c9c5d0', bb.clone().multiply(M4(sx2 * .2, .14, .084, 0, Math.PI / 2)), 'metal', 1, 1); }
    for (let i = 0; i < 5; i++) s.add(rbox(.03, .016, .02, .005), ['#ff5b35', '#f4efe4', '#f4efe4', '#f4efe4', '#b9f02a'][i], bb.clone().multiply(M4(-.07 + i * .035, .312, .03)), 'plastic', 1, 1);
    s.add(tube([[-.24, .3, 0], [-.22, .4, 0], [0, .43, 0], [.22, .4, 0], [.24, .3, 0]], .012, 6, 16), '#55535f', bb, 'plastic', 1, 1).cyl(.005, .005, .5, 5, '#d8d5e0', SH.x0 + .86, ty + .5, tz - .04, 'metal', 1, 1, 0, -.4);
    // copa
    s.add(lathe([[.07, 0], [.07, .03], [.02, .05], [.016, .12], [.07, .17], [.085, .26], [.08, .26], [.064, .18], [.0001, .16]], 16), '#f0c34a', M4(SH.x0 + 1.45, ty, tz), 'gold', .85, 1.15).add(rbox(.17, .05, .17, .01), '#3a2014', M4(SH.x0 + 1.45, ty - .0, tz), 'wood', 1, 1);
    for (const s2 of [-1, 1]) s.add(new THREE.TorusGeometry(.04, .009, 5, 10, Math.PI), '#f0c34a', M4(SH.x0 + 1.45 + s2 * .085, ty + .2, tz, 0, 0, s2 * -Math.PI / 2), 'gold', 1, 1.1);
    // robot de juguete
    const rb = M4(SH.x0 + 2.2, ty, tz, -.3), rc = '#35d0c0';
    s.add(rbox(.15, .16, .1, .02), rc, rb.clone().multiply(M4(0, .17, 0)), 'plastic', .8, 1.1).add(rbox(.13, .1, .1, .025), '#f4efe4', rb.clone().multiply(M4(0, .31, 0)), 'plastic', .85, 1.1).add(rbox(.09, .035, .01, .01), '#17122a', rb.clone().multiply(M4(0, .315, .052)), 'gloss', 1, 1);
    for (const s2 of [-1, 1]) { s.add(rbox(.045, .09, .06, .015), '#ff5b35', rb.clone().multiply(M4(s2 * .04, .045, 0)), 'plastic', .8, 1.1).add(rbox(.035, .13, .05, .015), '#ffd23f', rb.clone().multiply(M4(s2 * .1, .16, 0, 0, 0, s2 * .2)), 'plastic', .8, 1.1); }
    s.cyl(.004, .004, .07, 5, '#d8d5e0', SH.x0 + 2.2, ty + .39, tz, 'metal', 1, 1).add(ellipsoid(.014, .014, .014, 6, 5), '#ff3b30', M4(SH.x0 + 2.2, ty + .43, tz), 'glow', 1.6, 1.6);
    // globo terráqueo
    s.add(lathe([[.07, 0], [.07, .015], [.012, .03], [.012, .07]], 12), '#3a2014', M4(SH.x0 + 2.95, ty, tz), 'wood', 1, 1).add(ellipsoid(.11, .11, .11, 16, 12), '#3f7fd8', M4(SH.x0 + 2.95, ty + .18, tz, 0, 0, .4), 'gloss', .7, 1.15);
    for (const [a, b, r] of [[.5, .4, .05], [2.2, -.2, .06], [3.6, .5, .04], [4.6, 0, .055]]) s.add(ellipsoid(r, r * .7, .012, 7, 5), '#3fae4a', M4(SH.x0 + 2.95 + Math.sin(a) * .105 * Math.cos(b), ty + .18 + Math.sin(b) * .105, tz + Math.cos(a) * .105 * Math.cos(b), a, -b), 'matte', 1, 1.1);
    // lámpara de lava
    const lv = SH.x0 + 3.55;
    s.add(lathe([[.06, 0], [.045, .1], [.04, .1]], 12), '#c9c5d0', M4(lv, ty, tz), 'metal', 1, 1).add(lathe([[.04, 0], [.055, .12], [.03, .32], [.0001, .32]], 12), '#ff4fa0', M4(lv, ty + .1, tz), 'glow', .8, 1.5).add(lathe([[.03, 0], [.02, .06], [.0001, .06]], 12), '#c9c5d0', M4(lv, ty + .42, tz), 'metal', 1, 1);
    // cajas de juegos de pie
    [['#ff5b35', .0], ['#ffd23f', .03], ['#7a4be6', -.04], ['#f4efe4', .02], ['#35d0c0', .2]].forEach(([c, r], i) => s.add(rbox(.05, .3 - (i % 2) * .03, .2, .006), c, M4(SH.x0 + 3.92 + i * .058, ty + .15 - (i % 2) * .015, tz, 0, 0, i === 4 ? .22 : 0), 'plastic', .78, 1.06));
    scene.add(s.build());
    const lg = glow(.7, '#ff4fa0', .3); add(lg, lv, ty + .26, tz + .06);
    for (let i = 0; i < 4; i++) { const g2 = glow(1.6, '#ffdca0', .07); add(g2, SH.x0 + SW * (i + .5) / 4, top + .1, SH.z + .16); }
    shadow(sx, SH.z + .3, SW * 1.15, 1.0, .8);
    // neón sobre la colección
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .5), new THREE.MeshBasicMaterial({transparent: true, map: tex(540, 100, (x, w, h) => { x.textBaseline = 'middle'; x.textAlign = 'center'; x.font = `66px ${FONT}`; x.lineJoin = 'round'; for (const [blur, lwd] of [[24, 8], [9, 5], [0, 3]]) { x.shadowBlur = blur; x.lineWidth = lwd; x.shadowColor = '#ff7a3a'; x.strokeStyle = blur ? '#ffb14a' : '#fff3c4'; x.textAlign = 'left'; const wa = x.measureText('gavilanbe').width, wb = x.measureText('64').width, x0 = (w - wa - wb - 26) / 2; x.strokeText('gavilanbe', x0, h / 2); x.shadowColor = '#35e0d0'; x.strokeStyle = blur ? '#55efe0' : '#eafffb'; x.strokeText('64', x0 + wa + 26, h / 2); } })}));
    neon.userData.neon = true; add(neon, sx + .1, 2.93, R.z0 + .02);
  }

  // ── cama bajo la ventana ──
  const f = new Kit(), bx = R.x0 + .64, bz0 = .32, bz1 = 2.56, bzc = (bz0 + bz1) / 2, bl = bz1 - bz0, bw = '#9a5e34';
  f.add(rbox(1.2, .16, bl, .03), bw, M4(bx, .24, bzc), 'wood', .62, 1.04);
  const head = ext([[-.62, 0], [.62, 0], [.62, .5], [.5, .68], [.2, .76], [-.2, .76], [-.5, .68], [-.62, .5]], .07, .015); f.add(head, bw, M4(bx, .12, bz1 - .01), 'wood', .6, 1.08);
  f.add(ext([[-.62, 0], [.62, 0], [.62, .28], [.4, .36], [-.4, .36], [-.62, .28]], .06, .015), bw, M4(bx, .12, bz0 + .01), 'wood', .6, 1.05);
  for (const sx of [-1, 1]) for (const z of [bz0 + .06, bz1 - .06]) f.add(lathe([[.03, 0], [.05, .12]], 8), '#6b3c1c', M4(bx + sx * .54, 0, z), 'wood', .7, 1);
  f.add(loft([{y: .32, pts: squircle(1.12, bl - .1, 7, 28)}, {y: .47, pts: squircle(1.14, bl - .08, 7, 28)}, {y: .52, pts: squircle(1.08, bl - .14, 7, 28)}]), '#f6ead2', M4(bx, 0, bzc), 'fabric', .78, 1.04);
  f.add(loft([{y: 0, pts: squircle(.74, .44, 4, 20)}, {y: .06, pts: squircle(.84, .52, 3, 20)}, {y: .12, pts: squircle(.74, .44, 2.6, 20)}, {y: .145, pts: squircle(.5, .26, 2.4, 20)}]), '#fff8ea', M4(bx, .52, bz1 - .4, .06), 'fabric', .82, 1.05);
  // edredón con pliegues que cae por el lado
  const dvL = bl * .64, dv = new THREE.PlaneGeometry(1.5, dvL, 20, 16); { const p = dv.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i), over = Math.max(0, Math.abs(u) - .57); p.setZ(i, .04 + Math.sin(u * 8 + v * 3) * .012 + Math.sin(v * 11 + u * 2) * .009 + Math.exp(-Math.pow((v - dvL / 2 + .05) / .07, 2)) * .03 - over * 1.6 - Math.pow(over, 2) * 2); p.setX(i, Math.sign(u) * Math.min(Math.abs(u), .57 + over * .25)); } dv.computeVertexNormals(); } dv.rotateX(-Math.PI / 2);
  const duvet = new THREE.Mesh(dv, std({side: THREE.DoubleSide, roughness: 1, map: tex(128, 128, (x, w, h) => { x.fillStyle = '#3b2a78'; x.fillRect(0, 0, w, h); const tri = (a, b, c2) => { x.fillStyle = c2; x.beginPath(); x.moveTo(a, b - 9); x.lineTo(a + 9, b + 7); x.lineTo(a - 9, b + 7); x.fill(); }; tri(20, 24, '#ffd23f'); tri(88, 92, '#ffd23f'); tri(98, 22, '#ff5b8d'); x.lineWidth = 5; x.lineCap = 'round'; x.strokeStyle = '#35d0c0'; x.beginPath(); x.moveTo(46, 30); x.quadraticCurveTo(55, 16, 64, 30); x.quadraticCurveTo(73, 44, 82, 30); x.stroke(); x.strokeStyle = '#ff5b8d'; x.beginPath(); x.moveTo(10, 84); x.lineTo(20, 72); x.lineTo(30, 84); x.lineTo(40, 72); x.stroke(); x.strokeStyle = '#ffd23f'; x.beginPath(); x.moveTo(56, 106); x.lineTo(76, 100); x.stroke(); x.fillStyle = '#ff5b35'; x.beginPath(); x.arc(66, 66, 7, 0, 7); x.fill(); x.fillStyle = '#35d0c0'; x.beginPath(); x.arc(112, 60, 5, 0, 7); x.fill(); }, {repeat: [2.4, 2.4]})}));
  duvet.castShadow = duvet.receiveShadow = true; add(duvet, bx, .5, bz0 + dvL / 2 + .04);
  // revista abierta sobre la cama
  f.add(rbox(.3, .008, .2, .003), '#f4efe4', M4(bx + .1, .565, bz0 + .7, .5), 'matte', 1, 1).add(rbox(.14, .004, .19, .002), '#ff5b35', M4(bx + .04, .571, bz0 + .665, .5), 'matte', 1, 1);
  // ── mesilla: cajones, lamparita, despertador y lata ──
  const nx = R.x0 + .44, nz = -.14;
  f.add(rbox(.62, .5, .52, .02), '#a86a3c', M4(nx, .29, nz), 'wood', .62, 1.05);
  for (const y of [.4, .18]) f.add(rbox(.52, .17, .03, .012), '#b87644', M4(nx, y + .02, nz + .262), 'wood', .8, 1.05).add(lathe([[.012, 0], [.024, .02], [.0001, .026]], 8), '#ffd23f', M4(nx, y + .02, nz + .277, 0, Math.PI / 2), 'gold', 1, 1.1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.add(lathe([[.02, 0], [.03, .05]], 6), '#6b3c1c', M4(nx + sx * .26, 0, nz + sz * .21), 'wood', 1, 1);
  const lx = nx - .1, lz = nz - .08;
  f.add(lathe([[.1, 0], [.1, .015], [.03, .04], [.022, .08], [.04, .16], [.03, .24], [.014, .27], [.014, .34]], 14), '#35d0c0', M4(lx, .54, lz), 'gloss', .8, 1.15);
  f.add(loft([{y: 0, pts: squircle(.4, .4, 2, 18)}, {y: .26, pts: squircle(.22, .22, 2, 18)}], {capBottom: false, capTop: false}), '#ffd9a0', M4(lx, .84, lz), 'glow', 1.25, 1.02);
  f.add(rbox(.2, .12, .09, .02), '#ff5b35', M4(nx + .14, .6, nz + .12, .3), 'plastic', .8, 1.1).box(.14, .06, .006, '#0c140f', nx + .156, .605, nz + .164, 'gloss', 1, 1, .3);
  f.add(lathe([[.033, 0], [.033, .115], [.028, .122], [.0001, .122]], 12), '#ff3b30', M4(nx + .2, .54, nz - .12), 'metal', .9, 1.1).add(lathe([[.034, .035], [.034, .085]], 12), '#f4efe4', M4(nx + .2, .54, nz - .12), 'plastic', 1, 1);
  // ── puf de dos colores ──
  for (let i = 0; i < 6; i++) { const g2 = new THREE.SphereGeometry(.66, 5, 10, i / 6 * Math.PI * 2, Math.PI / 3), p = g2.attributes.position; for (let j = 0; j < p.count; j++) { const y = p.getY(j), r2 = Math.hypot(p.getX(j), p.getZ(j)); p.setY(j, y < 0 ? y * .5 : y * .8 - Math.max(0, .36 - r2) * .55); } g2.computeVertexNormals(); f.add(g2, i % 2 ? '#35c0b4' : '#2aa89e', M4(1.8, .33, 1.55, .4), 'fabric', .5, 1.16); }
  f.add(ellipsoid(.05, .02, .05, 8, 4), '#ffd23f', M4(1.8, .665, 1.55), 'fabric', 1, 1);
  // ── monopatín ──
  const sk = M4(-.55, 0, 2.25, 1.15);
  f.add(ext([[-.4, .02], [-.34, 0], [.34, 0], [.4, .02], [.43, .05], [.4, .045], [.34, .025], [-.34, .025], [-.4, .045], [-.43, .05]], .2, .006), '#ff5b8d', sk.clone().multiply(M4(0, .095, 0)), 'wood', .8, 1.1);
  for (const sx of [-1, 1]) { f.add(rbox(.05, .04, .15, .01), '#c9c5d0', sk.clone().multiply(M4(sx * .26, .075, 0)), 'metal', 1, 1); for (const sz of [-1, 1]) f.add(cyl(.04, .04, .04, 12), '#ffd23f', sk.clone().multiply(M4(sx * .26, .04, sz * .095, 0, Math.PI / 2)), 'rubber', .8, 1.1); }
  // ── balón, zapatillas, mochila ──
  f.add(new THREE.IcosahedronGeometry(.17, 2), '#ff8a3a', M4(.55, .17, 2.3), 'rubber', .6, 1.15);
  for (const [dx, ry] of [[0, .3], [.2, .7]]) { const m = M4(-1.55 + dx, 0, 2.35 - dx * .5, ry); f.add(loft([{y: 0, pts: squircle(.11, .28, 2.6, 16)}, {y: .05, pts: squircle(.115, .29, 2.6, 16)}], {}), '#f4efe4', m, 'rubber', 1, 1).add(loft([{y: .05, pts: squircle(.105, .27, 2.6, 16)}, {y: .1, pts: squircle(.095, .2, 2.4, 16), dz: -.03}, {y: .15, pts: squircle(.085, .12, 2.2, 16), dz: -.07}]), '#ff3b30', m, 'fabric', .8, 1.1); }
  const bp = M4(2.75, 0, 1.0, -.5);
  f.add(loft([{y: 0, pts: squircle(.42, .26, 3.4, 20)}, {y: .3, pts: squircle(.42, .27, 3.4, 20)}, {y: .5, pts: squircle(.36, .22, 3, 20)}, {y: .56, pts: squircle(.2, .12, 2.6, 20)}]), '#7a4be6', bp, 'fabric', .6, 1.1).add(rbox(.3, .2, .06, .03), '#ffd23f', bp.clone().multiply(M4(0, .17, .14)), 'fabric', .8, 1.05).add(new THREE.TorusGeometry(.06, .012, 5, 10, Math.PI), '#17122a', bp.clone().multiply(M4(0, .55, 0)), 'fabric', 1, 1);
  // ── planta de hojas grandes ──
  const px = 2.74, pzz = -.1;
  f.add(lathe([[.13, 0], [.19, .3], [.2, .3], [.2, .34], [.17, .34]], 14), '#e06a3c', M4(px, 0, pzz), 'matte', .7, 1.1).cyl(.165, .165, .02, 12, '#3a2014', px, .31, pzz, 'matte', 1, 1);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .3, len = .5 + (i % 3) * .14, tilt = .5 + (i % 2) * .28, leaf = ellipsoid(.13, .012, len / 2, 8, 6); f.add(tube([[0, 0, 0], [0, len * .5, .06], [0, len * .8, .2]], .012, 5, 6), '#2a8a3c', M4(px, .32, pzz, a), 'matte', .7, 1.1).add(leaf, i % 2 ? '#3fae4a' : '#2f9a44', M4(px + Math.sin(a) * (.2 + len * .28), .32 + len * .8 + Math.cos(tilt) * .1, pzz + Math.cos(a) * (.2 + len * .28), a, -tilt), 'matte', .6, 1.25); }
  // ── revistas y cajas de juegos en el suelo ──
  [['#f4efe4', .6], ['#ffd23f', .25], ['#35d0c0', -.2]].forEach(([c, r], i) => f.add(rbox(.34, .014, .46, .004), c, M4(.5 + i * .05, .008 + i * .015, 1.05 + i * .06, r), 'matte', 1, 1));
  [['#ff5b35', 0], ['#ffd23f', .12], ['#7a4be6', -.08], ['#35d0c0', .15]].forEach(([c, r], i) => f.add(rbox(.44, .06, .32, .008), c, M4(2.72, .03 + i * .061, 2.3, r), 'plastic', .78, 1.06));
  // ── regleta y enchufe ──
  f.add(rbox(.4, .04, .1, .012), '#f4efe4', M4(-2.72, .02, -.72, 1.2), 'plastic', .9, 1.05).box(.02, .012, .03, '#ff4a3a', -2.66, .042, -.58, 'glow', 2, 2);
  // ── pared: reloj, banderín, estrellitas que brillan ──
  f.add(cyl(.2, .2, .04, 20), '#ff5b35', M4(R.x0 + .03, 2.62, -1.0, 0, 0, Math.PI / 2), 'plastic', .9, 1.1).add(cyl(.17, .17, .045, 20), '#fff8ea', M4(R.x0 + .034, 2.62, -1.0, 0, 0, Math.PI / 2), 'matte', 1, 1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; f.box(.006, .02 + (i % 3 ? 0 : .012), .008, '#17122a', R.x0 + .058, 2.62 + Math.cos(a) * .14, -1.0 + Math.sin(a) * .14, 'matte', 1, 1, 0, a); }
  f.add(ext([[0, .16], [0, -.16], [.62, 0]], .006, 0), '#7a4be6', M4(R.x0 + .012, 2.08, -2.2, Math.PI / 2, 0, 0), 'fabric', 1, 1);
  const stars = [[2.75, -.4], [2.88, .3], [2.62, .1], [2.9, -1.6], [2.7, 2.3], [2.86, 2.5], [2.6, -2.2]];
  for (const [y, z] of stars) f.add(ext(Array.from({length: 10}, (_, i) => { const a = i / 10 * 6.283 + .3, r = i % 2 ? .016 : .04; return [Math.cos(a) * r, Math.sin(a) * r]; }), .004, 0), '#d8ffb0', M4(R.x0 + .006, y, z, Math.PI / 2), 'glow', 1.3, 1.3);
  scene.add(f.build());
  const lampGlow = glow(1.1, '#ffc27a', .3); lampGlow.rotation.y = Math.PI / 4; add(lampGlow, lx + .12, .98, lz + .12);
  // agujas del reloj, con la hora de verdad
  const hand = (len, wd, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.006, len, wd).translate(0, len / 2 - .012, 0), new THREE.MeshBasicMaterial({color: c})); add(m, R.x0 + .064, 2.62, -1.0); return m; };
  const hands = [hand(.085, .016, '#17122a'), hand(.125, .011, '#17122a'), hand(.135, .005, '#ff3b30')];
  // pósteres con cinta, con carátulas de los juegos
  const poster = (name, x, y, z, ry, w, rz = 0) => { const g2 = games.find(q => q.name === name); if (!g2 || !g2.thumb) return; const t = new THREE.TextureLoader().load(g2.thumbL); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const h2 = w / 1.6, grp = new THREE.Group(); const paperM = new THREE.Mesh(new THREE.PlaneGeometry(w + .05, h2 + .05), std({color: '#fff8ea', roughness: .9})), art = new THREE.Mesh(new THREE.PlaneGeometry(w, h2), std({map: t, roughness: .7, emissive: '#fff', emissiveMap: t, emissiveIntensity: .22})); art.position.z = .003; grp.add(paperM, art); for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(.1, .035), new THREE.MeshBasicMaterial({color: '#ffe9a8', transparent: true, opacity: .85})); tp.position.set(sx * (w / 2), sy * (h2 / 2), .005); tp.rotation.z = sx * sy * -.7; grp.add(tp); } grp.rotation.set(0, ry, rz); paperM.receiveShadow = true; add(grp, x, y, z); };
  poster('ceba', R.x0 + .01, 2.05, -.3, Math.PI / 2, .92, .03); poster('westieware', R.x0 + .01, 2.22, -1.62, Math.PI / 2, .64, -.05); poster('nagu-gavi', -2.2, 2.5, R.z0 + .01, 0, .9, .03); poster('invoca', R.x0 + .01, 2.72, 2.4, Math.PI / 2, .5, .06);
  shadow(bx + .12, bzc, 2.0, bl + .7, .9); shadow(nx, nz, 1.2, 1.1, .8); shadow(1.8, 1.55, 1.9, 1.9, .9); shadow(-.55, 2.25, 1.2, .7, .6, 1.15); shadow(.55, 2.3, .55, .55, .8); shadow(2.75, 1.0, .9, .8, .8); shadow(px, pzz, .9, .9, .75); shadow(2.72, 2.3, .9, .75, .8); shadow(-1.45, 2.3, .7, .6, .6);
  // motas de polvo en el rayo de sol
  const n = 90, pos = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([rnd(), rnd(), rnd(), rnd()]);
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({color: '#ffd9a0', size: .028, map: tex(16, 16, x => { const g2 = x.createRadialGradient(8, 8, 0, 8, 8, 8); g2.addColorStop(0, '#fff'); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(0, 0, 16, 16); }), transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending}));
  scene.add(dust);
  function anim(t) {
    for (let i = 0; i < n; i++) { const [a, b, c, d] = seed[i], u = (a + t * .012 * (.4 + d)) % 1; pos[i * 3] = R.x0 + .15 + u * 3.2; pos[i * 3 + 1] = WIN.y0 + b * (WIN.y1 - WIN.y0) - u * 1.75 + Math.sin(t * .5 + i) * .03; pos[i * 3 + 2] = WIN.z0 + c * (WIN.z1 - WIN.z0) - u * 1.0 + Math.cos(t * .4 + i) * .03; }
    dust.geometry.attributes.position.needsUpdate = true;
    const now = new Date(), s = now.getSeconds() + now.getMilliseconds() / 1000, m = now.getMinutes() + s / 60, h = now.getHours() % 12 + m / 60;
    [h / 12, m / 60, Math.floor(s) / 60].forEach((v, i) => { hands[i].rotation.x = -v * Math.PI * 2; });
  }
  return {carts, pickables, anim, lamp: V(lx + .25, 1.02, lz + .25), sun: {WIN}};
}
