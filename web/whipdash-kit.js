/**
 * Professor WhipDash — shared art kit.
 *
 * Every model in the game is built from three.js primitives at runtime: no
 * meshes, no textures, no download. The look is "Kenney-adjacent": chunky
 * blocked-out volumes, flat shading, a small palette of matte colours, and
 * lighting (hemisphere bounce + one warm key) doing the work that texture
 * maps usually do.
 *
 * Unit scale: 1 unit = 1 metre. The Professor is 1.8m. A lane is 1.8m wide.
 */
import * as THREE from 'three';

export const LANE_X = [-1.8, 0, 1.8];
export const LANE_W = 1.8;

export const PAL = {
  // Temple
  slabLight: 0xd8b98c, slabDark: 0xc6a476, slabGroove: 0x8d7355,
  kerb: 0xb08f66, pillar: 0xcdb08a, pillarDark: 0x9c805c,
  // Jungle
  leaf: 0x4e9a62, leafDeep: 0x2f6b4a, vine: 0x3d8459, trunk: 0x584431,
  // Professor
  skin: 0xe8b489, shirt: 0xd9c89a, vest: 0x8a6a45, trouser: 0xa98a5f,
  boot: 0x6b4a30, hat: 0xc09a63, hatBand: 0x6f4a2c, leather: 0x7b4a2c,
  lens: 0x2b3a3c,
  // Threats
  rock: 0x8f8880, rockDark: 0x6e6862, rockLight: 0xa9a29a,
  moss: 0x5d8a52, bug: 0x3b3340, bugShell: 0x7a4bd8, eye: 0xf4e9d0,
  // Signal
  gold: 0xf0bc48, hazard: 0xe05437, clear: 0x4fb286, torch: 0xffa83c,
};

const matCache = new Map();
/** Shared matte material. Flat shading keeps the low-poly facets readable. */
export function mat(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });
    matCache.set(key, m);
  }
  return m;
}

export function box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function cyl(rt, rb, h, seg, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Deterministic noise so every boulder is reproducible across sessions. */
function rnd(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/* ----------------------------------------------------------------------- */
/* Professor WhipDash                                                       */
/* ----------------------------------------------------------------------- */

/**
 * Returns a Group with a `parts` map for animation. Facing -Z (into the run).
 */
export function makeProfessor() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);

  const legL = new THREE.Group(); legL.position.set(-0.17, 0.78, 0);
  const legR = new THREE.Group(); legR.position.set(0.17, 0.78, 0);
  for (const [leg, side] of [[legL, -1], [legR, 1]]) {
    leg.add(box(0.26, 0.5, 0.26, PAL.trouser, 0, -0.25, 0));
    leg.add(box(0.24, 0.32, 0.24, PAL.skin, 0, -0.62, 0));
    leg.add(box(0.26, 0.16, 0.36, PAL.boot, 0, -0.84, -0.04));
    leg.add(box(0.28, 0.1, 0.28, PAL.boot, 0, -0.44, 0)); // rolled cuff
    leg.userData.side = side;
    body.add(leg);
  }

  body.add(box(0.62, 0.26, 0.4, PAL.trouser, 0, 0.9, 0));      // hips
  body.add(box(0.66, 0.6, 0.42, PAL.shirt, 0, 1.32, 0));       // torso
  body.add(box(0.5, 0.56, 0.44, PAL.vest, 0, 1.3, 0.01));      // open vest
  const strap = box(0.1, 0.92, 0.02, PAL.leather, 0, 1.3, 0.22);
  strap.rotation.z = 0.5; body.add(strap);
  body.add(box(0.34, 0.28, 0.16, PAL.leather, -0.42, 1.0, 0.06)); // satchel
  body.add(box(0.24, 0.06, 0.04, PAL.gold, -0.42, 1.08, 0.15));   // buckle

  const armL = new THREE.Group(); armL.position.set(-0.42, 1.52, 0);
  const armR = new THREE.Group(); armR.position.set(0.42, 1.52, 0);
  for (const arm of [armL, armR]) {
    arm.add(box(0.18, 0.36, 0.2, PAL.shirt, 0, -0.18, 0));
    arm.add(box(0.16, 0.34, 0.18, PAL.skin, 0, -0.5, 0));
    body.add(arm);
  }

  const head = new THREE.Group(); head.position.set(0, 1.84, 0); body.add(head);
  head.add(box(0.42, 0.42, 0.4, PAL.skin));
  head.add(box(0.44, 0.09, 0.05, PAL.leather, 0, 0.04, 0.2));   // goggle strap
  head.add(box(0.13, 0.13, 0.05, PAL.lens, -0.11, 0.04, 0.22));
  head.add(box(0.13, 0.13, 0.05, PAL.lens, 0.11, 0.04, 0.22));
  head.add(box(0.3, 0.1, 0.05, PAL.leather, 0, -0.14, 0.2));    // stubble/jaw

  const hat = new THREE.Group(); hat.position.set(0, 0.26, 0); head.add(hat);
  hat.add(cyl(0.44, 0.44, 0.05, 12, PAL.hat, 0, 0, 0.02));      // brim
  hat.add(cyl(0.25, 0.27, 0.26, 12, PAL.hat, 0, 0.15, 0));      // crown
  hat.add(cyl(0.272, 0.272, 0.08, 12, PAL.hatBand, 0, 0.08, 0));
  hat.add(box(0.07, 0.12, 0.2, PAL.hatBand, 0, 0.24, 0));       // pinch shadow

  // Whip: a chain of tapering segments, each parented to the last, so a
  // travelling sine wave through local rotations reads as a crack.
  const whip = new THREE.Group();
  whip.position.set(0, -0.62, 0.04);
  armR.add(whip);
  whip.add(box(0.09, 0.26, 0.09, PAL.leather, 0, -0.1, 0));     // handle
  const links = [];
  let parent = whip;
  for (let i = 0; i < 9; i++) {
    const link = new THREE.Group();
    link.position.set(0, i === 0 ? -0.22 : -0.26, 0);
    const t = 1 - i / 10;
    link.add(box(0.06 * t + 0.02, 0.26, 0.06 * t + 0.02, PAL.leather, 0, -0.13, 0));
    parent.add(link); links.push(link); parent = link;
  }

  g.userData.parts = { body, legL, legR, armL, armR, head, hat, whip, links };
  return g;
}

/** Run cycle. `t` is seconds, `speed` scales stride rate. */
export function runProfessor(g, t, speed = 1) {
  const p = g.userData.parts;
  const s = t * 11 * speed;
  p.legL.rotation.x = Math.sin(s) * 0.85;
  p.legR.rotation.x = Math.sin(s + Math.PI) * 0.85;
  p.armL.rotation.x = Math.sin(s + Math.PI) * 0.8;
  p.armL.rotation.z = 0.12;
  p.body.position.y = Math.abs(Math.sin(s)) * 0.07;
  p.body.rotation.z = Math.sin(s) * 0.025;
  p.body.rotation.x = 0.06;
  p.head.rotation.z = -Math.sin(s) * 0.04;
}

/**
 * Whip crack. `k` runs 0 (coiled at the hip) through 1 (recovered);
 * the lash straightens at k≈0.45 and the tip snaps past the arm.
 */
export function crackWhip(g, k) {
  const p = g.userData.parts;
  const coiled = k <= 0 || k >= 1;
  p.whip.visible = true;
  if (coiled) {
    p.armR.rotation.x = -0.35;
    p.armR.rotation.z = -0.12;
    p.links.forEach((l, i) => { l.rotation.x = 0.55 + i * 0.28; l.rotation.z = 0.25; });
    return;
  }
  const throwPhase = Math.sin(Math.min(k, 1) * Math.PI);
  p.armR.rotation.x = -0.35 - throwPhase * 2.3;
  p.armR.rotation.z = -0.12 - throwPhase * 0.3;
  p.links.forEach((l, i) => {
    const lag = k - i * 0.055;              // wave travels down the lash
    const wave = Math.sin(Math.max(0, Math.min(1, lag * 1.6)) * Math.PI);
    l.rotation.x = 0.55 + i * 0.28 - wave * (1.0 + i * 0.16);
    l.rotation.z = 0.25 - wave * 0.3;
  });
}

/* ----------------------------------------------------------------------- */
/* Boulders — the three pursuers                                            */
/* ----------------------------------------------------------------------- */

/**
 * variant: 'grindstone' (lane-locker), 'tumbler' (drifter), 'idol' (lunger).
 */
export function makeBoulder(variant = 'grindstone', seed = 3) {
  const g = new THREE.Group();
  const r = rnd(seed);
  const detail = variant === 'tumbler' ? 0 : 1;
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const n = 0.86 + r() * 0.26;
    pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * n, pos.getZ(i) * n);
  }
  geo.computeVertexNormals();

  const base = variant === 'idol' ? PAL.rockDark : PAL.rock;
  const core = new THREE.Mesh(geo, mat(base, { flatShading: true }));
  core.castShadow = true; core.receiveShadow = true;
  g.add(core);

  // Chipped facets catch the key light and sell the rotation.
  for (let i = 0; i < 7; i++) {
    const chip = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.18 + r() * 0.22),
      mat(r() > 0.5 ? PAL.rockLight : PAL.rockDark)
    );
    const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1);
    chip.position.setFromSphericalCoords(0.92, b, a);
    chip.rotation.set(r() * 3, r() * 3, r() * 3);
    chip.castShadow = true;
    g.add(chip);
  }

  if (variant === 'tumbler') {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + r() * 0.16, 0), mat(PAL.moss));
      const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1);
      m.position.setFromSphericalCoords(0.88, b, a);
      m.scale.y = 0.35;
      m.lookAt(0, 0, 0);
      g.add(m);
    }
  }

  if (variant === 'idol') {
    // A carved face on the leading hemisphere: the boulder that stares back.
    const face = new THREE.Group();
    face.position.set(0, 0.05, 0.72);
    face.add(box(1.0, 0.16, 0.2, PAL.rockLight, 0, 0.3, 0.05));   // brow
    face.add(box(0.26, 0.2, 0.16, PAL.hazard, -0.26, 0.1, 0.12, { emissive: PAL.hazard, emissiveIntensity: 0.8 }));
    face.add(box(0.26, 0.2, 0.16, PAL.hazard, 0.26, 0.1, 0.12, { emissive: PAL.hazard, emissiveIntensity: 0.8 }));
    face.add(box(0.7, 0.22, 0.16, PAL.rockDark, 0, -0.34, 0.08)); // mouth
    face.add(box(0.1, 0.12, 0.18, PAL.rockLight, -0.2, -0.3, 0.1));
    face.add(box(0.1, 0.12, 0.18, PAL.rockLight, 0.2, -0.3, 0.1));
    g.add(face);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 6, 16), mat(PAL.gold));
    band.rotation.y = Math.PI / 2;
    g.add(band);
  }

  g.userData.variant = variant;
  return g;
}

/* ----------------------------------------------------------------------- */
/* Vermin — the things in front of you                                      */
/* ----------------------------------------------------------------------- */

export function makeSpider() {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.34; g.add(body);
  const abdomen = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(PAL.bug));
  abdomen.position.set(0, 0.04, 0.22); abdomen.scale.set(1, 0.85, 1.1);
  abdomen.castShadow = true; body.add(abdomen);
  body.add(box(0.2, 0.14, 0.1, PAL.bugShell, 0, 0.18, 0.2));
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), mat(PAL.bug));
  head.position.set(0, 0, -0.2); head.castShadow = true; body.add(head);
  for (const x of [-0.08, 0.08]) {
    body.add(box(0.07, 0.07, 0.04, PAL.eye, x, 0.04, -0.33));
    body.add(box(0.04, 0.04, 0.03, PAL.hazard, x, 0.04, -0.35));
  }
  const legs = [];
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? -1 : 1;
    const j = i % 4;
    const hip = new THREE.Group();
    hip.position.set(side * 0.16, 0, -0.14 + j * 0.13);
    hip.rotation.y = side * (0.5 - j * 0.32);
    hip.rotation.z = side * 0.9;
    const upper = box(0.05, 0.3, 0.05, PAL.bug, 0, -0.15, 0);
    hip.add(upper);
    const knee = new THREE.Group(); knee.position.y = -0.3; knee.rotation.z = -side * 1.5;
    knee.add(box(0.045, 0.3, 0.045, PAL.bug, 0, -0.15, 0));
    hip.add(knee);
    body.add(hip); legs.push(hip);
  }
  g.userData.parts = { body, legs };
  return g;
}

export function makeBeetle() {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.26; g.add(body);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(PAL.bugShell));
  shell.scale.set(1, 0.85, 1.35); shell.castShadow = true; body.add(shell);
  body.add(box(0.03, 0.3, 0.9, PAL.bug, 0, 0.26, 0));           // wing split
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 6), mat(PAL.bug));
  under.scale.set(1, 0.45, 1.3); body.add(under);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(PAL.bug));
  head.position.z = -0.42; head.castShadow = true; body.add(head);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 6), mat(PAL.gold));
  horn.position.set(0, 0.1, -0.56); horn.rotation.x = -1.9; body.add(horn);
  const legs = [];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1, j = i % 3;
    const hip = new THREE.Group();
    hip.position.set(side * 0.24, -0.02, -0.3 + j * 0.3);
    hip.rotation.z = side * 1.1;
    hip.add(box(0.05, 0.26, 0.05, PAL.bug, 0, -0.13, 0));
    body.add(hip); legs.push(hip);
  }
  g.userData.parts = { body, legs };
  return g;
}

export function skitter(g, t, rate = 1) {
  const p = g.userData.parts;
  p.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(t * 14 * rate + i * 1.7) * 0.42;
  });
  p.body.position.y = (g.userData.baseY ?? p.body.position.y);
  p.body.rotation.z = Math.sin(t * 7 * rate) * 0.06;
}

/* ----------------------------------------------------------------------- */
/* World kit                                                                */
/* ----------------------------------------------------------------------- */

export function makeRelic() {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.35 }));
  gem.castShadow = true; g.add(gem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 5, 14), mat(PAL.torch, { emissive: PAL.torch, emissiveIntensity: 0.3 }));
  ring.rotation.x = Math.PI / 2; g.add(ring);
  g.userData.parts = { gem, ring };
  return g;
}

export function makeTorch() {
  const g = new THREE.Group();
  g.add(box(0.18, 1.5, 0.18, PAL.trunk, 0, 0.75, 0));
  g.add(box(0.3, 0.22, 0.3, PAL.pillarDark, 0, 1.5, 0));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(PAL.torch, { emissive: PAL.torch, emissiveIntensity: 1.1 }));
  flame.position.y = 1.85; g.add(flame);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 6), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 1.4 }));
  inner.position.y = 1.8; g.add(inner);
  g.userData.parts = { flame, inner };
  return g;
}

/**
 * One 12m module of track. Modules are recycled, so everything here is
 * cheap: no lights, emissive materials stand in for glow.
 */
export function makeTrackSegment(seed = 1) {
  const g = new THREE.Group();
  const r = rnd(seed);
  const LEN = 12;

  for (let i = 0; i < 4; i++) {
    const z = -i * 3 - 1.5;
    for (let l = 0; l < 3; l++) {
      const slab = box(LANE_W - 0.08, 0.3, 2.86, (i + l) % 2 ? PAL.slabLight : PAL.slabDark, LANE_X[l], -0.15, z);
      slab.position.y += (r() - 0.5) * 0.015;
      g.add(slab);
    }
    g.add(box(5.6, 0.22, 0.12, PAL.slabGroove, 0, -0.1, z + 1.5));
  }
  g.add(box(0.12, 0.34, LEN, PAL.slabGroove, -0.9, -0.08, -LEN / 2));
  g.add(box(0.12, 0.34, LEN, PAL.slabGroove, 0.9, -0.08, -LEN / 2));

  for (const side of [-1, 1]) {
    g.add(box(0.5, 0.5, LEN, PAL.kerb, side * 3.05, 0.05, -LEN / 2));
    g.add(box(0.9, 0.3, LEN, PAL.leafDeep, side * 3.7, -0.1, -LEN / 2));
    for (let i = 0; i < 2; i++) {
      const z = -3 - i * 6 - r() * 1.5;
      const p = new THREE.Group();
      p.position.set(side * 3.9, 0, z);
      p.add(cyl(0.34, 0.4, 3.2, 8, PAL.pillar, 0, 1.6, 0));
      p.add(box(1.0, 0.3, 1.0, PAL.pillarDark, 0, 3.3, 0));
      p.add(box(0.86, 0.2, 0.86, PAL.pillar, 0, 0.1, 0));
      if (r() > 0.55) {
        const t = makeTorch(); t.position.set(-side * 0.55, 2.0, 0); t.scale.setScalar(0.7);
        p.add(t);
      }
      g.add(p);
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + r() * 0.5, 0), mat(r() > 0.5 ? PAL.leaf : PAL.leafDeep));
      bush.position.set(side * (4.6 + r()), 0.2, z + 2 + r() * 3);
      bush.scale.y = 0.7; bush.castShadow = true;
      g.add(bush);
      const trunk = cyl(0.22, 0.3, 4 + r() * 2, 6, PAL.trunk, side * (5.4 + r() * 1.5), 2, z - 2 - r() * 4);
      g.add(trunk);
      const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + r() * 0.6, 0), mat(PAL.leafDeep));
      canopy.position.set(trunk.position.x, 4.4 + r(), trunk.position.z);
      canopy.scale.y = 0.6;
      g.add(canopy);
    }
  }

  // Hanging vines catch the camera as it passes under them.
  for (let i = 0; i < 3; i++) {
    const x = -2.6 + r() * 5.2;
    const v = box(0.07, 1.2 + r(), 0.07, PAL.vine, x, 3.6, -r() * LEN);
    g.add(v);
  }
  g.userData.length = LEN;
  return g;
}

/** Soft blob shadow for studio turntables (no shadow map needed). */
export function contactShadow(radius = 1.3, opacity = 0.4) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.6)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  return m;
}

/**
 * The three-light rig used everywhere: cool sky bounce, warm key from the
 * left, and a dim rim from behind so silhouettes hold against the fog.
 */
export function lightRig(scene, { key = 1.35, shadow = false } = {}) {
  scene.add(new THREE.HemisphereLight(0xbfd8e8, 0x4a3f2e, 0.85));
  const sun = new THREE.DirectionalLight(0xfff0d0, key);
  sun.position.set(-6, 9, 5);
  if (shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const c = sun.shadow.camera;
    c.left = -9; c.right = 9; c.top = 9; c.bottom = -12; c.near = 1; c.far = 40;
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.02;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fc6ff, 0.5);
  rim.position.set(5, 4, -8);
  scene.add(rim);
  return sun;
}
