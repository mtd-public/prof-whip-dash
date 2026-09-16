/**
 * A self-playing run, shared by the art bible's hero panel and the camera
 * study. It drives the real engine — same physics, same renderer — so a
 * mockup can never drift from the build it is standing in for.
 */
import { Scene3D } from '../game/scene3d'
import { createWorld, moveLane, step, whip, TUNING, type World } from '../game/physics'

/** Leave a grinding lane, drift toward reachable coins, crack what's in range. */
function autopilot(world: World) {
  if (world.pattern[world.lane] === 2) {
    const safe = [0, 1, 2].filter((l) => world.pattern[l] !== 2)
    const to = safe.sort((a, b) => Math.abs(a - world.lane) - Math.abs(b - world.lane))[0]
    if (to !== undefined && to !== world.lane) moveLane(world, Math.sign(to - world.lane))
  } else {
    const target = world.pickups.find((p) => !p.taken && p.z > -26 && p.z < -8 && p.lane !== world.lane)
    if (target && Math.random() < 0.04) moveLane(world, Math.sign(target.lane - world.lane))
  }
  if (world.critters.some((c) => !c.dying && c.lane === world.lane && -c.z > TUNING.whipNear && -c.z < TUNING.whipFar)) {
    whip(world)
  }
}

export function createDemo(canvas: HTMLCanvasElement): { scene: Scene3D; world: World } {
  const scene = new Scene3D(canvas)
  const world = createWorld()
  const parent = canvas.parentElement!
  const resize = () => scene.resize(parent.clientWidth, parent.clientHeight)
  resize()
  new ResizeObserver(resize).observe(parent)

  let last = performance.now()
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30)
    last = now
    autopilot(world)
    if (world.hp < 45) world.hp = 100 // the demo never dies
    step(world, dt)
    scene.update(world, 'playing', dt, now / 1000)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  return { scene, world }
}
