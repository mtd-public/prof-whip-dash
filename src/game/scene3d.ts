/**
 * The renderer. It owns no game state — every frame it reads a World and
 * moves pooled meshes to match, so the simulation stays testable on its own.
 */
import * as THREE from 'three'
import * as K from './kit'
import { BIOMES, biomeForLevel, PAL, type Biome } from './palette'
import { LANE_X, TUNING, type World } from './physics'
import type { GamePhase } from './types'

const SEG_N = 8
const SPAN = K.SEGMENT_LEN * SEG_N
/** How far the recycled strip reaches behind the runner. */
const BEHIND = 26
const PYRAMID_N = 3
const PYRAMID_SPAN = 180

/**
 * Where the camera sits relative to the runner. `side` is what turns the
 * straight-on chase into an overhead diagonal: push the camera off the centre
 * line while it keeps looking down the track.
 */
export interface CameraRig {
  /** Metres above the slabs. */
  height: number
  /** Metres behind the runner. */
  back: number
  /** Metres to the right of the centre line. */
  side: number
  /** Look-at point, metres ahead of the runner (negative = ahead). */
  lookAhead: number
  /** Look-at point sideways. An off-axis camera needs this to frame the
   *  runner — without it he drifts to the edge as `side` grows. */
  lookSide: number
  /** Height of the look-at point. */
  lookHeight: number
  fov: number
  /** How much of the runner's lane offset the camera follows, 0–1. */
  follow: number
}

/**
 * The overhead diagonal, dialled in on the camera study page. `follow: 0`
 * means the camera is locked: the runner moves across the frame when he
 * changes lane instead of the world sliding under a centred runner.
 */
export const CHASE_RIG: CameraRig = {
  height: 16,
  back: 18,
  side: 8,
  lookAhead: -12.5,
  lookSide: -2,
  lookHeight: -0.1,
  fov: 43,
  follow: 0,
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

const DUST_N = 40

interface Dust {
  mesh: THREE.Mesh
  age: number
  life: number
  size0: number
  size1: number
  vx: number
}

/** Soft round dust puff, drawn once into a canvas texture. */
function dustTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class Scene3D {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(55, 0.5, 0.1, 260)
  private sun: THREE.DirectionalLight
  private segments: THREE.Group[] = []
  private pyramids: THREE.Group[] = []
  private runner = K.makeRunner()
  private boulders: THREE.Group[] = []
  private spiders: THREE.Group[] = []
  private scarabs: THREE.Group[] = []
  private coins: THREE.Group[] = []
  private idols: THREE.Group[] = []
  private scroll = 0
  private attractX = 0
  /** Where each module sat last frame, so a wrap can be detected. */
  private segZ: number[] = []
  private segBiome: Biome[] = []
  private biome: Biome = BIOMES[0]
  /** Set when the level changes; modules adopt it as they recycle. */
  private pendingBiome: Biome | null = null
  private gate: THREE.Group | null = null
  private gateZ = 0
  private dust: Dust[] = []
  private dustTimer = 0
  private lastLane = 1
  /** Last frame's boulder z, so roll rate can follow true ground speed. */
  private boulderZ = [0, 0, 0]
  private rig: CameraRig = { ...CHASE_RIG }

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.06
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Distant geometry fades into a pale jungle haze rather than to black,
    // and the sky dome carries the colour above the horizon line.
    this.scene.background = new THREE.Color(0xb9bd98)
    this.scene.fog = new THREE.FogExp2(0xadb894, 0.011)
    this.scene.add(K.makeSky())
    this.sun = K.lightRig(this.scene, { key: 1.45, shadow: true })

    for (let i = 0; i < SEG_N; i++) {
      this.segments.push(this.buildSegment(i, this.biome))
      this.segZ.push(0)
      this.segBiome.push(this.biome)
    }

    // Dust pool: flat quads lying on the ground, which is the read that works
    // under an overhead camera — a billboard would edge-on and vanish.
    const tex = dustTexture()
    for (let i = 0; i < DUST_N; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }),
      )
      m.rotation.x = -Math.PI / 2
      m.visible = false
      this.scene.add(m)
      this.dust.push({ mesh: m, age: 0, life: 0, size0: 0.25, size1: 0.7, vx: 0 })
    }

    for (let i = 0; i < PYRAMID_N; i++) {
      const p = K.makePyramid(i + 3)
      p.position.set((i % 2 ? 1 : -1) * (30 + i * 6), -1, 0)
      p.rotation.y = (i % 2 ? 1 : -1) * 0.4
      this.scene.add(p)
      this.pyramids.push(p)
    }

    this.runner.rotation.y = Math.PI
    this.runner.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    this.scene.add(this.runner)

    const variants: K.BoulderVariant[] = ['limestone', 'mossy', 'kukulkan']
    for (let i = 0; i < 3; i++) {
      const b = K.makeBoulder(variants[i], 3 + i * 4)
      b.scale.setScalar(1.12)
      b.position.set(LANE_X[i], 1.25, TUNING.idleZ)
      b.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true
      })
      this.scene.add(b)
      this.boulders.push(b)
    }

    const stock = <T extends THREE.Group>(make: () => T, n: number, scale: number, into: T[]) => {
      for (let i = 0; i < n; i++) {
        const m = make()
        m.scale.setScalar(scale)
        m.visible = false
        m.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) o.castShadow = true
        })
        this.scene.add(m)
        into.push(m)
      }
    }
    stock(K.makeSpider, 6, 1.45, this.spiders)
    stock(K.makeScarab, 6, 1.45, this.scarabs)
    stock(K.makeCoin, 44, 1, this.coins)
    stock(K.makeIdol, 3, 1.15, this.idols)
  }

  private buildSegment(i: number, biome: Biome): THREE.Group {
    const seg = K.makeTrackSegment(i + 1, biome)
    seg.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.receiveShadow = true
    })
    this.scene.add(seg)
    return seg
  }

  private disposeSegment(seg: THREE.Group) {
    this.scene.remove(seg)
    seg.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.geometry.dispose()
    })
  }

  /** Swap the camera rig. Used by the camera study page and by presets. */
  setRig(rig: Partial<CameraRig>) {
    this.rig = { ...this.rig, ...rig }
    if (this.camera.fov !== this.rig.fov) {
      this.camera.fov = this.rig.fov
      this.camera.updateProjectionMatrix()
    }
  }

  getRig(): CameraRig {
    return { ...this.rig }
  }

  resize(w: number, h: number) {
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  /** Move the world; called every frame whatever the phase. */
  private scrollTrack(distance: number) {
    this.scroll += distance
    this.segments.forEach((seg, i) => {
      const z = mod(this.scroll + i * K.SEGMENT_LEN, SPAN) - (SPAN - BEHIND)
      // A module that jumps backwards has just recycled behind the camera:
      // that is the moment to rebuild it in the new zone, so the boundary
      // enters at the far end and sweeps toward the runner.
      if (z < this.segZ[i] - K.SEGMENT_LEN && this.pendingBiome && this.segBiome[i] !== this.pendingBiome) {
        const biome = this.pendingBiome
        this.disposeSegment(seg)
        const rebuilt = this.buildSegment(i, biome)
        rebuilt.position.z = z
        this.segments[i] = rebuilt
        this.segBiome[i] = biome
        if (!this.gate) this.spawnGate(biome, z - K.SEGMENT_LEN)
        if (this.segBiome.every((b) => b === biome)) {
          this.biome = biome
          this.pendingBiome = null
        }
      } else {
        seg.position.z = z
      }
      this.segZ[i] = z
    })
    const city = (this.pendingBiome ?? this.biome).edging === 'wall'
    this.pyramids.forEach((p, i) => {
      p.position.z = mod(this.scroll * 0.8 + i * (PYRAMID_SPAN / PYRAMID_N), PYRAMID_SPAN) - (PYRAMID_SPAN - 20)
      // In the city they are architecture, not skyline: closer and bigger.
      const targetX = (i % 2 ? 1 : -1) * ((city ? 19 : 30) + i * 6)
      const targetScale = city ? 1.5 : 1
      p.position.x += (targetX - p.position.x) * 0.02
      p.scale.setScalar(p.scale.x + (targetScale - p.scale.x) * 0.02)
    })
  }

  private spawnGate(biome: Biome, z: number) {
    const gate = K.makeGate(biome)
    gate.position.set(0, 0, z)
    this.scene.add(gate)
    this.gate = gate
    this.gateZ = z
  }

  /** Heel dust while running, and a wider scuff out of every lane change. */
  private emitDust(x: number, z: number, count: number, spread: number, colour: number) {
    for (let n = 0; n < count; n++) {
      const p = this.dust.find((d) => d.life <= 0)
      if (!p) return
      p.age = 0
      p.life = 0.34 + Math.random() * 0.16
      p.size0 = 0.26 + Math.random() * 0.12
      p.size1 = p.size0 + 0.46 + Math.random() * 0.24
      p.vx = (Math.random() - 0.5) * spread
      p.mesh.visible = true
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.3, 0.06, z + (Math.random() - 0.5) * 0.3)
      ;(p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colour)
    }
  }

  private updateDust(dt: number, speed: number) {
    for (const p of this.dust) {
      if (p.life <= 0) continue
      p.age += dt
      if (p.age >= p.life) {
        p.life = 0
        p.mesh.visible = false
        continue
      }
      const k = p.age / p.life
      // Dust is world-anchored: it slides back with the ground, not with him.
      p.mesh.position.z += speed * dt
      p.mesh.position.x += p.vx * dt
      const size = p.size0 + (p.size1 - p.size0) * k
      p.mesh.scale.set(size, size, 1)
      ;(p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k * k)
    }
  }

  update(world: World, phase: GamePhase, dt: number, t: number) {
    const playing = phase === 'playing'
    const speed = playing ? world.speed : 9

    // The zone follows the level, and the theme loops every three.
    const wanted = biomeForLevel(playing ? world.level : 1)
    if (wanted !== this.biome && wanted !== this.pendingBiome) this.pendingBiome = wanted

    if (phase !== 'paused') this.scrollTrack(speed * dt)

    if (this.gate) {
      this.gateZ += speed * dt
      this.gate.position.z = this.gateZ
      if (this.gateZ > BEHIND) {
        this.scene.remove(this.gate)
        this.gate.traverse((o) => {
          const m = o as THREE.Mesh
          if (m.isMesh) m.geometry.dispose()
        })
        this.gate = null
      }
    }

    // --- runner ----------------------------------------------------------
    let laneX: number
    if (playing) {
      laneX = world.laneX
    } else {
      // Attract loop: he keeps running, so the first frame is the game.
      const target = LANE_X[t % 6 < 3 ? 1 : 2]
      this.attractX += (target - this.attractX) * Math.min(1, dt * 4)
      laneX = this.attractX
    }
    this.runner.position.x = laneX
    this.runner.rotation.z = (LANE_X[playing ? world.lane : 1] - laneX) * 0.3
    if (phase !== 'paused') K.runCycle(this.runner, t, playing && world.stumble > 0 ? 0.6 : 1)
    const whipK = playing ? world.whipK : ((t * 0.6) % 2.4 < 1 ? (t * 0.6) % 2.4 : -1)
    K.crackWhip(this.runner, whipK)

    // --- boulders --------------------------------------------------------
    this.boulders.forEach((b, i) => {
      const data = playing ? world.boulders[i] : null
      const z = data ? data.z : i === 0 ? TUNING.grindZ + 1.2 : TUNING.idleZ
      // While rolling away it is moving fast down its lane, so track it
      // exactly instead of easing — the lag would read as sliding.
      const x = LANE_X[i] + (data ? data.offsetX : 0)
      if (data && data.despawning > 0) {
        b.position.z = z
        b.position.x = x
      } else {
        b.position.z += (z - b.position.z) * Math.min(1, dt * 12)
        b.position.x += (x - b.position.x) * Math.min(1, dt * 3)
      }
      b.position.y = 1.25 + Math.sin(t * 9 + i) * 0.04
      b.scale.setScalar(1.12)

      // Roll rate follows the block's own speed over the slabs: the world
      // slides toward the camera at `speed`, and its own z drift subtracts
      // from that, so a boulder dropping back visibly slows its spin.
      const drift = dt > 0 ? (b.position.z - this.boulderZ[i]) / dt : 0
      this.boulderZ[i] = b.position.z
      b.rotation.x -= (Math.max(0, speed - drift) / 1.25) * dt
    })

    // --- pooled actors ---------------------------------------------------
    let spider = 0
    let scarab = 0
    if (playing) {
      for (const c of world.critters) {
        const pool = c.kind === 'spider' ? this.spiders : this.scarabs
        const idx = c.kind === 'spider' ? spider++ : scarab++
        const m = pool[idx]
        if (!m) continue
        m.visible = true
        m.position.set(LANE_X[c.lane], 0.04, c.z)
        if (c.dying) {
          const k = Math.min(1, c.dying * 5)
          m.scale.setScalar(1.45 * (1 - k))
          m.rotation.z += dt * 18
          m.position.y = 0.04 + k * 0.9
        } else {
          m.scale.setScalar(1.45)
          m.rotation.z = 0
          K.skitter(m, t, 1.3)
        }
      }
    }
    for (let i = spider; i < this.spiders.length; i++) this.spiders[i].visible = false
    for (let i = scarab; i < this.scarabs.length; i++) this.scarabs[i].visible = false

    let coin = 0
    let idol = 0
    if (playing) {
      for (const p of world.pickups) {
        const pool = p.kind === 'coin' ? this.coins : this.idols
        const idx = p.kind === 'coin' ? coin++ : idol++
        const m = pool[idx]
        if (!m) continue
        m.visible = true
        const bob = Math.sin(t * 2.6 + p.id) * 0.08
        if (p.kind === 'coin') {
          m.position.set(LANE_X[p.lane], 1.05 + bob, p.z)
          m.rotation.y = t * 3.2 + p.id
        } else {
          m.position.set(LANE_X[p.lane], 1.0 + bob, p.z)
          m.rotation.y = t * 1.4
        }
        if (p.taken) {
          const k = Math.min(1, p.taken * 4)
          m.scale.setScalar((p.kind === 'idol' ? 1.15 : 1) * (1 + k) * (1 - k * 0.9))
          m.position.y += k * 1.6
        } else {
          m.scale.setScalar(p.kind === 'idol' ? 1.15 : 1)
        }
      }
    }
    for (let i = coin; i < this.coins.length; i++) this.coins[i].visible = false
    for (let i = idol; i < this.idols.length; i++) this.idols[i].visible = false

    // --- dust ------------------------------------------------------------
    if (phase !== 'paused') {
      const dustColour = (this.pendingBiome ?? this.biome).dust
      this.dustTimer -= dt
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.14
        this.emitDust(laneX, 0.35, 1, 0.3, dustColour)
      }
      if (playing && world.lane !== this.lastLane) {
        this.emitDust(laneX, 0.35, 6, 3.2, dustColour)
        this.lastLane = world.lane
      }
      this.updateDust(dt, speed)
    }

    // --- camera ----------------------------------------------------------
    const shake = playing ? world.shake : 0
    const rig = this.rig
    this.camera.position.set(
      rig.side + laneX * rig.follow + (Math.random() - 0.5) * shake,
      rig.height + (Math.random() - 0.5) * shake,
      rig.back,
    )
    this.camera.lookAt(rig.lookSide + laneX * rig.follow * 0.5, rig.lookHeight, rig.lookAhead)

    // Key light sits behind the runner so boulders throw their shadows
    // forward, up the lane he is about to run through.
    this.sun.position.set(laneX - 6, 10, 10)
    this.sun.target.position.set(laneX, 0, -5)
    this.sun.target.updateMatrixWorld()

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.geometry.dispose()
    })
  }
}

export { PAL }
