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
  /** Quiet time after a despawn before that lane can be claimed again.
   *  Never shorter than despawnTime, or a lane could be re-claimed while
   *  its block is still rolling away down the track. */
  boulderCooldown: 2,
  /** Seconds the roll-away takes once its life runs out. */
  despawnTime: 1.6,
  /** Where a spent boulder rolls to: away down the causeway, far enough
   *  ahead to be lost in the haze before it is recycled. */
  despawnZ: -46,
  /** How far it swerves out of the lane to get around the runner. Needs to
   *  clear the block's radius plus his shoulders, with room to spare. */
  despawnSwerve: 2.4,
  /** Metres either side of the runner over which the swerve opens and closes. */
  despawnSwerveWindow: 5,

  /** Metres per level. The level meter fills across one of these, and the
   *  zone changes with it — the theme loops every three. */
  levelDistance: 500,
  /** Level 1 is the on-ramp: one lane claimed, slower vermin, gentler rows.
   *  Difficulty keys off the level, never the zone, so a looping theme never
   *  walks the difficulty back down. */
  gentleLevels: 1,

  coinValue: 1,
  idolValue: 25,
  /** A heart restores one of the six segments on his back. */
  heartHeal: 100 / 6,
  heartEvery: [11, 18] as const,
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
  /** Sideways offset from the lane centre — the swerve around the runner. */
  offsetX: number
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
  kind: 'coin' | 'idol' | 'heart'
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
  /** A heart was taken. */
  heart: number
  /** Another 500m banked. */
  levelUp: number
}

export interface World {
  lane: number
  /** Eased lane position in metres — what the renderer actually draws. */
  laneX: number
  speed: number
  dist: number
  /** Starts at 1 and steps up every `levelDistance` metres. */
  level: number
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
  heartIn: number
  over: boolean
  fx: Fx
  nextId: number
}

export const LANE_X = [-1.8, 0, 1.8]

function emptyFx(): Fx {
  return { coin: 0, idol: 0, crack: 0, perfect: 0, hit: 0, grind: 0, laneChange: 0, despawn: 0, levelUp: 0, heart: 0 }
}

export function createWorld(): World {
  return {
    lane: 1,
    laneX: LANE_X[1],
    speed: TUNING.baseSpeed,
    dist: 0,
    level: 1,
    hp: 100,
    coins: 0,
    combo: 0,
    multiplier: 1,
    boulders: [
      { lane: 0, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, offsetX: 0, cooldown: 0 },
      { lane: 1, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, offsetX: 0, cooldown: 0 },
      { lane: 2, z: TUNING.idleZ, age: -1, despawning: 0, despawnFrom: 0, offsetX: 0, cooldown: 0 },
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
    heartIn: TUNING.heartEvery[0],
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
  // Level 1 never claims two lanes; from level 2 it becomes a coin flip that
  // hardens as the levels stack, and from level 4 it is the norm.
  const twoLaneChance = w.level <= TUNING.gentleLevels ? 0 : Math.min(0.85, 0.3 + (w.level - 2) * 0.22)
  const claims = Math.random() < twoLaneChance ? 2 : 1
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

/** The clear lane — the one place a heart is allowed to be. */
function clearLane(w: World): number | null {
  const safe = [0, 1, 2].filter((l) => w.pattern[l] === 0 && w.nextPattern[l] !== 2)
  if (!safe.length) return null
  return safe[Math.floor(Math.random() * safe.length)]
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

  const level = Math.floor(w.dist / TUNING.levelDistance) + 1
  if (level > w.level) {
    w.level = level
    w.fx.levelUp++
  }
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
    const relief = w.level <= TUNING.gentleLevels ? 1.6 : Math.max(0, 0.9 - (w.level - 2) * 0.3)
    w.nextIn = TUNING.rowHold[0] + relief + Math.random() * (TUNING.rowHold[1] - TUNING.rowHold[0])
  }
  const committing = w.nextIn < TUNING.telegraph
  for (let l = 0; l < LANES; l++) {
    if (w.pattern[l] !== 2 && committing && w.nextPattern[l] === 2) w.pattern[l] = 1
    else if (w.pattern[l] === 1 && !committing) w.pattern[l] = 0
  }

  w.boulders.forEach((b, i) => {
    b.cooldown = Math.max(0, b.cooldown - dt)

    if (b.despawning > 0) {
      // Its five seconds are up: it breaks away, overtakes the runner and
      // rolls off down the causeway ahead of him, accelerating the whole way.
      b.despawning += dt
      const k = Math.min(1, b.despawning / TUNING.despawnTime)
      b.z = b.despawnFrom + (TUNING.despawnZ - b.despawnFrom) * k * k

      // It is overtaking in an occupied lane, so it swings wide to get past
      // the runner rather than straight through him. The swerve peaks as it
      // draws level and closes again once it is clear.
      const level = Math.max(0, 1 - Math.abs(b.z) / TUNING.despawnSwerveWindow)
      const dir = i === 1 ? 1 : -Math.sign(LANE_X[i])
      const target = w.lane === i ? dir * TUNING.despawnSwerve * level : 0
      b.offsetX += (target - b.offsetX) * Math.min(1, dt * 14)

      if (b.despawning >= TUNING.despawnTime) {
        b.despawning = 0
        b.offsetX = 0
        // Recycle it in behind the camera, not into the middle of the shot:
        // the idle easing below walks it back up into the queue.
        b.z = TUNING.idleZ + 14
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
    // Vermin arrive further apart on the on-ramp and close up with the level.
    const gap = w.level <= TUNING.gentleLevels ? 2.8 : Math.max(0.75, 2.4 - (w.level - 1) * 0.3)
    w.spawnIn = gap + Math.random() * 0.8
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

  // Hearts go where the coins never do: a lane with nothing claiming it.
  w.heartIn -= dt
  if (w.heartIn <= 0) {
    const lane = clearLane(w)
    w.heartIn = TUNING.heartEvery[0] + Math.random() * (TUNING.heartEvery[1] - TUNING.heartEvery[0])
    if (lane === null) {
      w.heartIn = 1.5 // every lane is spoken for; try again shortly
    } else {
      w.pickups.push({ id: w.nextId++, kind: 'heart', lane, z: -56, taken: 0, risky: false })
    }
  }
  for (const p of w.pickups) {
    if (p.taken) {
      p.taken += dt
      continue
    }
    p.z += w.speed * dt
    if (p.z > -1 && p.z < 1 && p.lane === w.lane) {
      p.taken = 0.001
      if (p.kind === 'heart') {
        w.hp = Math.min(100, w.hp + TUNING.heartHeal)
        w.fx.heart++
      } else {
        w.coins += (p.kind === 'idol' ? TUNING.idolValue : TUNING.coinValue) * w.multiplier
        if (p.kind === 'idol') w.fx.idol++
        else w.fx.coin++
      }
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

/** How far through the current level the runner is, 0–1. */
export function levelProgress(w: World): number {
  return (w.dist % TUNING.levelDistance) / TUNING.levelDistance
}
