// La consola gavilanbe 64 y su mando de tres cuernos. Frente hacia +z, apoyadas en y = 0.
import {THREE, V, M4, Kit, loft, lathe, squircle, scaleRing, rbox, cyl, ellipsoid, ext, rrect, decal, glow, tube, FONT, MONO} from './kit.js';

const LOGO = ['#ff5b35', '#ffd23f', '#35d0c0', '#7a4be6'];
export const SLOT = V(0, .318, -.06);                 // boca del cartucho (centro, a ras)
export const PORT1 = V(-.27, .085, .44), REAR = [V(-.2, .1, -.42), V(.22, .1, -.42)];

export function makeConsole(base = M4()) {
  const k = new Kit(base), body = '#3c3a48', deck = '#454352', dark = '#1b1a22';
  // carcasa: planta con dos lóbulos delante, cintura y lomo suave
  const warp = a => 1 + .12 * Math.exp(-Math.pow((a - 1.02) / .33, 2)) + .12 * Math.exp(-Math.pow((a - (Math.PI - 1.02)) / .33, 2));
  const plan = squircle(1.12, .82, 3.2, 56, warp), R = (y, s) => ({y, pts: scaleRing(plan, s)});
  k.add(loft([R(0, .9), R(.012, .965), R(.04, 1), R(.1, 1)]), body, M4(), 'plastic', .5, .95);
  k.add(loft([R(.1, .992), R(.108, .992)], {capTop: false, capBottom: false}), '#15141a', M4(), 'plastic', 1, 1);   // junta
  k.add(loft([R(.108, 1), R(.15, .985), R(.183, .935), R(.208, .83), R(.222, .67), R(.229, .46), R(.231, .2)]), deck, M4(), 'plastic', .88, 1.16);
  // lomo central
  const hp = squircle(.6, .5, 4.5, 36), H = (y, s) => ({y, pts: scaleRing(hp, s), dz: -.06});
  k.add(loft([H(.2, 1.02), H(.225, 1), H(.286, .955), H(.305, .9), H(.314, .8), H(.316, .6)]), '#4b4959', M4(), 'plastic', .8, 1.15);
  // boca: embellecedor, hueco y dos tapas con muelle
  k.add(ext(rrect(.47, .15, .03), .008, .003, {holes: [rrect(.405, .088, .012)]}), '#2a2933', M4(0, .318, -.06, 0, -Math.PI / 2), 'gloss', 1, 1);
  k.box(.4, .03, .085, '#050508', 0, .3, -.06, 'matte', 1, 1);
  for (const s of [-1, 1]) k.box(.39, .004, .042, '#15141a', 0, .309, -.06 + s * .021, 'plastic', 1, 1, 0, s * .22);
  // tapa de expansión delante del lomo, con estrías
  k.add(rbox(.3, .012, .11, .008), '#403e4d', M4(0, .224, .245, 0, .13), 'plastic', .9, 1.1);
  for (let i = 0; i < 5; i++) k.box(.2, .004, .006, '#2a2933', 0, .2325 - i * .0016, .215 + i * .013, 'plastic', 1, 1, 0, .13);
  // POWER y RESET: dos teclas ovaladas en su cazoleta
  for (const [sx, c] of [[-1, '#ff5b35'], [1, '#b9f02a']]) {
    const m = M4(sx * .37, .2, .1, sx * -.12, .06, sx * -.2);
    k.add(loft([{y: 0, pts: squircle(.235, .16, 3, 22)}, {y: .022, pts: squircle(.235, .16, 3, 22)}, {y: .026, pts: squircle(.215, .14, 3, 22)}]), '#22212a', m, 'plastic', 1, 1);
    k.add(loft([{y: .02, pts: squircle(.2, .125, 3, 22)}, {y: .04, pts: squircle(.2, .125, 3, 22)}, {y: .05, pts: squircle(.185, .11, 3, 22)}, {y: .055, pts: squircle(.15, .08, 3, 22)}]), c, m, 'gloss', .82, 1.2);
  }
  // rejillas de ventilación a los lados del lomo
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) k.box(.012, .01, .2 - i * .018, dark, sx * (.345 + i * .027), .224 - i * .0052, -.2, 'matte', 1, 1, 0, 0, sx * -.2);
  // frontal: barra con los cuatro puertos de mando y el piloto
  k.add(rbox(.82, .092, .08, .03), '#2b2a35', M4(0, .084, .395), 'plastic', .75, 1.1);
  for (let i = 0; i < 4; i++) {
    const px = -.27 + i * .18;
    k.add(ext(rrect(.125, .066, .022), .012, .003), '#101015', M4(px, .084, .434), 'plastic', 1, 1);
    k.add(ext([[-.036, -.016], [.036, -.016], [.036, .008], [.022, .02], [-.022, .02], [-.036, .008]], .01, .002), '#6f6c7c', M4(px, .083, .44), 'plastic', .8, 1.1);
    for (let j = 0; j < 3; j++) k.cyl(.004, .004, .012, 6, '#f0c34a', px - .014 + j * .014, .083, .442, 'gold', 1, 1, Math.PI / 2);
    for (let j = 0; j <= i; j++) k.cyl(.0045, .0045, .004, 6, '#a9a6b6', px - i * .007 + j * .014, .139, .43, 'plastic', 1, 1, Math.PI / 2);
  }
  k.box(.03, .014, .01, '#ff4a3a', .378, .118, .434, 'glow', 2, 2);
  // patas de goma y conectores traseros
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(.05, .055, .012, 10, '#101015', sx * .4, .004, sz * .26, 'rubber', 1, 1);
  for (const p of REAR) k.add(rbox(.11, .06, .04, .012), '#101015', M4(p.x, p.y, p.z + .02), 'plastic', 1, 1);
  // emblema: la G de cuatro colores, en relieve sobre su peana
  const em = M4(0, .2335, .385 - .05, 0, .2);
  k.add(cyl(.062, .068, .012, 20), '#22212a', em, 'gloss', 1, 1);
  LOGO.forEach((c, i) => { const t = new THREE.TorusGeometry(.036, .0115, 6, 10, 1.42); t.rotateZ(-.35 + i * 1.42 + Math.PI * 0); t.rotateX(-Math.PI / 2); k.add(t, c, em.clone().multiply(M4(0, .012, 0)), 'gloss', .9, 1.2); });
  k.add(rbox(.04, .014, .02, .005), LOGO[0], em.clone().multiply(M4(.02, .012, 0)), 'gloss', .9, 1.2);
  // rótulos
  const txt = (s, w, col = 'rgba(232,228,242,.8)') => decal(w, .03, 1400, (x, cw, ch) => { x.fillStyle = col; x.font = `700 ${ch * .62}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cw / 2, ch / 2); });
  k.mesh(txt('POWER', .12), M4(-.37, .2105, .228, .12, -Math.PI / 2 + .34, 0));
  k.mesh(txt('RESET', .12), M4(.37, .2105, .228, -.12, -Math.PI / 2 + .34, 0));
  k.mesh(decal(.3, .05, 1100, (x, cw, ch) => { x.font = `${ch * .78}px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#e8e4f2'; x.fillText('gavilanbe', 4, ch / 2); const w1 = x.measureText('gavilanbe ').width; x.fillStyle = '#ff5b35'; x.fillText('64', 4 + w1, ch / 2); }), M4(0, .2585, .197, 0, -.1));
  const led = glow(.26, '#ff4a3a', .85); k.mesh(led, M4(.378, .118, .45));
  const grp = k.build(); grp.userData.led = led;
  return grp;
}

// el mando: tres cuernos, palanca, cruceta, A y B, cuatro botones pequeños, gatillos y START
export function makePad(base = M4()) {
  const k = new Kit(base), g = '#dedad0', d = '#2f2e38';
  // cuerpo: travesaño y tres empuñaduras que se funden
  k.add(loft([{y: 0, pts: squircle(.62, .22, 2.6, 28)}, {y: .03, pts: squircle(.7, .3, 2.8, 28)}, {y: .072, pts: squircle(.7, .3, 2.8, 28)}, {y: .095, pts: squircle(.64, .25, 2.8, 28)}, {y: .104, pts: squircle(.5, .16, 2.6, 28)}]), g, M4(0, .012, 0), 'plastic', .72, 1.1);
  const grip = (x, len, ry, r = .074) => { const c = Math.cos(ry), sn = Math.sin(ry); k.add(loft([{y: 0, pts: squircle(r * 2, .11, 2.4, 16)}, {y: len * .5, pts: squircle(r * 1.8, .105, 2.2, 16)}, {y: len * .85, pts: squircle(r * 1.55, .095, 2, 16)}, {y: len, pts: squircle(r * 1.15, .07, 2, 16)}, {y: len * 1.06, pts: squircle(r * .5, .03, 2, 16)}]), g, M4(x, .06, .07, ry, Math.PI / 2 + .1), 'plastic', .72, 1.1); };
  grip(-.27, .27, -.26); grip(0, .32, 0, .066); grip(.27, .27, .26);
  // gatillos L y R, y el Z bajo el cuerno central
  for (const sx of [-1, 1]) k.add(rbox(.17, .034, .06, .016), '#a9a6b0', M4(sx * .24, .075, -.125, sx * -.16), 'plastic', .8, 1.1);
  // cruceta en su plato
  k.cyl(.078, .082, .01, 18, '#c9c5bb', -.24, .114, 0, 'plastic', .95, 1);
  const cross = ext([[-.016, -.052], [.016, -.052], [.016, -.016], [.052, -.016], [.052, .016], [.016, .016], [.016, .052], [-.016, .052], [-.016, .016], [-.052, .016], [-.052, -.016], [-.016, -.016]], .018, .005);
  k.add(cross, d, M4(-.24, .127, 0, 0, -Math.PI / 2), 'plastic', .9, 1.15);
  // palanca: aro, fuelle, vástago y seta estriada
  k.add(lathe([[.06, 0], [.06, .012], [.05, .02], [.036, .02]], 8), '#c9c5bb', M4(0, .11, .15), 'plastic', .95, 1.05);
  k.add(lathe([[.034, 0], [.03, .012], [.014, .02], [.012, .05]], 12), d, M4(0, .116, .15), 'rubber', .9, 1.1);
  k.add(lathe([[.012, 0], [.034, .004], [.037, .012], [.03, .019], [.02, .021], [.02, .017], [.008, .017], [.0001, .019]], 14), '#b9b6c2', M4(0, .166, .15), 'rubber', .9, 1.15);
  // A, B y los cuatro pequeños
  const btn = (x, z, r, c, hgt = .018) => k.add(lathe([[r, 0], [r, hgt * .6], [r * .82, hgt], [.0001, hgt * 1.08]], 14), c, M4(x, .112, z), 'gloss', .85, 1.2);
  btn(.2, .045, .034, '#ff5b35'); btn(.135, -.02, .034, '#b9f02a');
  for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) btn(.275 + dx * .042, -.06 + dz * .042, .0185, '#7a4be6', .014);
  btn(0, -.03, .02, '#ff3b30', .012);
  // boquilla del cable
  k.add(cyl(.02, .014, .05, 8), d, M4(0, .06, -.165, 0, Math.PI / 2), 'rubber', 1, 1);
  k.mesh(decal(.16, .028, 1500, (x, cw, ch) => { x.fillStyle = 'rgba(40,38,50,.75)'; x.font = `${ch * .8}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('gavilanbe 64', cw / 2, ch / 2); }), M4(0, .1168, -.085, 0, -Math.PI / 2));
  return k.build();
}
export const PAD_CABLE = V(0, .06, -.19);

export function lab(games, q) {
  const grp = new THREE.Group();
  grp.add(makeConsole());
  if (q.get('pad') !== '0') grp.add(makePad(M4(-.75, 0, .75, -.5)));
  return grp;
}
