/**
 * The whole simulation in plain logical coordinates — no three.js, no DOM.
 * The runner stays at z = 0 and the world slides toward him, so every z below
 * is "metres ahead of the Professor" (negative) or "behind him" (positive).
 */

export const LANES = 3

export const TUNING = {
  baseSpeed: 11,
  speedPerMetre: 0.0035,
  maxSpeed: 21,
  laneSwitch: 0.16,

  grindDrain: 18,
  contestDrain: 6,
  regen: 4,
  regenDelay: 2.5,
  vermHit: 12,
  stumble: 0.6,

  whipCooldown: 0.3,
  whipNear: 1.5,
  whipFar: 6,
  perfectNear: 3,
  perfectFar: 3.8,

  /** Boulder stand-off: on your heels while claiming, out of shot otherwise. */
  grindZ: 2.4,
  idleZ: 11.5,
  rowHold: [3.2, 5.4] as const,
  telegraph: 1.2,
  /** How long a boulder may hold a lane before it rolls away and despawns. */
  boulderLife: 5,
  /** Quiet time after a despawn before that lane can be claimed again. */
  boulderCooldown: 1.5,
  /** Seconds the roll-away takes once its life runs out. */
  despawnTime: 1.1,
  /** Where a retreating boulder rolls to — well behind the camera. */
  despawnZ: 26,

  coinValue: 1,
  idolValue: 25,
  /** Share of coin runs that deliberately thread a dangerous lane. */
  riskyCoinChance: 0.7,
} as const

export interface Boulder {
  lane: number
  z: number
  /** Seconds this boulder has been holding its lane; -1 when not claiming. */
  age: number
  /** Counts up through the roll-away once its life runs out. */
  despawning: number
  /** Where the roll-away started, so the easing has something to lerp from. */
  despawnFrom: number
  /** Seconds until this lane may be claimed again. */
  cooldown: number
}

export interface Critter {
  id: number
  kind: 'spider' | 'scarab'
  lane: number
  z: number
  /** > 0 once whipped: counts up through the death animation. */
  dying: number
}

export interface Pickup {
  id: number
  kind: 'coin' | 'idol'
  lane: number
  z: number
  /** > 0 once collected: counts up through the pop animation. */
  taken: number
  /** Spawned into a lane a boulder owns or is about to. */
  risky: boolean
}

/** Things that happened this step, for the renderer and the HUD to react to. */
export interface Fx {
  coin: number
  idol: number
  crack: number
  perfect: number
  hit: number
  grind: number
  laneChange: number
  /** A boulder hit its five-second limit and rolled away. */
  despawn: number
}

export interface World {
  lane: number
  /** Eased lane position in metres — what the renderer actually draws. */
  laneX: number
  speed: number
  dist: number
  hp: number
  coins: number
  combo: number
  multiplier: number
  boulders: Boulder[]
  critters: Critter[]
  pickups: Pickup[]
  /** Per-lane threat: 0 clear, 1 committing (telegraph), 2 claimed. */
  pattern: [number, number, number]
  nextPattern: [number, number, number]
  nextIn: number
  whipCooldown: number
  /** 0 → 1 through one crack, -1 when coiled. */
  whipK: number
  stumble: number
  clearFor: number
  grinding: boolean
  contested: boolean
  shake: number
  spawnIn: number
  coinsIn: number
  idolIn: number
  over: boolean
  fx: Fx
  nextId: number
}

export const LANE_X = [-1.8, 0, 1.8]

function emptyFx(): Fx {
  return { coin: 0, idol: 0, crack: 0, perfect: 0, hit: 0, grind: 0, laneChange: 0, despawn: 0 }
}

export function createWorld(): World {
  return {
    lane: 1,
    laneX: LANE_X[1],
    speed: TUNING.baseSpeed,
    dist: 0,
    hp: 100,
    coins: 0,
    combo: 0,
    multiplier: 1,
    boulders: [
      { lane: 0, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, cooldown: 0 },
      { lane: 1, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, cooldown: 0 },
      { lane: 2, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, cooldown: 0 },
    ],
    critters: [],
    pickups: [],
    pattern: [0, 0, 0],
    nextPattern: [0, 0, 0],
    nextIn: 3,
    whipCooldown: 0,
    whipK: -1,
    stumble: 0,
    clearFor: 9,
    grinding: false,
    contested: false,
    shake: 0,
    spawnIn: 1.6,
    coinsIn: 1.2,
    idolIn: 12,
    over: false,
    fx: emptyFx(),
    nextId: 1,
  }
}

export function moveLane(w: World, dir: number) {
  const next = Math.max(0, Math.min(LANES - 1, w.lane + dir))
  if (next === w.lane) return
  w.lane = next
  w.fx.laneChange++
}

/**
 * One crack. It only reaches the runner's own lane, 1.5–6m ahead, so the
 * decision the player is making is *when*, never *where*.
 */
export function whip(w: World) {
  if (w.whipCooldown > 0) return
  w.whipCooldown = TUNING.whipCooldown
  w.whipK = 0

  let hit: Critter | null = null
  for (const c of w.critters) {
    if (c.dying || c.lane !== w.lane) continue
    const d = -c.z
    if (d >= TUNING.whipNear && d <= TUNING.whipFar && (!hit || d < -hit.z)) hit = c
  }
  if (!hit) return

  const d = -hit.z
  const perfect = d >= TUNING.perfectNear && d <= TUNING.perfectFar
  hit.dying = 0.001
  w.combo++
  w.shake = Math.max(w.shake, perfect ? 0.22 : 0.12)
  w.fx.crack++
  if (perfect) {
    w.fx.perfect++
    w.speed = Math.min(TUNING.maxSpeed + 2, w.speed * 1.08)
  }
}

/**
 * A row is a pattern over the three lanes: 2 = claimed and grinding, 0 =
 * clear. At least one lane is always clear — the game is finding it, not
 * reacting to a coin flip.
 */
function rollPattern(w: World): [number, number, number] {
  const claims = w.dist > 900 ? 2 : w.dist > 260 && Math.random() < 0.55 ? 2 : 1
  const p: [number, number, number] = [0, 0, 0]
  const available = [0, 1, 2].filter((l) => w.boulders[l].cooldown <= 0)
  const order = (available.length ? available : [0, 1, 2]).sort(() => Math.random() - 0.5)
  for (let i = 0; i < Math.min(claims, order.length); i++) p[order[i]] = 2
  return p
}

/** The lane worth putting coins in: claimed now, or claimed next. */
function dangerLane(w: World): number {
  const claimed = [0, 1, 2].filter((l) => w.pattern[l] === 2 || w.nextPattern[l] === 2)
  if (!claimed.length) return Math.floor(Math.random() * LANES)
  return claimed[Math.floor(Math.random() * claimed.length)]
}

function spawnCoinRun(w: World) {
  const risky = Math.random() < TUNING.riskyCoinChance
  const lane = risky ? dangerLane(w) : Math.floor(Math.random() * LANES)
  const count = 4 + Math.floor(Math.random() * 5)
  for (let i = 0; i < count; i++) {
    w.pickups.push({
      id: w.nextId++,
      kind: 'coin',
      lane,
      z: -54 - i * 2.2,
      taken: 0,
      risky,
    })
  }
}

function spawnIdol(w: World) {
  w.pickups.push({
    id: w.nextId++,
    kind: 'idol',
    lane: dangerLane(w),
    z: -58,
    taken: 0,
    risky: true,
  })
}

export function step(w: World, dt: number) {
  w.fx = emptyFx()
  if (w.over) return

  w.speed = Math.min(TUNING.maxSpeed, TUNING.baseSpeed + w.dist * TUNING.speedPerMetre) * (w.stumble > 0 ? 0.55 : 1)
  w.dist += w.speed * dt
  w.stumble = Math.max(0, w.stumble - dt)
  w.whipCooldown = Math.max(0, w.whipCooldown - dt)
  w.whipK = w.whipCooldown > 0 ? 1 - w.whipCooldown / TUNING.whipCooldown : -1
  w.shake = Math.max(0, w.shake - dt * 1.8)

  const targetX = LANE_X[w.lane]
  w.laneX += (targetX - w.laneX) * Math.min(1, dt / TUNING.laneSwitch)

  // --- boulder rows: telegraph, then commit -------------------------------
  w.nextIn -= dt
  if (w.nextIn <= 0) {
    w.pattern = w.nextPattern.some((v) => v === 2) ? w.nextPattern : rollPattern(w)
    w.nextPattern = rollPattern(w)
    w.nextIn = TUNING.rowHold[0] + Math.random() * (TUNING.rowHold[1] - TUNING.rowHold[0])
  }
  const committing = w.nextIn < TUNING.telegraph
  for (let l = 0; l < LANES; l++) {
    if (w.pattern[l] !== 2 && committing && w.nextPattern[l] === 2) w.pattern[l] = 1
    else if (w.pattern[l] === 1 && !committing) w.pattern[l] = 0
  }

  w.boulders.forEach((b, i) => {
    b.cooldown = Math.max(0, b.cooldown - dt)

    if (b.despawning > 0) {
      // It loses the chase and rolls back down its own lane, accelerating
      // away until it is past the camera — never sideways, never in place.
      b.despawning += dt
      const k = Math.min(1, b.despawning / TUNING.despawnTime)
      b.z = b.despawnFrom + (TUNING.despawnZ - b.despawnFrom) * k * k
      if (b.despawning >= TUNING.despawnTime) {
        b.despawning = 0
        b.z = TUNING.idleZ
      }
      return
    }

    const claimed = w.pattern[i] === 2
    if (claimed) {
      b.age = b.age < 0 ? 0 : b.age + dt
      if (b.age >= TUNING.boulderLife) {
        // Five seconds is all it gets: release the lane and roll away.
        b.age = -1
        b.despawning = 0.001
        b.despawnFrom = b.z
        b.cooldown = TUNING.boulderCooldown
        w.pattern[i] = 0
        if (w.nextPattern[i] === 2) w.nextPattern[i] = 0
        w.fx.despawn++
        return
      }
    } else {
      b.age = -1
    }

    const target = claimed ? TUNING.grindZ : TUNING.idleZ + (i % 2) * 1.4
    b.z += (target - b.z) * Math.min(1, dt * (claimed ? 1.9 : 1.1))
  })

  // Every lane cooling down at once would leave nothing chasing the player.
  if (w.boulders.every((b) => b.despawning > 0 || b.cooldown > 0)) {
    const soonest = w.boulders.reduce((a, b) => (a.cooldown <= b.cooldown ? a : b))
    soonest.cooldown = Math.min(soonest.cooldown, 0.4)
  }

  // --- damage -------------------------------------------------------------
  w.grinding = w.pattern[w.lane] === 2 && w.boulders[w.lane].z < TUNING.grindZ + 1.4
  w.contested = !w.grinding && w.pattern[w.lane] === 1
  if (w.grinding) {
    w.hp -= TUNING.grindDrain * dt
    w.clearFor = 0
    w.shake = Math.max(w.shake, 0.16)
    w.fx.grind++
  } else if (w.contested) {
    w.hp -= TUNING.contestDrain * dt
    w.clearFor = 0
  } else {
    w.clearFor += dt
    if (w.clearFor > TUNING.regenDelay) w.hp = Math.min(100, w.hp + TUNING.regen * dt)
  }
  w.multiplier = w.grinding ? 3 : w.contested ? 2 : 1

  // --- vermin ahead -------------------------------------------------------
  w.spawnIn -= dt
  if (w.spawnIn <= 0) {
    w.spawnIn = Math.max(0.75, 2.2 - w.dist * 0.0012) + Math.random() * 0.8
    w.critters.push({
      id: w.nextId++,
      kind: Math.random() < 0.6 ? 'spider' : 'scarab',
      lane: Math.floor(Math.random() * LANES),
      z: -46 - Math.random() * 14,
      dying: 0,
    })
  }
  for (const c of w.critters) {
    if (c.dying) {
      c.dying += dt
      continue
    }
    c.z += (w.speed - 2.2) * dt
    if (c.z > -0.75 && c.z < 0.9 && c.lane === w.lane) {
      c.dying = 0.001
      w.hp -= TUNING.vermHit
      w.combo = 0
      w.stumble = TUNING.stumble
      w.shake = Math.max(w.shake, 0.4)
      w.fx.hit++
    }
  }
  w.critters = w.critters.filter((c) => c.dying < 0.25 && c.z < 4)

  // --- coins and idols, threaded through the dangerous lane ---------------
  w.coinsIn -= dt
  if (w.coinsIn <= 0) {
    w.coinsIn = 2.4 + Math.random() * 2.2
    spawnCoinRun(w)
  }
  w.idolIn -= dt
  if (w.idolIn <= 0) {
    w.idolIn = 16 + Math.random() * 10
    spawnIdol(w)
  }
  for (const p of w.pickups) {
    if (p.taken) {
      p.taken += dt
      continue
    }
    p.z += w.speed * dt
    if (p.z > -1 && p.z < 1 && p.lane === w.lane) {
      p.taken = 0.001
      const value = (p.kind === 'idol' ? TUNING.idolValue : TUNING.coinValue) * w.multiplier
      w.coins += value
      if (p.kind === 'idol') w.fx.idol++
      else w.fx.coin++
    }
  }
  w.pickups = w.pickups.filter((p) => p.taken < 0.3 && p.z < 4)

  if (w.hp <= 0) {
    w.hp = 0
    w.over = true
  }
}

export function score(w: World): number {
  return w.coins * 10 + Math.floor(w.dist)
}
