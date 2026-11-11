// Chispas, estelas y anillos de impacto: un único sistema de partículas aditivas y unos aros en el suelo.
import {THREE, C, glowTex, tex} from './kit.js';

export function makeFX(scene) {
  const N = 420, pos = new Float32Array(N * 3).fill(999), col = new Float32Array(N * 3), P = Array.from({length: N}, () => ({life: 0, max: 1, v: new THREE.Vector3(), c: new THREE.Color(), g: 0, drag: 0}));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({size: .17, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}));
  pts.frustumCulled = false; pts.renderOrder = 8; scene.add(pts);
  let next = 0;
  function spawn(p, color, {n = 1, speed = 1, up = 0, spread = 1, life = .6, gravity = 3, drag = 1.5, jitter = .02, white = .55} = {}) {
    for (let i = 0; i < n; i++) {
      const q = P[next], k = next * 3; next = (next + 1) % N;
      const a = Math.random() * Math.PI * 2, e = Math.random() * spread, s = speed * (.4 + Math.random() * .8);
      q.v.set(Math.cos(a) * Math.sin(e) * s, Math.cos(e) * s * (up ? 1 : .0) + up * (.5 + Math.random() * .7), Math.sin(a) * Math.sin(e) * s);
      q.life = q.max = life * (.6 + Math.random() * .7); q.g = gravity; q.drag = drag;
      q.c.set(color).lerp(new THREE.Color('#ffffff'), Math.random() * white);
      pos[k] = p.x + (Math.random() - .5) * jitter; pos[k + 1] = p.y + (Math.random() - .5) * jitter; pos[k + 2] = p.z + (Math.random() - .5) * jitter;
    }
  }
  // aros que se abren a ras de suelo
  const ringTex = tex(128, 128, x => { const g = x.createRadialGradient(64, 64, 40, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.72, 'rgba(255,255,255,.9)'); g.addColorStop(.86, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const rings = Array.from({length: 5}, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: ringTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0})); m.rotation.x = -Math.PI / 2; m.renderOrder = 7; m.userData = {t: 1, dur: 1, from: 0, to: 1}; scene.add(m); return m; });
  let rn = 0;
  function ring(p, color, {from = .3, to = 3, dur = .55, y = .03, delay = 0} = {}) { const m = rings[rn]; rn = (rn + 1) % rings.length; m.position.set(p.x, y, p.z); m.material.color.set(color).lerp(new THREE.Color('#ffffff'), .45); Object.assign(m.userData, {t: -delay / dur, dur, from, to}); }
  function update(dt) {
    for (let i = 0; i < N; i++) {
      const q = P[i], k = i * 3; if (q.life <= 0) continue;
      q.life -= dt; if (q.life <= 0) { pos[k + 1] = 999; col[k] = col[k + 1] = col[k + 2] = 0; continue; }
      q.v.y -= q.g * dt; q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt));
      pos[k] += q.v.x * dt; pos[k + 1] += q.v.y * dt; pos[k + 2] += q.v.z * dt; if (pos[k + 1] < .02) { pos[k + 1] = .02; q.v.y *= -.4; }
      const f = Math.pow(q.life / q.max, 1.4); col[k] = q.c.r * f; col[k + 1] = q.c.g * f; col[k + 2] = q.c.b * f;
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    for (const m of rings) { const u = m.userData; if (u.t >= 1) continue; u.t = Math.min(1, u.t + dt / u.dur); const e = u.t < 0 ? 0 : 1 - Math.pow(1 - u.t, 3), s = u.from + (u.to - u.from) * e; m.scale.set(s, s, 1); m.material.opacity = u.t < 0 ? 0 : (1 - u.t) * .9; }
  }
  return {spawn, ring, update};
}
