// La consola gavilanbe 64 y su mando de tres cuernos. Frente hacia +z, apoyadas en y = 0.
// Son grupos con piezas sueltas para animarlas: tapas de la boca, teclas, aro de luz y resplandor.
import {THREE, V, M4, Kit, MATS, loft, lathe, squircle, scaleRing, rbox, cyl, ellipsoid, ext, rrect, decal, glow, tint, FONT, MONO} from './kit.js';

const LOGO = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'];
export const SLOT = V(0, .318, -.06);                 // boca del cartucho (centro, a ras)
export const PORT1 = V(-.27, .085, .44), REAR = [V(-.2, .1, -.42), V(.22, .1, -.42)];
const piece = (geo, hex, mat, k0, k1) => { const m = new THREE.Mesh(tint(geo.index ? geo.toNonIndexed() : geo, hex, k0, k1), MATS[mat]); m.castShadow = true; return m; };

export function makeConsole() {
  const k = new Kit(), body = '#3b3948', deck = '#474555', dark = '#17161d';
  // carcasa: planta con dos lóbulos delante, faldón, cintura con junta y lomo suave
  const warp = a => 1 + .12 * Math.exp(-Math.pow((a - 1.02) / .33, 2)) + .12 * Math.exp(-Math.pow((a - (Math.PI - 1.02)) / .33, 2));
  const plan = squircle(1.12, .82, 3.2, 64, warp), R = (y, s) => ({y, pts: scaleRing(plan, s)});
  k.add(loft([R(0, .9), R(.012, .955), R(.03, .975)]), '#24232d', M4(), 'plastic', .8, 1);                       // faldón
  k.add(loft([R(.03, .985), R(.05, 1), R(.1, 1)], {capBottom: false}), body, M4(), 'shell', .62, .98);
  k.add(loft([R(.1, .99), R(.109, .99)], {capTop: false, capBottom: false}), '#0e0d13', M4(), 'matte', 1, 1);       // junta
  k.add(loft([R(.109, 1), R(.15, .986), R(.183, .936), R(.208, .832), R(.222, .672), R(.229, .46), R(.231, .2)]), deck, M4(), 'shell', .9, 1.14);
  // lomo central con su canal alrededor
  const hp = squircle(.6, .5, 4.5, 40), H = (y, s) => ({y, pts: scaleRing(hp, s), dz: -.06});
  k.add(loft([H(.2, 1.07), H(.224, 1.07)], {capBottom: false}), '#101016', M4(), 'matte', 1, 1);
  k.add(loft([H(.2, 1.02), H(.228, 1), H(.288, .957), H(.306, .9), H(.314, .8), H(.316, .58)]), '#4e4c5e', M4(), 'shell', .82, 1.14);
  // boca: embellecedor brillante, hueco y contactos al fondo
  k.add(ext(rrect(.48, .16, .034), .01, .004, {holes: [rrect(.405, .088, .012)]}), '#22212b', M4(0, .319, -.06, 0, -Math.PI / 2), 'candy', 1, 1);
  k.box(.4, .05, .085, '#040406', 0, .288, -.06, 'matte', 1, 1);
  for (let i = 0; i < 18; i++) k.box(.012, .004, .05, '#f0c34a', -.187 + i * .022, .2655, -.06, 'gold', 1, 1.1);
  // tapa de expansión delante del lomo, con estrías
  k.add(rbox(.3, .012, .11, .008), '#3f3d4d', M4(0, .224, .245, 0, .13), 'shell', .9, 1.1);
  for (let i = 0; i < 5; i++) k.box(.2, .004, .006, '#22212b', 0, .2325 - i * .0016, .215 + i * .013, 'plastic', 1, 1, 0, .13);
  // cazoletas de las teclas
  const BTN = [[-1, '#ff5b35', 'power'], [1, '#b9f02a', 'reset']], bm = sx => M4(sx * .37, .2, .1, sx * -.12, .06, sx * -.2);
  for (const [sx] of BTN) k.add(loft([{y: 0, pts: squircle(.245, .168, 3, 26)}, {y: .022, pts: squircle(.245, .168, 3, 26)}, {y: .027, pts: squircle(.222, .145, 3, 26)}]), '#1b1a22', bm(sx), 'candy', 1, 1);
  // rejillas de ventilación y aletas traseras
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) k.box(.012, .012, .2 - i * .018, dark, sx * (.345 + i * .027), .224 - i * .0052, -.2, 'matte', 1, 1, 0, 0, sx * -.2);
  for (let i = 0; i < 9; i++) k.box(.03, .014, .05, '#2a2933', -.2 + i * .05, .2, -.345, 'plastic', .9, 1.1, 0, -.5);
  // costillas de agarre en los costados
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) k.add(rbox(.02, .05, .022, .006, 1), '#22212b', M4(sx * .553, .068, -.13 + i * .055, 0, 0, 0), 'rubber', 1, 1);
  // frontal: barra con los cuatro puertos, cada uno con su aro metálico
  k.add(rbox(.82, .096, .08, .032), '#292833', M4(0, .084, .395), 'shell', .75, 1.1);
  for (let i = 0; i < 4; i++) {
    const px = -.27 + i * .18;
    k.add(ext(rrect(.14, .078, .026), .008, .003, {holes: [rrect(.122, .062, .02)]}), '#b9b6c6', M4(px, .084, .436), 'metal', .9, 1.1);
    k.add(ext(rrect(.125, .066, .022), .012, .003), '#0c0c11', M4(px, .084, .43), 'plastic', 1, 1);
    k.add(ext([[-.036, -.016], [.036, -.016], [.036, .008], [.022, .02], [-.022, .02], [-.036, .008]], .01, .002), '#6f6c7c', M4(px, .083, .437), 'plastic', .8, 1.1);
    for (let j = 0; j < 3; j++) k.cyl(.004, .004, .012, 6, '#f0c34a', px - .014 + j * .014, .083, .44, 'gold', 1, 1, Math.PI / 2);
    for (let j = 0; j <= i; j++) k.cyl(.0045, .0045, .004, 6, '#c9c6d6', px - i * .007 + j * .014, .144, .428, 'plastic', 1, 1, Math.PI / 2);
  }
  // patas de goma y conectores traseros
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(.05, .055, .012, 10, '#0c0c11', sx * .4, .004, sz * .26, 'rubber', 1, 1);
  for (const p of REAR) k.add(rbox(.11, .06, .04, .012), '#0c0c11', M4(p.x, p.y, p.z + .02), 'plastic', 1, 1);
  // emblema: la G de cuatro colores sobre peana con aro cromado
  const em = M4(0, .2335, .335, 0, .2);
  k.add(cyl(.072, .078, .01, 24), '#c9c6d6', em, 'metal', .9, 1.1).add(cyl(.062, .066, .016, 24), '#17161d', em, 'candy', 1, 1);
  LOGO.forEach((c, i) => { const t = new THREE.TorusGeometry(.036, .012, 7, 12, 1.42); t.rotateZ(-.35 + i * 1.42); t.rotateX(-Math.PI / 2); k.add(t, c, em.clone().multiply(M4(0, .014, 0)), 'candy', .9, 1.2); });
  k.add(rbox(.04, .015, .021, .005), LOGO[0], em.clone().multiply(M4(.02, .014, 0)), 'candy', .9, 1.2);
  // rótulos
  const txt = (s, w, col = 'rgba(232,228,242,.8)') => decal(w, .03, 1400, (x, cw, ch) => { x.fillStyle = col; x.font = `700 ${ch * .62}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cw / 2, ch / 2); });
  k.mesh(txt('POWER', .12), M4(-.37, .2105, .232, .12, -Math.PI / 2 + .34, 0));
  k.mesh(txt('RESET', .12), M4(.37, .2105, .232, -.12, -Math.PI / 2 + .34, 0));
  k.mesh(decal(.3, .05, 1100, (x, cw, ch) => { x.font = `${ch * .7}px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#e8e4f2'; x.fillText('gavilanbe', 4, ch / 2); const w1 = x.measureText('gavilanbe ').width; x.fillStyle = '#ff5b35'; x.fillText('64', 4 + w1, ch / 2); }), M4(0, .2585, .197, 0, -.1));
  const grp = k.build(), parts = {};
  // ── piezas móviles ──
  // tapas de la boca, abisagradas en sus bordes largos
  parts.flaps = [-1, 1].map(s => { const g = new THREE.BoxGeometry(.396, .005, .0435); g.translate(0, 0, -s * .0218); const m = piece(g, '#1d1c25', 'candy', 1, 1); m.position.set(0, .31, -.06 + s * .0435); m.userData.open = -s * 1.32; grp.add(m); return m; });
  // teclas POWER y RESET
  for (const [sx, c, name] of BTN) {
    const g = new THREE.Group(), cap = piece(loft([{y: .02, pts: squircle(.2, .125, 3, 26)}, {y: .042, pts: squircle(.2, .125, 3, 26)}, {y: .052, pts: squircle(.186, .111, 3, 26)}, {y: .058, pts: squircle(.15, .08, 3, 26)}]), c, 'candy', .82, 1.2);
    g.add(cap); g.applyMatrix4(bm(sx)); g.userData.home = g.position.clone(); g.userData.up = V(0, 1, 0).applyQuaternion(g.quaternion); grp.add(g); parts[name] = g;
  }
  // aro de luz de POWER y piloto del frontal
  const ringGeo = loft([{y: .0265, pts: squircle(.232, .155, 3, 26)}, {y: .0285, pts: squircle(.214, .137, 3, 26)}], {capTop: false, capBottom: false});
  parts.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({color: '#2a1512', side: THREE.DoubleSide})); parts.ring.applyMatrix4(bm(-1)); grp.add(parts.ring);
  parts.pilot = new THREE.Mesh(new THREE.BoxGeometry(.03, .014, .01), new THREE.MeshBasicMaterial({color: '#2a1512'})); parts.pilot.position.set(.378, .118, .434); grp.add(parts.pilot);
  parts.led = glow(.3, '#ff4a3a', 0); parts.led.position.set(.378, .118, .452); grp.add(parts.led);
  parts.powerGlow = glow(.5, '#ff5b35', 0); parts.powerGlow.rotation.x = -Math.PI / 2; parts.powerGlow.position.set(-.37, .262, .1); grp.add(parts.powerGlow);
  // luz interior de la boca y resplandor bajo la carcasa
  parts.mouth = glow(.5, '#ffb070', 0); parts.mouth.rotation.x = -Math.PI / 2; parts.mouth.scale.set(1, .3, 1); parts.mouth.position.set(0, .322, -.06); grp.add(parts.mouth);
  parts.under = glow(2.5, '#ff5b35', 0); parts.under.rotation.x = -Math.PI / 2; parts.under.position.set(0, .016, 0); parts.under.renderOrder = 2; grp.add(parts.under);
  grp.userData.parts = parts;
  return grp;
}

// el mando: tres cuernos, palanca, cruceta, A y B, cuatro botones pequeños, gatillos y START
export function makePad() {
  const k = new Kit(), g = '#e2ded4', d = '#2f2e38';
  k.add(loft([{y: 0, pts: squircle(.62, .22, 2.6, 32)}, {y: .03, pts: squircle(.7, .3, 2.8, 32)}, {y: .072, pts: squircle(.7, .3, 2.8, 32)}, {y: .095, pts: squircle(.64, .25, 2.8, 32)}, {y: .104, pts: squircle(.5, .16, 2.6, 32)}]), g, M4(0, .012, 0), 'shell', .74, 1.08);
  const grip = (x, len, ry, r = .074) => k.add(loft([{y: 0, pts: squircle(r * 2, .11, 2.4, 18)}, {y: len * .5, pts: squircle(r * 1.8, .105, 2.2, 18)}, {y: len * .85, pts: squircle(r * 1.55, .095, 2, 18)}, {y: len, pts: squircle(r * 1.15, .07, 2, 18)}, {y: len * 1.06, pts: squircle(r * .5, .03, 2, 18)}]), g, M4(x, .06, .07, ry, Math.PI / 2 + .1), 'shell', .74, 1.08);
  grip(-.27, .27, -.26); grip(0, .32, 0, .066); grip(.27, .27, .26);
  for (const sx of [-1, 1]) k.add(rbox(.17, .034, .06, .016), '#a9a6b0', M4(sx * .24, .075, -.125, sx * -.16), 'shell', .8, 1.1);
  k.cyl(.078, .082, .01, 20, '#cfcbc1', -.24, .114, 0, 'plastic', .95, 1);
  k.add(ext([[-.016, -.052], [.016, -.052], [.016, -.016], [.052, -.016], [.052, .016], [.016, .016], [.016, .052], [-.016, .052], [-.016, .016], [-.052, .016], [-.052, -.016], [-.016, -.016]], .018, .005), d, M4(-.24, .127, 0, 0, -Math.PI / 2), 'shell', .9, 1.15);
  k.add(lathe([[.06, 0], [.06, .012], [.05, .02], [.036, .02]], 8), '#cfcbc1', M4(0, .11, .15), 'plastic', .95, 1.05);
  k.add(lathe([[.034, 0], [.03, .012], [.014, .02], [.012, .05]], 12), d, M4(0, .116, .15), 'rubber', .9, 1.1);
  k.add(lathe([[.012, 0], [.034, .004], [.037, .012], [.03, .019], [.02, .021], [.02, .017], [.008, .017], [.0001, .019]], 16), '#b9b6c2', M4(0, .166, .15), 'rubber', .9, 1.15);
  const btn = (x, z, r, c, hgt = .018) => k.add(lathe([[r, 0], [r, hgt * .6], [r * .82, hgt], [.0001, hgt * 1.08]], 16), c, M4(x, .112, z), 'candy', .85, 1.2);
  btn(.2, .045, .034, '#ff5b35'); btn(.135, -.02, .034, '#b9f02a');
  for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) btn(.275 + dx * .042, -.06 + dz * .042, .0185, '#7a4be6', .014);
  btn(0, -.03, .02, '#ff3b30', .012);
  k.add(cyl(.02, .014, .05, 8), d, M4(0, .06, -.165, 0, Math.PI / 2), 'rubber', 1, 1);
  k.mesh(decal(.16, .028, 1500, (x, cw, ch) => { x.fillStyle = 'rgba(40,38,50,.75)'; x.font = `${ch * .72}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('gavilanbe 64', cw / 2, ch / 2); }), M4(0, .1168, -.085, 0, -Math.PI / 2));
  return k.build();
}
export const PAD_CABLE = V(0, .06, -.19);

export function lab(games, q) {
  const grp = new THREE.Group(), c = makeConsole(); grp.add(c);
  const p = c.userData.parts; p.ring.material.color.set('#ff5b35'); p.pilot.material.color.set('#ff4a3a'); p.led.material.opacity = .8; p.under.material.opacity = .25; p.flaps.forEach(f => { f.rotation.x = q.get('open') ? f.userData.open : 0; });
  if (q.get('pad') !== '0') { const pad = makePad(); pad.position.set(-.75, 0, .75); pad.rotation.y = -.5; grp.add(pad); }
  return grp;
}
