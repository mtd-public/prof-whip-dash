/**
 * Professor WhipDash — art kit.
 *
 * Every model in the game is assembled from three.js primitives at runtime:
 * no meshes, no textures, no downloads. The look is Kenney-adjacent — chunky
 * blocked-out volumes, flat shading, a small palette of matte colours — with
 * the lighting rig and tone mapping doing the work texture maps usually do.
 *
 * Unit scale: 1 unit = 1 metre. The Professor is 1.8m; a lane is 1.8m wide.
 */
import * as THREE from 'three'
import { PAL, WORLDS, type Biome } from './palette'

export const LANE_X = [-1.8, 0, 1.8] as const
export const SEGMENT_LEN = 12

type MatOpts = { emissive?: number; emissiveIntensity?: number; transparent?: boolean; opacity?: number }

const matCache = new Map<string, THREE.MeshLambertMaterial>()

/** Shared matte material. Flat shading keeps the low-poly facets readable. */
export function mat(color: number, opts: MatOpts = {}): THREE.MeshLambertMaterial {
  const key = color + '|' + JSON.stringify(opts)
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts })
    matCache.set(key, m)
  }
  return m
}

export function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, opts?: MatOpts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts))
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function cyl(rt: number, rb: number, h: number, seg: number, color: number, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color))
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Deterministic noise, so a seeded track module looks the same every run. */
function rnd(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/* ---------------------------------------------------------------- runner */

export interface RunnerParts {
  body: THREE.Group
  legL: THREE.Group
  legR: THREE.Group
  armL: THREE.Group
  armR: THREE.Group
  head: THREE.Group
  links: THREE.Group[]
}

/** Professor WhipDash. Built facing +Z; the scene turns him around. */
export function makeRunner(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)

  const legL = new THREE.Group()
  legL.position.set(-0.17, 0.78, 0)
  const legR = new THREE.Group()
  legR.position.set(0.17, 0.78, 0)
  for (const leg of [legL, legR]) {
    leg.add(box(0.26, 0.5, 0.26, PAL.trouser, 0, -0.25, 0))
    leg.add(box(0.28, 0.1, 0.28, PAL.boot, 0, -0.44, 0))
    leg.add(box(0.24, 0.32, 0.24, PAL.skin, 0, -0.62, 0))
    leg.add(box(0.26, 0.16, 0.36, PAL.boot, 0, -0.84, -0.04))
    body.add(leg)
  }

  body.add(box(0.62, 0.26, 0.4, PAL.trouser, 0, 0.9, 0))
  body.add(box(0.66, 0.6, 0.42, PAL.shirt, 0, 1.32, 0))
  body.add(box(0.5, 0.56, 0.44, PAL.vest, 0, 1.3, 0.01))
  const strap = box(0.1, 0.92, 0.02, PAL.leather, 0, 1.3, 0.22)
  strap.rotation.z = 0.5
  body.add(strap)
  body.add(box(0.34, 0.28, 0.16, PAL.leather, -0.42, 1.0, 0.06))
  body.add(box(0.24, 0.06, 0.04, PAL.gold, -0.42, 1.08, 0.15))

  const armL = new THREE.Group()
  armL.position.set(-0.42, 1.52, 0)
  const armR = new THREE.Group()
  armR.position.set(0.42, 1.52, 0)
  for (const arm of [armL, armR]) {
    arm.add(box(0.18, 0.36, 0.2, PAL.shirt, 0, -0.18, 0))
    arm.add(box(0.16, 0.34, 0.18, PAL.skin, 0, -0.5, 0))
    body.add(arm)
  }

  const head = new THREE.Group()
  head.position.set(0, 1.84, 0)
  body.add(head)
  head.add(box(0.42, 0.42, 0.4, PAL.skin))
  head.add(box(0.3, 0.1, 0.05, PAL.leather, 0, -0.14, 0.2))
  head.add(box(0.44, 0.09, 0.05, PAL.leather, 0, 0.04, 0.2))
  head.add(box(0.13, 0.13, 0.05, PAL.lens, -0.11, 0.04, 0.22))
  head.add(box(0.13, 0.13, 0.05, PAL.lens, 0.11, 0.04, 0.22))

  const hat = new THREE.Group()
  hat.position.set(0, 0.26, 0)
  head.add(hat)
  hat.add(cyl(0.44, 0.44, 0.05, 12, PAL.hat, 0, 0, 0.02))
  hat.add(cyl(0.25, 0.27, 0.26, 12, PAL.hat, 0, 0.15, 0))
  hat.add(cyl(0.272, 0.272, 0.08, 12, PAL.hatBand, 0, 0.08, 0))
  hat.add(box(0.07, 0.12, 0.2, PAL.hatBand, 0, 0.24, 0))

  // The whip is a chain of tapering links, each parented to the last, so a
  // wave travelling down the chain reads as a crack.
  const whip = new THREE.Group()
  whip.position.set(0, -0.62, 0.04)
  armR.add(whip)
  whip.add(box(0.09, 0.26, 0.09, PAL.leather, 0, -0.1, 0))
  const links: THREE.Group[] = []
  let parent: THREE.Object3D = whip
  for (let i = 0; i < 9; i++) {
    const link = new THREE.Group()
    link.position.set(0, i === 0 ? -0.22 : -0.26, 0)
    const t = 1 - i / 10
    link.add(box(0.06 * t + 0.02, 0.26, 0.06 * t + 0.02, PAL.leather, 0, -0.13, 0))
    parent.add(link)
    links.push(link)
    parent = link
  }

  const parts: RunnerParts = { body, legL, legR, armL, armR, head, links }
  g.userData.parts = parts
  return g
}

export function runCycle(g: THREE.Group, t: number, speed = 1) {
  const p = g.userData.parts as RunnerParts
  const s = t * 11 * speed
  p.legL.rotation.x = Math.sin(s) * 0.85
  p.legR.rotation.x = Math.sin(s + Math.PI) * 0.85
  p.armL.rotation.x = Math.sin(s + Math.PI) * 0.8
  p.armL.rotation.z = 0.12
  p.body.position.y = Math.abs(Math.sin(s)) * 0.07
  p.body.rotation.z = Math.sin(s) * 0.025
  p.body.rotation.x = 0.06
  p.head.rotation.z = -Math.sin(s) * 0.04
}

/** `k` runs 0 (coiled) → 1 (recovered); the lash straightens around k≈0.45. */
export function crackWhip(g: THREE.Group, k: number) {
  const p = g.userData.parts as RunnerParts
  if (k <= 0 || k >= 1) {
    p.armR.rotation.x = -0.35
    p.armR.rotation.z = -0.12
    p.links.forEach((l, i) => {
      l.rotation.x = 0.55 + i * 0.28
      l.rotation.z = 0.25
    })
    return
  }
  const throwPhase = Math.sin(k * Math.PI)
  p.armR.rotation.x = -0.35 - throwPhase * 2.3
  p.armR.rotation.z = -0.12 - throwPhase * 0.3
  p.links.forEach((l, i) => {
    const lag = k - i * 0.055
    const wave = Math.sin(Math.max(0, Math.min(1, lag * 1.6)) * Math.PI)
    l.rotation.x = 0.55 + i * 0.28 - wave * (1.0 + i * 0.16)
    l.rotation.z = 0.25 - wave * 0.3
  })
}

/* -------------------------------------------------------------- boulders */

export type BoulderVariant = 'limestone' | 'mossy' | 'kukulkan'

/** A rolling temple block. `kukulkan` is the carved serpent-head one. */
export function makeBoulder(variant: BoulderVariant = 'limestone', seed = 3): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  const geo = new THREE.IcosahedronGeometry(1, variant === 'mossy' ? 0 : 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const n = 0.86 + r() * 0.26
    pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * n, pos.getZ(i) * n)
  }
  geo.computeVertexNormals()

  const core = new THREE.Mesh(geo, mat(variant === 'kukulkan' ? PAL.rockDark : PAL.rock))
  core.castShadow = true
  core.receiveShadow = true
  g.add(core)

  for (let i = 0; i < 7; i++) {
    const chip = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18 + r() * 0.22), mat(r() > 0.5 ? PAL.rockLight : PAL.rockDark))
    chip.position.setFromSphericalCoords(0.92, Math.acos(2 * r() - 1), r() * Math.PI * 2)
    chip.rotation.set(r() * 3, r() * 3, r() * 3)
    chip.castShadow = true
    g.add(chip)
  }

  if (variant === 'mossy') {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + r() * 0.16, 0), mat(PAL.moss))
      m.position.setFromSphericalCoords(0.88, Math.acos(2 * r() - 1), r() * Math.PI * 2)
      m.scale.y = 0.35
      m.lookAt(0, 0, 0)
      g.add(m)
    }
    for (let i = 0; i < 3; i++) {
      const v = box(0.06, 0.5 + r() * 0.4, 0.06, PAL.vine, (r() - 0.5) * 1.2, 0.7, (r() - 0.5) * 1.2)
      g.add(v)
    }
  }

  if (variant === 'kukulkan') {
    // A feathered-serpent mask carved into the leading face. Big flat shapes
    // only: at 20 m/s this has to read in three frames.
    const face = new THREE.Group()
    face.position.set(0, 0, 0.66)
    face.add(box(1.5, 1.2, 0.3, PAL.cinnabar, 0, 0.05, 0))
    face.add(box(1.5, 0.22, 0.34, PAL.ochre, 0, 0.56, 0.02))
    face.add(box(0.42, 0.34, 0.24, PAL.obsidian, -0.34, 0.2, 0.16))
    face.add(box(0.42, 0.34, 0.24, PAL.obsidian, 0.34, 0.2, 0.16))
    face.add(box(0.18, 0.16, 0.12, PAL.gold, -0.34, 0.2, 0.3))
    face.add(box(0.18, 0.16, 0.12, PAL.gold, 0.34, 0.2, 0.3))
    face.add(box(0.62, 0.36, 0.36, PAL.rockLight, 0, -0.34, 0.22))
    face.add(box(1.0, 0.16, 0.3, PAL.obsidian, 0, -0.16, 0.24))
    for (const x of [-0.3, 0.3]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 5), mat(PAL.plaster))
      fang.position.set(x, -0.46, 0.34)
      fang.rotation.x = Math.PI
      face.add(fang)
    }
    g.add(face)
    // Plume fan behind the mask, not scattered over the whole block.
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2.4
      const plume = box(0.2, 0.5, 0.14, i % 2 ? PAL.jade : PAL.turquoise, Math.sin(a) * 0.9, 0.35 + Math.cos(a) * 0.5, 0.25)
      plume.rotation.z = -a
      g.add(plume)
    }
  }

  g.userData.variant = variant
  return g
}

/* ---------------------------------------------------------------- vermin */

interface CritterParts {
  body: THREE.Group
  legs: THREE.Group[]
}

export function makeSpider(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Group()
  body.position.y = 0.34
  g.add(body)

  const abdomen = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(PAL.bug))
  abdomen.position.set(0, 0.04, 0.22)
  abdomen.scale.set(1, 0.85, 1.1)
  abdomen.castShadow = true
  body.add(abdomen)
  body.add(box(0.22, 0.16, 0.26, PAL.bugShell, 0, 0.18, 0.2))
  body.add(box(0.1, 0.1, 0.12, PAL.jade, 0, 0.26, 0.3))

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), mat(PAL.bug))
  head.position.set(0, 0, -0.2)
  head.castShadow = true
  body.add(head)
  for (const x of [-0.08, 0.08]) {
    body.add(box(0.07, 0.07, 0.04, PAL.eye, x, 0.04, -0.33))
    body.add(box(0.04, 0.04, 0.03, PAL.hazard, x, 0.04, -0.35))
  }

  const legs: THREE.Group[] = []
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? -1 : 1
    const j = i % 4
    const hip = new THREE.Group()
    hip.position.set(side * 0.16, 0, -0.14 + j * 0.13)
    hip.rotation.y = side * (0.5 - j * 0.32)
    hip.rotation.z = side * 0.9
    hip.add(box(0.05, 0.3, 0.05, PAL.bugLeg, 0, -0.15, 0))
    const knee = new THREE.Group()
    knee.position.y = -0.3
    knee.rotation.z = -side * 1.5
    knee.add(box(0.045, 0.3, 0.045, PAL.bugLeg, 0, -0.15, 0))
    hip.add(knee)
    body.add(hip)
    legs.push(hip)
  }
  g.userData.parts = { body, legs } satisfies CritterParts
  return g
}

export function makeScarab(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Group()
  body.position.y = 0.26
  g.add(body)

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(PAL.jade))
  shell.scale.set(1, 0.85, 1.35)
  shell.castShadow = true
  body.add(shell)
  body.add(box(0.03, 0.3, 0.9, PAL.bug, 0, 0.26, 0))
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 6), mat(PAL.bug))
  under.scale.set(1, 0.45, 1.3)
  body.add(under)
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(PAL.bug))
  head.position.z = -0.42
  head.castShadow = true
  body.add(head)
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 6), mat(PAL.gold))
  horn.position.set(0, 0.1, -0.56)
  horn.rotation.x = -1.9
  body.add(horn)

  const legs: THREE.Group[] = []
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1
    const j = i % 3
    const hip = new THREE.Group()
    hip.position.set(side * 0.24, -0.02, -0.3 + j * 0.3)
    hip.rotation.z = side * 1.1
    hip.add(box(0.05, 0.26, 0.05, PAL.bug, 0, -0.13, 0))
    body.add(hip)
    legs.push(hip)
  }
  g.userData.parts = { body, legs } satisfies CritterParts
  return g
}

export function skitter(g: THREE.Group, t: number, rate = 1) {
  const p = g.userData.parts as CritterParts
  p.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(t * 14 * rate + i * 1.7) * 0.42
  })
  p.body.rotation.z = Math.sin(t * 7 * rate) * 0.06
}

/* ---------------------------------------------------------------- health */

export const HEALTH_SEGMENTS = 6

export interface HealthRing {
  group: THREE.Group
  segments: THREE.Mesh[]
}

/**
 * The gauge on his back. The overhead camera looks at it the whole run, which
 * is the only reason this can replace a bar at the top of the screen — and why
 * it has to be oversized relative to the pack and read by colour and count
 * rather than by fine gradation.
 */
export function makeHealthRing(): HealthRing {
  const group = new THREE.Group()
  const segments: THREE.Mesh[] = []
  const R = 0.46
  const gap = 0.16
  const step = (Math.PI * 2) / HEALTH_SEGMENTS
  // Backing plate, so the ring reads against his coat rather than through it
  const plate = new THREE.Mesh(new THREE.CircleGeometry(R + 0.1, 16), mat(0x2b241c))
  plate.position.z = -0.02
  group.add(plate)
  for (let i = 0; i < HEALTH_SEGMENTS; i++) {
    const geo = new THREE.TorusGeometry(R, 0.075, 5, 8, step - gap)
    const seg = new THREE.Mesh(geo, mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.5 }))
    seg.rotation.z = Math.PI / 2 - i * step - (step - gap) / 2
    group.add(seg)
    segments.push(seg)
  }
  return { group, segments }
}

/** Gold while healthy, amber at two, red and pulsing at one. */
export function setHealthRing(ring: HealthRing, lit: number, t: number) {
  const colour = lit <= 1 ? PAL.hazard : lit <= 2 ? PAL.ochre : PAL.gold
  const pulse = lit <= 1 ? 0.5 + Math.abs(Math.sin(t * 6)) * 0.9 : 0.55
  ring.segments.forEach((seg, i) => {
    const on = i < lit
    seg.material = on
      ? mat(colour, { emissive: colour, emissiveIntensity: pulse })
      : mat(0x3b3a33)
  })
}

/** A segment knocked loose, to be thrown backwards and tumbled by the scene. */
export function makeRingShard(): THREE.Mesh {
  const step = (Math.PI * 2) / HEALTH_SEGMENTS
  const shard = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.075, 5, 8, step - 0.16),
    mat(PAL.hazard, { emissive: PAL.hazard, emissiveIntensity: 0.8 }),
  )
  shard.visible = false
  return shard
}

/* --------------------------------------------------------- boulder tally */

/** The five faces of the countdown, drawn once and swapped by index. */
export function tallyTextures(): THREE.CanvasTexture[] {
  return [5, 4, 3, 2, 1].map((n) => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const colour = n >= 4 ? '#cfc7ad' : n >= 2 ? '#e8a13c' : '#4fb286'
    ctx.fillStyle = 'rgba(20,16,22,0.82)'
    ctx.beginPath()
    ctx.roundRect(18, 10, 92, 108, 10)
    ctx.fill()
    ctx.strokeStyle = colour
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.fillStyle = colour
    ctx.fillRect(18, 10, 92, 16)
    ctx.font = 'bold 74px Cinzel, Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), 64, 74)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
}

/* --------------------------------------------------------------- pickups */

/** Gold coin stamped with a glyph — the thing you take risks for. */
export function makeCoin(): THREE.Group {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 12), mat(PAL.gold, { emissive: PAL.goldDeep, emissiveIntensity: 0.35 }))
  disc.rotation.x = Math.PI / 2
  disc.castShadow = true
  g.add(disc)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.045, 5, 14), mat(PAL.goldDeep))
  g.add(rim)
  for (const z of [0.05, -0.05]) {
    g.add(box(0.13, 0.13, 0.02, PAL.goldDeep, 0, 0, z))
    g.add(box(0.06, 0.06, 0.03, PAL.gold, 0, 0, z * 1.4))
  }
  return g
}

/**
 * A heart. Maya carries a jade one; Egypt a faience scarab. They spawn in
 * clear lanes — the exact inverse of the coin runs, so gold and life pull in
 * opposite directions across the road.
 */
export function makeHeart(colour: number, scarab: boolean): THREE.Group {
  const g = new THREE.Group()
  if (scarab) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(colour, { emissive: colour, emissiveIntensity: 0.35 }))
    shell.scale.set(1, 0.8, 1.3)
    g.add(shell)
    g.add(box(0.03, 0.26, 0.78, PAL.lapis, 0, 0.22, 0))
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(PAL.egyptGold, { emissive: PAL.egyptGold, emissiveIntensity: 0.3 }))
    head.position.z = -0.36
    g.add(head)
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        g.add(box(0.05, 0.05, 0.22, PAL.egyptGold, side * 0.3, 0, -0.2 + i * 0.22))
      }
    }
  } else {
    for (const side of [-1, 1]) {
      const lobe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 1), mat(colour, { emissive: colour, emissiveIntensity: 0.4 }))
      lobe.position.set(side * 0.15, 0.13, 0)
      g.add(lobe)
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.44, 6), mat(colour, { emissive: colour, emissiveIntensity: 0.4 }))
    tip.position.y = -0.18
    tip.rotation.x = Math.PI
    g.add(tip)
    g.add(box(0.5, 0.06, 0.06, PAL.gold, 0, 0.02, 0.2))
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** The jade idol: rare, always parked somewhere expensive to reach. */
export function makeIdol(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.46, 0.12, 0.46, PAL.rockDark, 0, -0.34, 0))
  g.add(box(0.36, 0.1, 0.36, PAL.cinnabar, 0, -0.24, 0))
  const torso = box(0.32, 0.34, 0.26, PAL.jade, 0, -0.02, 0)
  g.add(torso)
  g.add(box(0.1, 0.22, 0.1, PAL.jade, -0.2, -0.04, 0))
  g.add(box(0.1, 0.22, 0.1, PAL.jade, 0.2, -0.04, 0))
  const head = box(0.3, 0.26, 0.26, PAL.jade, 0, 0.28, 0)
  g.add(head)
  g.add(box(0.08, 0.08, 0.04, PAL.obsidian, -0.07, 0.3, 0.14))
  g.add(box(0.08, 0.08, 0.04, PAL.obsidian, 0.07, 0.3, 0.14))
  g.add(box(0.16, 0.06, 0.04, PAL.gold, 0, 0.19, 0.14))
  // Headdress plumes
  for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 1.5
    const plume = box(0.08, 0.3, 0.06, i % 2 ? PAL.gold : PAL.turquoise, Math.sin(a) * 0.2, 0.52 + Math.cos(a) * 0.06, -0.02)
    plume.rotation.z = -a
    g.add(plume)
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/* ----------------------------------------------------------------- world */

/** Copal brazier: the only warm light source on the causeway. */
export function makeBrazier(): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const leg = box(0.1, 0.9, 0.1, PAL.obsidian, Math.sin(a) * 0.18, 0.45, Math.cos(a) * 0.18)
    leg.rotation.set(Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12)
    g.add(leg)
  }
  g.add(cyl(0.32, 0.22, 0.26, 8, PAL.rockDark, 0, 1.0, 0))
  g.add(cyl(0.34, 0.34, 0.06, 8, PAL.cinnabar, 0, 1.14, 0))
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), mat(PAL.flame, { emissive: PAL.flame, emissiveIntensity: 1.2 }))
  flame.position.y = 1.4
  g.add(flame)
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 1.5 }))
  inner.position.y = 1.35
  g.add(inner)
  g.userData.flame = flame
  return g
}

/** A carved stela: weathered limestone, relief bands, a mask panel. */
function makeStela(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  g.add(box(1.3, 0.34, 0.9, PAL.slabWorn, 0, 0.17, 0))
  g.add(box(1.0, 2.4, 0.46, PAL.slabDark, 0, 1.5, 0))
  g.add(box(1.12, 0.26, 0.56, PAL.cinnabar, 0, 2.83, 0))
  g.add(box(1.04, 0.14, 0.5, PAL.ochre, 0, 2.64, 0))
  // Carved relief: a mask panel over stacked bands, never a window grid.
  g.add(box(0.72, 0.62, 0.08, PAL.groove, 0, 2.05, 0.25))
  g.add(box(0.2, 0.14, 0.08, PAL.obsidian, -0.17, 2.16, 0.29))
  g.add(box(0.2, 0.14, 0.08, PAL.obsidian, 0.17, 2.16, 0.29))
  g.add(box(0.44, 0.1, 0.08, PAL.jade, 0, 1.88, 0.29))
  for (let i = 0; i < 3; i++) {
    g.add(box(0.84, 0.1, 0.06, r() > 0.5 ? PAL.groove : PAL.ochre, 0, 0.7 + i * 0.36, 0.24))
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** Feathered-serpent balustrade head, guarding the edge of the causeway. */
function makeSerpentHead(facing: number): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.8, 0.5, 1.0, PAL.plaster, 0, 0.35, 0))
  g.add(box(0.7, 0.3, 0.6, PAL.plaster, 0, 0.2, facing * 0.7))
  g.add(box(0.72, 0.16, 0.5, PAL.obsidian, 0, 0.08, facing * 0.72))
  g.add(box(0.2, 0.18, 0.16, PAL.cinnabar, -0.24, 0.5, facing * 0.42))
  g.add(box(0.2, 0.18, 0.16, PAL.cinnabar, 0.24, 0.5, facing * 0.42))
  g.add(box(0.09, 0.09, 0.08, PAL.gold, -0.24, 0.5, facing * 0.52))
  g.add(box(0.09, 0.09, 0.08, PAL.gold, 0.24, 0.5, facing * 0.52))
  for (const x of [-0.2, 0.2]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), mat(PAL.plaster))
    fang.position.set(x, 0.14, facing * 0.82)
    fang.rotation.x = Math.PI
    g.add(fang)
  }
  for (let i = 0; i < 4; i++) {
    const plume = box(0.12, 0.34, 0.1, i % 2 ? PAL.jade : PAL.turquoise, -0.3 + i * 0.2, 0.72, -facing * 0.2)
    plume.rotation.z = (i / 3 - 0.5) * 0.7
    g.add(plume)
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** Stepped pyramid on the skyline. Cheap: five boxes, a stair, a temple. */
export function makePyramid(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  const tiers = 5
  const base = 9 + r() * 3
  for (let i = 0; i < tiers; i++) {
    const w = base * (1 - i * 0.16)
    const tier = box(w, 1.5, w, i % 2 ? PAL.slabWorn : PAL.slabDark, 0, 0.75 + i * 1.5, 0)
    g.add(tier)
  }
  for (let i = 0; i < tiers * 3; i++) {
    const w = base * 0.24
    g.add(box(w, 0.26, 0.5, PAL.plaster, 0, 0.3 + i * 0.5, base * 0.5 - i * (base * 0.08) * 0.5))
  }
  const crownY = 0.75 + tiers * 1.5
  g.add(box(base * 0.3, 1.8, base * 0.3, PAL.plaster, 0, crownY + 0.9, 0))
  g.add(box(base * 0.34, 0.3, base * 0.34, PAL.cinnabar, 0, crownY + 1.95, 0))
  g.add(box(base * 0.12, 1.0, base * 0.12, PAL.cinnabar, 0, crownY + 2.5, 0))
  return g
}

/** A date palm: leaning trunk, fronds drooping off a crown. */
export function makePalm(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  const h = 4.4 + r() * 2.4
  const lean = (r() - 0.5) * 0.5
  const trunk = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const k = i / 7
    const seg = cyl(0.17 - k * 0.05, 0.2 - k * 0.05, h / 7 + 0.06, 6, PAL.palmTrunk, lean * k * h * 0.3, h * (k + 1 / 14), 0)
    trunk.add(seg)
  }
  g.add(trunk)
  const cx = lean * h * 0.3
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const frond = box(0.24, 0.1, 2.3 + r() * 0.7, i % 2 ? PAL.palmLeaf : PAL.palmLeafDeep, 0, 0, 1.15)
    const arm = new THREE.Group()
    arm.position.set(cx, h, 0)
    arm.rotation.y = a
    arm.rotation.x = -0.5 - r() * 0.35
    arm.add(frond)
    g.add(arm)
  }
  for (let i = 0; i < 3; i++) {
    const date = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(PAL.ochre))
    date.position.set(cx + Math.sin(i * 2) * 0.3, h - 0.3, Math.cos(i * 2) * 0.3)
    g.add(date)
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** An obelisk: tapered shaft, gilded pyramidion. */
export function makeObelisk(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(1.4, 0.5, 1.4, PAL.slabWorn, 0, 0.25, 0))
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 6.4, 4), mat(PAL.graniteRed))
  shaft.position.y = 3.7
  shaft.rotation.y = Math.PI / 4
  g.add(shaft)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.9, 4), mat(PAL.egyptGold, { emissive: PAL.egyptGold, emissiveIntensity: 0.25 }))
  cap.position.y = 7.3
  cap.rotation.y = Math.PI / 4
  g.add(cap)
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** Ram-headed sphinx on a plinth — the avenue piece. */
export function makeRamSphinx(facing: number): THREE.Group {
  const g = new THREE.Group()
  g.add(box(2.4, 0.5, 1.4, PAL.slabWorn, 0, 0.25, 0))
  g.add(box(2.0, 0.8, 1.0, PAL.sandLight, 0, 0.9, 0))
  g.add(box(0.7, 0.5, 0.9, PAL.sandLight, facing * 0.8, 1.55, 0))
  g.add(box(0.5, 0.42, 0.5, PAL.nemesFace, facing * 1.15, 1.6, 0))
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.09, 5, 10, Math.PI * 1.4), mat(PAL.sandDark))
    horn.position.set(facing * 1.05, 1.62, side * 0.28)
    horn.rotation.y = Math.PI / 2
    g.add(horn)
  }
  g.add(box(0.9, 0.16, 0.8, PAL.lapis, facing * 0.7, 1.9, 0))
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** The Great Sphinx: couchant body, forepaws, nemes with lappets. */
export function makeSphinx(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(9, 3.4, 4.4, PAL.sandLight, 0, 1.7, 0))
  g.add(box(3.4, 1.2, 4.4, PAL.sandDark, -2.6, 3.9, 0))
  g.add(box(4.6, 1.2, 3.4, PAL.nemesFace, 4.2, 0.6, 0))
  for (let i = 0; i < 3; i++) {
    g.add(box(0.5, 0.7, 3.2, PAL.sandDark, 5.8, 0.55, -1.2 + i * 1.2))
  }
  g.add(box(2.2, 2.6, 2.4, PAL.sandLight, 3.1, 4.6, 0))
  const head = new THREE.Group()
  head.position.set(3.3, 6.6, 0)
  g.add(head)
  head.add(box(2.6, 2.6, 3.0, PAL.lapis))
  for (let i = 0; i < 4; i++) {
    head.add(box(2.7, 0.3, 3.1, PAL.egyptGold, 0, 0.9 - i * 0.6, 0))
  }
  head.add(box(0.9, 2.0, 2.2, PAL.nemesFace, 1.1, -0.2, 0))
  head.add(box(0.2, 0.34, 0.34, PAL.obsidian, 1.55, 0.35, -0.6))
  head.add(box(0.2, 0.34, 0.34, PAL.obsidian, 1.55, 0.35, 0.6))
  head.add(box(0.5, 0.5, 0.5, PAL.egyptGold, 0.6, 1.5, 0))
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** Seated pharaoh: knees, fists, nemes, false beard. */
function makePharaoh(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  g.add(box(3.2, 0.7, 2.6, PAL.slabWorn, 0, 0.35, 0))
  g.add(box(2.6, 1.5, 2.0, PAL.sandDark, 0, 1.45, 0))
  g.add(box(0.8, 0.5, 0.8, PAL.sandLight, -0.8, 2.3, 0.7))
  g.add(box(0.8, 0.5, 0.8, PAL.sandLight, 0.8, 2.3, 0.7))
  g.add(box(1.8, 2.2, 1.3, PAL.sandLight, 0, 3.3, 0))
  g.add(box(1.9, 0.3, 1.4, PAL.faience, 0, 4.2, 0))
  const head = new THREE.Group()
  head.position.set(0, 5.0, 0)
  g.add(head)
  head.add(box(1.5, 1.2, 1.3, PAL.lapis))
  head.add(box(0.9, 1.0, 0.72, PAL.nemesFace, 0, -0.05, 0.4))
  head.add(box(0.2, 0.16, 0.1, PAL.obsidian, -0.22, 0.12, 0.76))
  head.add(box(0.2, 0.16, 0.1, PAL.obsidian, 0.22, 0.12, 0.76))
  head.add(box(1.6, 0.22, 1.4, PAL.egyptGold, 0, 0.66, 0))
  head.add(box(0.26, 0.7, 0.26, PAL.graniteRed, 0, -0.8, 0.5))
  g.rotation.y = (r() - 0.5) * 0.2
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** Smooth-sided pyramid with the casing still on at the apex. */
export function makeSmoothPyramid(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  // Fixed base: the zone's skyline scale does the growing, so the prop has to
  // start at a known size or a mid-transition frame puts it over the road.
  const w = 23 + r() * 3
  const h = w * 0.9
  const body = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, h, 4), mat(PAL.sandLight))
  body.position.y = h / 2
  body.rotation.y = Math.PI / 4
  g.add(body)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.16, h * 0.22, 4), mat(0xf2dfae))
  cap.position.y = h - h * 0.11
  cap.rotation.y = Math.PI / 4
  g.add(cap)
  return g
}

/** A colossal seated statue — the city's roadside dressing. */
function makeStatue(seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  g.add(box(2.6, 0.5, 2.0, PAL.rockDark, 0, 0.25, 0))
  g.add(box(2.2, 0.22, 1.7, PAL.cinnabar, 0, 0.6, 0))
  g.add(box(1.7, 2.1, 1.2, PAL.plaster, 0, 1.75, 0))
  g.add(box(0.5, 1.4, 0.5, PAL.slabWorn, -1.05, 1.6, 0))
  g.add(box(0.5, 1.4, 0.5, PAL.slabWorn, 1.05, 1.6, 0))
  g.add(box(1.15, 1.0, 1.0, PAL.slabWorn, 0, 3.3, 0))
  g.add(box(1.3, 0.22, 1.1, PAL.cinnabar, 0, 3.78, 0))
  g.add(box(0.3, 0.18, 0.1, PAL.obsidian, -0.26, 3.5, 0.53))
  g.add(box(0.3, 0.18, 0.1, PAL.obsidian, 0.26, 3.5, 0.53))
  g.add(box(0.8, 0.16, 0.12, PAL.obsidian, 0, 3.05, 0.53))
  g.add(box(0.44, 0.14, 0.12, PAL.gold, 0, 3.24, 0.55))
  for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 1.5
    const plume = box(0.3, 1.0, 0.24, i % 2 ? PAL.jade : PAL.turquoise, Math.sin(a) * 0.8, 4.2 + Math.cos(a) * 0.2, -0.1)
    plume.rotation.z = -a
    g.add(plume)
  }
  g.rotation.y = (r() - 0.5) * 0.3
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/** A run of fortress wall with battlements and a flame on top. */
function makeWallRun(biome: Biome, seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)
  g.add(box(1.1, 2.4, SEGMENT_LEN, biome.edge, 0, 1.2, -SEGMENT_LEN / 2))
  g.add(box(1.3, 0.3, SEGMENT_LEN, biome.edgeTop, 0, 2.5, -SEGMENT_LEN / 2))
  for (let i = 0; i < 6; i++) {
    g.add(box(1.3, 0.6, 1.1, biome.edgeTop, 0, 2.95, -i * 2 - 1))
  }
  if (r() > 0.4) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 6), mat(PAL.flame, { emissive: PAL.flame, emissiveIntensity: 1.2 }))
    flame.position.set(0, 3.7, -3 - r() * 6)
    g.add(flame)
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 6), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 1.5 }))
    inner.position.copy(flame.position)
    inner.position.y -= 0.15
    g.add(inner)
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/**
 * One 12m module of road. Modules are recycled eight at a time, so everything
 * here is cheap: no lights, emissive materials stand in for glow. The biome
 * decides the surface, the lane markers, the cadence markers, the edging and
 * the roadside dressing — the lane geometry never moves.
 */
export function makeTrackSegment(seed = 1, biome: Biome = WORLDS[0].zones[1]): THREE.Group {
  const g = new THREE.Group()
  const r = rnd(seed)

  for (let i = 0; i < 4; i++) {
    const z = -i * 3 - 1.5
    for (let l = 0; l < 3; l++) {
      const slab = box(LANE_X[1] + 1.72, 0.3, 2.86, (i + l) % 2 ? biome.surfaceLight : biome.surfaceDark, LANE_X[l], -0.15, z)
      slab.position.y += (r() - 0.5) * 0.015
      g.add(slab)
    }
    // The cadence marker across every joint: the speed read at 20 m/s.
    if (biome.edging === 'verge') {
      // Plank sleeper, proud of the earth and slightly uneven.
      // Half-buried sleepers: proud enough to pulse past at 20 m/s, not so
      // proud that the trail reads as a boardwalk.
      const plank = box(5.2, 0.1, 0.22, biome.marker, 0, -0.04, z + 1.5)
      plank.rotation.z = (r() - 0.5) * 0.02
      g.add(plank)
      g.add(box(5.2, 0.04, 0.07, biome.markerInlay, 0, 0.01, z + 1.44))
    } else {
      g.add(box(5.6, 0.22, 0.14, biome.marker, 0, -0.09, z + 1.5))
      for (let k = -2; k <= 2; k++) {
        if (r() < 0.4) continue
        g.add(box(0.2, 0.2, 0.16, biome.markerInlay, k * 1.1, -0.08, z + 1.5))
      }
    }
  }

  // Lane lines: carved grooves, worn cart ruts or obsidian inlay.
  for (const x of [-0.9, 0.9]) {
    if (biome.edging === 'verge') {
      g.add(box(0.22, 0.3, SEGMENT_LEN, biome.divider, x, -0.14, -SEGMENT_LEN / 2))
      g.add(box(0.07, 0.3, SEGMENT_LEN, biome.dividerHighlight, x + 0.12, -0.12, -SEGMENT_LEN / 2))
    } else {
      g.add(box(0.1, 0.34, SEGMENT_LEN, biome.divider, x, -0.07, -SEGMENT_LEN / 2))
    }
  }

  for (const side of [-1, 1]) {
    if (biome.edging === 'balustrade') {
      g.add(box(0.58, 0.52, SEGMENT_LEN, PAL.slabDark, side * 3.1, 0.06, -SEGMENT_LEN / 2))
      g.add(box(0.62, 0.12, SEGMENT_LEN, PAL.slabWorn, side * 3.1, 0.34, -SEGMENT_LEN / 2))
      for (let i = 0; i < 8; i++) {
        g.add(box(0.6, 0.12, 0.7, i % 2 ? PAL.cinnabar : PAL.jade, side * 3.1, 0.14, -i * 1.5 - 0.6))
      }
      const head = makeSerpentHead(1)
      head.position.set(side * 3.1, 0.1, -SEGMENT_LEN + 0.6)
      g.add(head)
    } else if (biome.edging === 'wall' || biome.edging === 'plinths') {
      const wall = makeWallRun(biome, seed * 3 + side)
      wall.position.set(side * 3.5, 0, 0)
      g.add(wall)
    } else if (biome.edging === 'relief') {
      // A low carved wall: the causeway is dressed, not walled in.
      g.add(box(0.6, 1.0, SEGMENT_LEN, biome.edge, side * 3.2, 0.5, -SEGMENT_LEN / 2))
      g.add(box(0.7, 0.16, SEGMENT_LEN, biome.edgeTop, side * 3.2, 1.05, -SEGMENT_LEN / 2))
      for (let i = 0; i < 6; i++) {
        g.add(box(0.64, 0.3, 0.9, i % 2 ? PAL.graniteRed : PAL.lapis, side * 3.2, 0.65, -i * 2 - 1))
      }
    } else if (biome.edging === 'berm') {
      // Sand banked up where the track has been worn below the dunes.
      g.add(box(1.3, 0.34, SEGMENT_LEN, biome.edge, side * 3.4, 0.05, -SEGMENT_LEN / 2))
      g.add(box(0.9, 0.16, SEGMENT_LEN, biome.edgeTop, side * 3.8, 0.2, -SEGMENT_LEN / 2))
      for (let i = 0; i < 5; i++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 4), mat(PAL.palmLeafDeep))
        tuft.position.set(side * (3.6 + r() * 0.8), 0.3, -r() * SEGMENT_LEN)
        g.add(tuft)
      }
    } else {
      // Trodden verge: earth banked up where feet have pushed it aside.
      g.add(box(0.7, 0.22, SEGMENT_LEN, biome.edge, side * 3.2, 0.02, -SEGMENT_LEN / 2))
      g.add(box(0.5, 0.1, SEGMENT_LEN, biome.edgeTop, side * 3.4, 0.12, -SEGMENT_LEN / 2))
      for (let i = 0; i < 4; i++) {
        const fern = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 + r() * 0.26, 0), mat(PAL.leaf))
        fern.position.set(side * (3.7 + r() * 0.5), 0.2, -r() * SEGMENT_LEN)
        fern.scale.y = 0.6
        g.add(fern)
      }
    }
    g.add(box(1.0, 0.3, SEGMENT_LEN, biome.ground, side * (biome.edging === 'wall' ? 4.4 : 3.9), -0.1, -SEGMENT_LEN / 2))

    // Roadside dressing
    if (biome.props === 'stelae') {
      if (r() > 0.45) {
        const stela = makeStela(seed * 7 + side * 3)
        stela.position.set(side * 4.6, 0, -2 - r() * 8)
        stela.rotation.y = side * 0.25
        g.add(stela)
      }
      if (r() > 0.5) {
        const br = makeBrazier()
        br.position.set(side * 4.2, 0, -1 - r() * 9)
        g.add(br)
      }
    } else if (biome.props === 'statues') {
      if (r() > 0.35) {
        const st = makeStatue(seed * 5 + side)
        st.position.set(side * 5.6, 0, -2 - r() * 8)
        g.add(st)
      }
    } else if (biome.props === 'desert') {
      // Bleached stone and a toppled marker, always off the running line.
      for (let i = 0; i < 3; i++) {
        const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 + r() * 0.3, 0), mat(PAL.sandWorn))
        stone.position.set(side * (2.6 + r() * 2.2), 0.05, -r() * SEGMENT_LEN)
        stone.scale.y = 0.55
        stone.castShadow = true
        g.add(stone)
      }
      if (r() > 0.7) {
        const marker = box(0.5, 2.2, 0.5, PAL.slabWorn, side * 4.6, 0.6, -r() * SEGMENT_LEN)
        marker.rotation.z = side * (0.5 + r() * 0.5)
        g.add(marker)
      }
    } else if (biome.props === 'sphinxes') {
      if (r() > 0.4) {
        const ram = makeRamSphinx(-side)
        ram.position.set(side * 4.3, 0, -1.5 - r() * 8)
        g.add(ram)
      }
      if (r() > 0.75) {
        const ob = makeObelisk()
        ob.position.set(side * 5.8, 0, -3 - r() * 6)
        g.add(ob)
      }
    } else if (biome.props === 'avenue') {
      // The full avenue: a sphinx every 4m, both sides, plus colossi.
      for (let i = 0; i < 3; i++) {
        const ram = makeRamSphinx(-side)
        ram.position.set(side * 4.2, 0, -i * 4 - 1.4)
        g.add(ram)
      }
      if (r() > 0.55) {
        const ph = makePharaoh(seed * 9 + side)
        ph.position.set(side * 6.6, 0, -3 - r() * 6)
        g.add(ph)
      }
    } else {
      // Stones and the odd fallen log, always off the running line.
      for (let i = 0; i < 3; i++) {
        const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r() * 0.22, 0), mat(PAL.rockDark))
        stone.position.set(side * (2.4 + r() * 1.4), 0.04, -r() * SEGMENT_LEN)
        stone.scale.y = 0.6
        stone.castShadow = true
        g.add(stone)
      }
      if (r() > 0.6) {
        const log = cyl(0.26, 0.3, 2.6 + r(), 6, PAL.trunk, side * 4.4, 0.26, -r() * SEGMENT_LEN)
        log.rotation.z = Math.PI / 2
        log.rotation.y = (r() - 0.5) * 0.8
        g.add(log)
      }
    }

    // Palms stand alone in open sand; the jungle comes in pairs with bushes.
    if (biome.trees === 'palm') {
      for (let i = 0; i < 2; i++) {
        if (r() > 0.55) continue
        const palm = makePalm(seed * 11 + i * 3 + side)
        palm.position.set(side * (5.2 + r() * 2.6), 0, -r() * SEGMENT_LEN)
        g.add(palm)
      }
    }
    if (biome.trees === 'jungle') {
      for (let i = 0; i < 2; i++) {
        const z = -r() * SEGMENT_LEN
        const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + r() * 0.6, 0), mat(r() > 0.5 ? PAL.leaf : PAL.leafDeep))
        bush.position.set(side * (5.3 + r() * 1.2), 0.3, z)
        bush.scale.y = 0.7
        bush.castShadow = true
        g.add(bush)
        const trunkX = side * (6.4 + r() * 2)
        g.add(cyl(0.24, 0.34, 5 + r() * 2, 6, PAL.trunk, trunkX, 2.5, z - 2 - r() * 4))
        const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 + r() * 0.7, 0), mat(PAL.leafDeep))
        canopy.position.set(trunkX, 5.2 + r(), z - 2 - r() * 4)
        canopy.scale.y = 0.6
        g.add(canopy)
      }
    }
  }

  g.userData.length = SEGMENT_LEN
  return g
}

/**
 * The gate between zones: a colossal idol whose open jaws are the doorway —
 * the zoomorphic portal the Maya built at Chicanná. The same face is carved on
 * the boulder chasing the player and on the idol they collect.
 *
 * The opening clears the full 5.6m road: the upper fangs hang at the corners
 * and the lower teeth sit in the threshold outside the road, so nothing ever
 * rises into a running lane.
 */
/** A seated jackal — Anubis on his shrine, flanking the pylon. */
function makeJackal(c: Biome['gate'], flip: number): THREE.Group {
  const g = new THREE.Group()
  g.add(box(2.0, 0.5, 2.2, c.jaw, 0, 0.25, 0))
  g.add(box(1.5, 2.1, 1.1, PAL.obsidian, 0, 1.55, -0.2))
  g.add(box(0.7, 0.5, 1.9, PAL.obsidian, 0, 0.75, 0.7))
  const head = new THREE.Group()
  head.position.set(0, 3.0, 0)
  g.add(head)
  head.add(box(1.0, 0.9, 1.0, PAL.obsidian))
  head.add(box(0.6, 0.45, 1.1, PAL.obsidian, 0, -0.1, 0.8))
  head.add(box(0.26, 0.2, 0.12, c.pupil, 0.24 * flip, 0.18, 0.5, { emissive: c.pupil, emissiveIntensity: c.pupilGlow }))
  head.add(box(0.26, 0.2, 0.12, c.pupil, -0.24 * flip, 0.18, 0.5, { emissive: c.pupil, emissiveIntensity: c.pupilGlow }))
  for (const side of [-1, 1]) {
    const ear = box(0.3, 1.0, 0.24, PAL.obsidian, side * 0.34, 0.85, -0.1)
    ear.rotation.z = side * 0.12
    head.add(ear)
  }
  head.add(box(1.2, 0.22, 1.1, PAL.egyptGold, 0, 0.3, -0.05))
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/**
 * Egypt's gate: a pylon — two battered towers with the road between them —
 * flanked by colossal seated jackals, under a winged sun disc. It transposes
 * the Mayan rule rather than repeating it: the gate is still the thing hunting
 * you, made enormous.
 */
function makePylonGate(c: Biome['gate']): THREE.Group {
  const g = new THREE.Group()
  const H = c.height
  const OPEN = 6.4
  const TOWER = 3.4
  for (const side of [-1, 1]) {
    const x = side * (OPEN / 2 + TOWER / 2)
    // Battered face: a squat pyramid frustum reads as the slope.
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(TOWER * 0.42, TOWER * 0.6, H, 4), mat(c.face))
    tower.position.set(x, H / 2, 0)
    tower.rotation.y = Math.PI / 4
    tower.scale.z = 0.7
    g.add(tower)
    g.add(box(TOWER + 0.5, 0.7, 2.6, c.brow, x, H - 0.35, 0))
    // Flagstaff niches
    for (let i = 0; i < 3; i++) {
      g.add(box(0.36, H * 0.5, 0.3, PAL.lapis, x + (i - 1) * 0.9, H * 0.45, 1.05))
    }
    const jackal = makeJackal(c, side)
    jackal.position.set(side * (OPEN / 2 - 0.9), 0, 2.6)
    jackal.rotation.y = side * 0.18
    g.add(jackal)
  }
  // Lintel and the winged disc
  g.add(box(OPEN + TOWER * 2 + 1, 1.2, 2.8, c.face, 0, H - 0.6, 0))
  g.add(box(OPEN + TOWER * 2 + 1.6, 0.5, 3.2, c.brow, 0, H + 0.3, 0))
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 12), mat(PAL.egyptGold, { emissive: PAL.egyptGold, emissiveIntensity: 0.4 }))
  disc.rotation.x = Math.PI / 2
  disc.position.set(0, H - 1.4, 1.5)
  g.add(disc)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const feather = box(1.5 - i * 0.2, 0.3, 0.3, i % 2 ? PAL.lapis : PAL.egyptGold, side * (1.4 + i * 1.2), H - 1.4 + i * 0.16, 1.5)
      feather.rotation.z = side * -0.1 * i
      g.add(feather)
    }
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

export function makeGate(biome: Biome): THREE.Group {
  if (biome.gate.style === 'pylon') return makePylonGate(biome.gate)
  const g = new THREE.Group()
  const c = biome.gate
  const H = c.height
  const OPEN = 6.4 // clears the 5.6m road
  const JAMB = 2.2
  const halfFace = OPEN / 2 + JAMB

  for (const side of [-1, 1]) {
    const x = side * (OPEN / 2 + JAMB / 2)
    g.add(box(JAMB, H, 2.4, c.face, x, H / 2, 0))
    g.add(box(JAMB + 0.3, 0.9, 2.7, c.brow, x, H - 0.45, 0))
    // Eye socket, set into the jamb above the jaw line
    const eye = box(1.5, 1.0, 0.5, c.eye, x, H * 0.62, 1.3)
    g.add(eye)
    const pupil = box(0.7, 0.5, 0.3, c.pupil, x, H * 0.62, 1.55, {
      emissive: c.pupil,
      emissiveIntensity: c.pupilGlow,
    })
    g.add(pupil)
    // Ear flare
    g.add(box(0.7, H * 0.4, 1.6, c.brow, side * (halfFace + 0.3), H * 0.55, 0))
    // Lower tooth, in the threshold and outside the road
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.2, 5), mat(c.fang))
    tooth.position.set(side * (OPEN / 2 - 0.5), 0.6, 1.1)
    g.add(tooth)
    // Upper fang, hung at the corner of the opening
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.5, 5), mat(c.fang))
    fang.position.set(side * (OPEN / 2 - 0.5), H * 0.46 - 0.75, 1.1)
    fang.rotation.x = Math.PI
    g.add(fang)
  }

  // Brow above the jaws, and the snout between the eyes
  g.add(box(halfFace * 2, H * 0.5, 2.4, c.face, 0, H * 0.75, 0))
  g.add(box(halfFace * 2 + 0.6, 1.0, 2.8, c.brow, 0, H - 0.5, 0))
  g.add(box(2.2, 0.9, 0.8, c.brow, 0, H * 0.56, 1.5))
  // Threshold: the lower jaw the runner crosses
  g.add(box(halfFace * 2, 0.24, 2.6, c.jaw, 0, 0.12, 0))

  if (c.crest) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2
      const plume = box(0.5, 1.6, 0.4, i % 2 ? c.crest[0] : c.crest[1], Math.sin(a) * halfFace * 0.8, H + 0.7 + Math.cos(a) * 0.3, 0)
      plume.rotation.z = -a * 0.5
      g.add(plume)
    }
  }
  if (c.vines) {
    for (let i = 0; i < 6; i++) {
      const x = (i / 5 - 0.5) * halfFace * 2
      g.add(box(0.12, 1.2 + (i % 3) * 0.7, 0.12, PAL.vine, x, H - 0.9, 1.3))
    }
    for (let i = 0; i < 4; i++) {
      const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), mat(PAL.moss))
      moss.position.set((i / 3 - 0.5) * halfFace * 1.8, H * (0.3 + 0.4 * (i % 2)), 1.25)
      moss.scale.set(1, 0.5, 0.3)
      g.add(moss)
    }
  }
  if (c.tunnel) {
    // A throat behind the jaws — the only gate with an inside.
    for (const side of [-1, 1]) {
      g.add(box(JAMB, H, 7, c.face, side * (OPEN / 2 + JAMB / 2), H / 2, -4.6))
    }
    g.add(box(halfFace * 2, 1.6, 7, c.face, 0, H - 0.8, -4.6))
    g.add(box(halfFace * 2 + 1.2, 1.2, 8.4, c.brow, 0, H + 0.4, -4.6))
    for (let i = 0; i < 7; i++) {
      g.add(box(1.2, 1.0, 1.2, c.face, -halfFace + 0.6 + i * (halfFace / 3.2), H + 1.4, -4.6))
    }
  }

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}

/* ----------------------------------------------------------------- light */

/**
 * A gradient sky dome. One unlit sphere, no fog, one draw call — and it is
 * the difference between "a scene" and "a void above a road".
 */
export function makeSky(stops: readonly string[] = ['#3f7f8e', '#82aea2', '#d6d9b4', '#b9bd98']): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const ctx = c.getContext('2d')!
  const grd = ctx.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, stops[0])
  grd.addColorStop(0.42, stops[1])
  grd.addColorStop(0.72, stops[2])
  grd.addColorStop(1, stops[3])
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(190, 16, 12),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }),
  )
  sky.renderOrder = -1
  return sky
}

/** Soft blob shadow for studio turntables — no shadow map needed. */

export function contactShadow(radius = 1.3, opacity = 0.4): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,0.6)')
  grd.addColorStop(0.5, 'rgba(0,0,0,0.25)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }),
  )
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.01
  return m
}

/**
 * Three lights everywhere: a cool sky bounce, a warm key from behind-left so
 * boulders throw their shadows forward up the track, and a dim rim so
 * silhouettes hold against the fog.
 */
export function lightRig(scene: THREE.Scene, { key = 1.4, shadow = false } = {}): THREE.DirectionalLight {
  scene.add(new THREE.HemisphereLight(0xcfe4e0, 0x5a4a32, 0.9))
  const sun = new THREE.DirectionalLight(0xfff2d6, key)
  sun.position.set(-6, 10, 9)
  if (shadow) {
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const c = sun.shadow.camera
    c.left = -16
    c.right = 16
    c.top = 14
    c.bottom = -26
    c.near = 1
    c.far = 64
    sun.shadow.bias = -0.0015
    sun.shadow.normalBias = 0.02
  }
  scene.add(sun)
  scene.add(sun.target)
  const rim = new THREE.DirectionalLight(0x9fd8c6, 0.55)
  rim.position.set(6, 5, -9)
  scene.add(rim)
  return sun
}
