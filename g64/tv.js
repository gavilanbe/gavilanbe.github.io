// La tele de tubo con su mueble, el vídeo y Gavi, el gavilán de peluche. Frente hacia +z.
import {THREE, V, M4, Kit, loft, lathe, squircle, scaleRing, rbox, cyl, ellipsoid, ext, rrect, decal, glow, tex, FONT, MONO} from './kit.js';

export const SCREEN = {y: 1.27, z: .4, w: 1.1, h: .825};
export const TV_AV = V(.42, .74, .47);              // tomas de vídeo del frontal

export function makeTV(base = M4(), screenTex) {
  const k = new Kit(base), wood = '#a86a3c', woodD = '#7a4826', shell = '#4c4a5a';
  // ── mueble: tablero, laterales, balda y cajón ──
  k.add(rbox(1.9, .05, 1.02, .02), wood, M4(0, .585, 0), 'wood', .9, 1.08).add(rbox(1.9, .05, 1.02, .02), wood, M4(0, .085, 0), 'wood', .7, .95);
  for (const sx of [-1, 1]) k.add(rbox(.05, .5, 1.0, .015), wood, M4(sx * .92, .335, 0), 'wood', .68, 1.02);
  k.box(1.82, .5, .03, woodD, 0, .335, -.48, 'wood', .6, .9).box(.04, .46, .96, wood, .28, .335, 0, 'wood', .68, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(lathe([[.03, 0], [.045, .06]], 8), woodD, M4(sx * .82, 0, sz * .4), 'wood', .7, 1);
  // cajón a la derecha con tiradores
  k.add(rbox(.6, .2, .04, .012), '#b87644', M4(.6, .46, .49), 'wood', .85, 1.06).add(rbox(.6, .2, .04, .012), '#b87644', M4(.6, .23, .49), 'wood', .8, 1.02);
  for (const y of [.46, .23]) k.add(lathe([[.012, 0], [.012, .02], [.026, .03], [.02, .04], [.0001, .042]], 10), '#ffd23f', M4(.6, y, .51, 0, Math.PI / 2), 'gold', 1, 1.1);
  // vídeo en el hueco: frontal, trampilla, pantallita y botones
  k.add(rbox(1.05, .14, .6, .015), '#26252e', M4(-.34, .19, .12), 'plastic', .8, 1.15);
  k.add(rbox(.56, .05, .012, .006), '#0c0c11', M4(-.52, .215, .425), 'gloss', 1, 1).box(.2, .04, .01, '#0a140f', -.07, .215, .423, 'gloss', 1, 1);
  for (let i = 0; i < 4; i++) k.add(rbox(.045, .02, .012, .005), '#55535f', M4(-.78 + i * .07, .15, .424), 'plastic', 1, 1.1);
  k.box(.022, .012, .008, '#39ff7a', .11, .15, .423, 'glow', 2, 2);
  // cintas y cajas apiladas sobre el vídeo
  [['#ff5b35', .04], ['#f4efe4', -.05], ['#35d0c0', .08]].forEach(([c, r], i) => k.add(rbox(.3, .042, .19, .006), c, M4(-.62, .285 + i * .043, .16, r), 'plastic', .8, 1.05).box(.2, .024, .002, '#17122a', -.62 + Math.sin(r) * .095, .285 + i * .043, .16 + .096, 'matte', 1, 1, r));
  // ── la tele ──
  const sec = (w, h, e = 5) => squircle(w, h, e, 32), cy = 1.27;
  const body = loft([[-.56, .5, .46], [-.5, .6, .56], [-.25, .84, .8], [.05, .98, .97], [.28, 1.015, 1.015], [.4, 1.015, 1.015], [.43, .99, .99]].map(([z, sw, sh]) => ({y: z, pts: scaleRing(sec(1.52, 1.24), sw, sh)})), {capTop: false}); body.rotateX(Math.PI / 2);
  k.add(body, shell, M4(0, cy, 0), 'plastic', .6, 1.12);
  // marco: bisel exterior, canto y embocadura hacia el cristal
  const bez = loft([{y: .43, pts: sec(1.5, 1.225)}, {y: .452, pts: sec(1.46, 1.185)}, {y: .452, pts: sec(1.3, 1.02, 7)}, {y: .4, pts: sec(1.17, .89, 9)}], {capBottom: false, capTop: false}); bez.rotateX(Math.PI / 2);
  k.add(bez, '#5d5b6c', M4(0, cy, 0), 'plastic', .72, 1.15);
  k.add(ext(rrect(1.18, .9, .12, 0, 0, 8), .02, 0), '#050508', M4(0, cy, .385), 'matte', 1, 1);
  // tablero de mandos bajo la pantalla (parte del frontal): altavoz, botones, tomas
  for (let i = 0; i < 14; i++) k.add(rbox(.012, .075, .012, .004, 1), '#24232c', M4(-.6 + i * .03, .745, .452), 'plastic', 1, 1);
  for (let i = 0; i < 4; i++) k.add(rbox(.05, .022, .014, .006), '#c9c5d0', M4(-.06 + i * .068, .735, .455), 'plastic', .9, 1.1);
  k.add(lathe([[.03, 0], [.03, .012], [.024, .018], [.0001, .019]], 14), '#ff4a3a', M4(.33, .745, .45, 0, Math.PI / 2), 'gloss', .9, 1.2);
  [['#ffd23f', 0], ['#f4efe4', 1], ['#ff3b30', 2]].forEach(([c, i]) => k.add(lathe([[.017, 0], [.017, .012], [.011, .012], [.011, .004]], 10), c, M4(.42 + i * .05, .74, .448, 0, Math.PI / 2), 'plastic', 1, 1.1));
  k.box(.014, .014, .006, '#39ff7a', .245, .775, .455, 'glow', 2, 2);
  // rejillas traseras y patas
  for (let i = 0; i < 7; i++) k.box(.5 - i * .03, .012, .02, '#2a2933', 0, 1.6 - i * .004, -.2 - i * .045, 'matte', 1, 1);
  for (const sx of [-1, 1]) k.add(rbox(.2, .04, .5, .015), '#2a2933', M4(sx * .5, .63, .05), 'rubber', 1, 1);
  // antena de conejo
  k.add(lathe([[.13, 0], [.12, .03], [.07, .06], [.03, .075]], 14), '#26252e', M4(.1, 1.885, -.1), 'plastic', .9, 1.1);
  for (const s of [-1, 1]) { k.cyl(.008, .01, .95, 6, '#d8d5e0', .1 + s * .3, 2.3, -.1, 'metal', 1, 1, 0, s * -.62).add(ellipsoid(.016, .016, .016, 8, 6), '#d8d5e0', M4(.1 + s * .575, 2.685, -.1), 'metal', 1, 1); }
  // cristal abombado con la imagen y el brillo del tubo
  const sg = new THREE.PlaneGeometry(SCREEN.w, SCREEN.h, 14, 10); { const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (SCREEN.w / 2), v = p.getY(i) / (SCREEN.h / 2); p.setZ(i, (1 - u * u) * .04 + (1 - v * v) * .032); } sg.computeVertexNormals(); }
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({map: screenTex})); screen.name = 'tv';
  k.mesh(screen, M4(0, SCREEN.y, SCREEN.z));
  const shine = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, map: tex(128, 96, (x, w, h) => { const g = x.createLinearGradient(0, 0, w * .8, h); g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(.28, 'rgba(255,255,255,.07)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(w * .3, h * .22, w * .42, h * .3, -.4, 0, 7); x.fill(); const v = x.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0)'); })}));
  shine.renderOrder = 6; k.mesh(shine, M4(0, SCREEN.y, SCREEN.z + .002));
  k.mesh(decal(.2, .034, 1400, (x, cw, ch) => { x.fillStyle = '#d8d5e0'; x.font = `${ch * .8}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GAVILUX', cw / 2, ch / 2); }), M4(-.02, .79, .462));
  k.mesh(decal(.16, .016, 2200, (x, cw, ch) => { x.fillStyle = 'rgba(216,213,224,.7)'; x.font = `600 ${ch * .8}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('VIDEO  L  R', cw / 2, ch / 2); }), M4(.47, .775, .462));
  const halo = glow(2.6, '#9fd4ff', .2); k.mesh(halo, M4(0, SCREEN.y, SCREEN.z + .25));
  // ── Gavi, el gavilán de peluche, encima de la tele ──
  const b = M4(-.42, 1.885, -.02, .35), br = '#a8623a', cream = '#f6e3c0';
  const add = (geo, c, m, mat = 'fabric', k0 = .8, k1 = 1.08) => k.add(geo, c, b.clone().multiply(m), mat, k0, k1);
  add(ellipsoid(.105, .125, .095, 14, 10), br, M4(0, .13, 0)); add(ellipsoid(.075, .095, .06, 12, 8), cream, M4(0, .115, .045));
  add(ellipsoid(.085, .08, .08, 14, 10), br, M4(0, .29, .01)); add(ellipsoid(.06, .05, .04, 10, 8), cream, M4(0, .275, .052));
  for (const s of [-1, 1]) { add(ellipsoid(.03, .1, .07, 8, 8), '#7a4326', M4(s * .1, .13, -.01, 0, 0, s * .25)); add(ellipsoid(.022, .024, .012, 8, 6), '#ffffff', M4(s * .034, .305, .075), 'gloss', 1, 1); add(ellipsoid(.011, .012, .008, 6, 5), '#17122a', M4(s * .034, .305, .085), 'gloss', 1, 1); add(ellipsoid(.03, .014, .045, 8, 5), '#ffd23f', M4(s * .045, .012, .06)); add(new THREE.ConeGeometry(.02, .05, 4), '#7a4326', M4(s * .05, .365, -.01, 0, 0, s * -.3)); }
  add(new THREE.ConeGeometry(.024, .06, 5), '#ffd23f', M4(0, .27, .1, 0, Math.PI / 2 + .5)); add(rbox(.1, .012, .1, .005), '#7a4326', M4(0, .03, -.1, 0, -.5));
  const grp = k.build(); grp.userData = {screen, halo};
  return grp;
}
export const lab = () => makeTV(M4(), tex(320, 240, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2338b0'); g.addColorStop(1, '#0c0b2a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#ffe95c'; x.font = `40px ${FONT}`; x.textAlign = 'center'; x.fillText('gavilanbe 64', w / 2, h / 2); }));
