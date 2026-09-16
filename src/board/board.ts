/**
 * The art bible page. Every panel is a plain 2D canvas in normal flow; one
 * shared WebGL context renders each scene at that panel's size and blits the
 * pixels across. That keeps the page to a single GL context (phones are
 * strict about this) and lets the cards keep opaque backgrounds.
 *
 * The hero panel is the exception: it runs the real game — same Scene3D, same
 * physics — with a small autopilot, so the board can never drift from the
 * build it is documenting.
 */
import * as THREE from 'three'
import * as K from '../game/kit'
import { LANE_X } from '../game/physics'
import { createDemo } from './demoRun'
import './board.css'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

/* ----------------------------------------------------------- hero: the game */
function bootHero() {
  const canvas = document.getElementById('v-hero') as HTMLCanvasElement | null
  if (canvas) createDemo(canvas)
}

/* ------------------------------------------------- shared turntable renderer */
interface View {
  el: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  visible: boolean
  spin: number
  drag: number
  update: (t: number, dt: number) => void
}

const views: View[] = []
const gl = document.createElement('canvas')
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true })
const dpr = Math.min(window.devicePixelRatio || 1, 2)
renderer.setPixelRatio(dpr)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.06
renderer.setScissorTest(true)

let glW = 0
let glH = 0

function sizeGL() {
  let w = 1
  let h = 1
  for (const v of views) {
    w = Math.max(w, v.el.clientWidth)
    h = Math.max(h, v.el.clientHeight)
  }
  glW = w
  glH = h
  renderer.setSize(w, h, false)
}

type Build = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, view: View) => (t: number, dt: number) => void

function addView(
  id: string,
  build: Build,
  { fov = 36, pos = [0, 1.4, 5], look = [0, 0.9, 0] }: { fov?: number; pos?: number[]; look?: number[] } = {},
) {
  const el = document.getElementById(id) as HTMLCanvasElement | null
  if (!el) return
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200)
  camera.position.set(pos[0], pos[1], pos[2])
  camera.lookAt(look[0], look[1], look[2])
  const view: View = {
    el,
    ctx: el.getContext('2d')!,
    scene,
    camera,
    visible: true,
    spin: 0,
    drag: 0,
    update: () => {},
  }
  view.update = build(scene, camera, view)
  views.push(view)
  new IntersectionObserver(([entry]) => {
    view.visible = entry.isIntersecting
  }, { rootMargin: '150px' }).observe(el)
}

interface TurntableOpts {
  scale?: number
  y?: number
  ground?: number
  rate?: number
  animate?: (model: THREE.Group, t: number, dt: number) => void
}

function turntable(make: () => THREE.Group, opts: TurntableOpts = {}): Build {
  const { scale = 1, y = 0, ground = 1.3, rate = 0.45, animate } = opts
  return (scene, _camera, view) => {
    K.lightRig(scene, { key: 1.6 })
    const pivot = new THREE.Group()
    scene.add(pivot)
    const model = make()
    model.scale.setScalar(scale)
    model.position.y = y
    pivot.add(model)
    pivot.add(K.contactShadow(ground, 0.45))

    let dragging = false
    let lastX = 0
    view.el.style.touchAction = 'pan-y'
    view.el.addEventListener('pointerdown', (e) => {
      dragging = true
      lastX = e.clientX
      view.el.setPointerCapture(e.pointerId)
    })
    view.el.addEventListener('pointermove', (e) => {
      if (!dragging) return
      view.drag += (e.clientX - lastX) * 0.012
      lastX = e.clientX
    })
    view.el.addEventListener('pointerup', () => {
      dragging = false
    })
    view.el.addEventListener('pointercancel', () => {
      dragging = false
    })

    return (t, dt) => {
      if (!reduced) view.spin += dt * rate
      pivot.rotation.y = view.spin + view.drag
      animate?.(model, t, dt)
    }
  }
}

/* ------------------------------------------------------------------ panels */
function buildPanels() {
  addView(
    'v-prof',
    turntable(
      () => {
        const p = K.makeRunner()
        p.userData.crack = -1.2
        return p
      },
      {
        ground: 1.1,
        animate: (p, t, dt) => {
          K.runCycle(p, t, 0.85)
          p.userData.crack += dt * 0.5
          if (p.userData.crack > 2.2) p.userData.crack = -1.2
          const k = p.userData.crack as number
          K.crackWhip(p, k > 0 && k < 1 ? k : -1)
        },
      },
    ),
    { fov: 34, pos: [0, 1.5, 6.2], look: [0, 1.0, 0] },
  )

  addView(
    'v-whip',
    turntable(() => K.makeRunner(), {
      ground: 1.1,
      rate: 0.1,
      animate: (p, t) => {
        const k = (t * 0.55) % 1.6
        K.runCycle(p, t, 0.55)
        K.crackWhip(p, k < 1 ? k : -1)
      },
    }),
    { fov: 30, pos: [2.4, 1.7, 7.4], look: [0, 1.15, 0] },
  )

  const boulders: Array<[string, K.BoulderVariant, number]> = [
    ['v-lime', 'limestone', 3],
    ['v-moss', 'mossy', 11],
    ['v-kuk', 'kukulkan', 7],
  ]
  for (const [id, variant, seed] of boulders) {
    addView(
      id,
      turntable(() => K.makeBoulder(variant, seed), {
        y: 1.05,
        ground: 1.3,
        rate: 0.5,
        animate: (m, _t, dt) => {
          m.rotation.x -= dt * 1.0
        },
      }),
      { fov: 36, pos: [0, 1.5, 5.6], look: [0, 1.0, 0] },
    )
  }

  addView(
    'v-spider',
    turntable(() => K.makeSpider(), {
      scale: 1.9,
      ground: 1.1,
      animate: (m, t) => {
        K.skitter(m, t, 1)
        m.position.y = Math.abs(Math.sin(t * 3)) * 0.05
      },
    }),
    { fov: 34, pos: [0, 1.35, 3.6], look: [0, 0.6, 0] },
  )

  addView(
    'v-scarab',
    turntable(() => K.makeScarab(), { scale: 1.9, ground: 1.1, animate: (m, t) => K.skitter(m, t, 0.8) }),
    { fov: 34, pos: [0, 1.3, 3.6], look: [0, 0.55, 0] },
  )

  addView(
    'v-coin',
    turntable(() => K.makeCoin(), { scale: 2.4, y: 1.0, ground: 0.7, rate: 1.4 }),
    { fov: 34, pos: [0, 1.3, 4.0], look: [0, 1.0, 0] },
  )

  addView(
    'v-idol',
    turntable(() => K.makeIdol(), { scale: 1.7, y: 0.6, ground: 0.9, rate: 0.6 }),
    { fov: 34, pos: [0, 1.2, 3.6], look: [0, 0.65, 0] },
  )

  addView(
    'v-brazier',
    turntable(() => K.makeBrazier(), {
      scale: 1.05,
      ground: 1.0,
      rate: 0.35,
      animate: (m, t) => {
        const flame = m.userData.flame as THREE.Mesh
        flame.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 7 + 1) * 0.14, 1)
      },
    }),
    { fov: 36, pos: [0, 1.5, 4.2], look: [0, 1.0, 0] },
  )

  addView('v-pyr', turntable(() => K.makePyramid(4), { scale: 0.26, ground: 1.6, rate: 0.3 }), {
    fov: 34,
    pos: [0, 1.6, 6.0],
    look: [0, 0.9, 0],
  })

  // The track module, seen from the side so the whole prefab is legible.
  addView(
    'v-track',
    (scene, camera) => {
      scene.fog = new THREE.FogExp2(0xadb894, 0.02)
      scene.add(K.makeSky())
      K.lightRig(scene, { key: 1.45 })
      const road = new THREE.Group()
      scene.add(road)
      for (let i = 0; i < 4; i++) {
        const seg = K.makeTrackSegment(i + 2)
        seg.position.z = -i * K.SEGMENT_LEN
        road.add(seg)
      }
      const runner = K.makeRunner()
      runner.rotation.y = Math.PI
      runner.position.set(LANE_X[1], 0, -6)
      scene.add(runner)
      const boulder = K.makeBoulder('kukulkan', 7)
      boulder.scale.setScalar(1.15)
      boulder.position.set(LANE_X[0], 1.25, -2)
      scene.add(boulder)
      const coins: THREE.Group[] = []
      for (let i = 0; i < 6; i++) {
        const c = K.makeCoin()
        c.position.set(LANE_X[0], 1.05, -8 - i * 2.2)
        scene.add(c)
        coins.push(c)
      }
      camera.position.set(5.4, 3.6, 5.2)
      camera.lookAt(0, 1.2, -9)
      return (t, dt) => {
        K.runCycle(runner, t, 0.9)
        K.crackWhip(runner, -1)
        boulder.rotation.x -= dt * 1.1
        coins.forEach((c, i) => {
          c.rotation.y = t * 3 + i
        })
        camera.position.x = 5.4 + Math.sin(t * 0.22) * 1.8
        camera.position.y = 3.6 + Math.sin(t * 0.17) * 0.5
        camera.lookAt(0, 1.2, -9)
      }
    },
    { fov: 40 },
  )
}

/* -------------------------------------------------------------- frame loop */
function loop() {
  let last = performance.now()
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const t = now / 1000
    for (const v of views) {
      if (!v.visible) continue
      const w = v.el.clientWidth
      const h = v.el.clientHeight
      if (!w || !h) continue
      const pw = Math.round(w * dpr)
      const ph = Math.round(h * dpr)
      if (v.el.width !== pw || v.el.height !== ph) {
        v.el.width = pw
        v.el.height = ph
      }
      if (glW < w || glH < h) sizeGL()
      renderer.setViewport(0, 0, w, h)
      renderer.setScissor(0, 0, w, h)
      renderer.clear()
      if (v.camera.aspect !== w / h) {
        v.camera.aspect = w / h
        v.camera.updateProjectionMatrix()
      }
      v.update(t, dt)
      renderer.render(v.scene, v.camera)
      v.ctx.clearRect(0, 0, pw, ph)
      // The GL viewport sits at the bottom-left of the shared buffer.
      v.ctx.drawImage(gl, 0, gl.height - ph, pw, ph, 0, 0, pw, ph)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

buildPanels()
sizeGL()
window.addEventListener('resize', sizeGL)
bootHero()
loop()
