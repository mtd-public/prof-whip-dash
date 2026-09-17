export type GamePhase = 'ready' | 'playing' | 'paused' | 'over'

export interface GameState {
  phase: GamePhase
  /** Coins banked this run. */
  coins: number
  /** Coins × 10 + metres run. */
  score: number
  best: number
  /** Metres run. */
  dist: number
  hp: number
  /** Live payout multiplier — 3 while grinding, 2 while contested, else 1. */
  multiplier: number
  /** Levels advance every 500m. */
  level: number
  /** The art theme the run is currently in — drives the topbar's stone. */
  world: string
  zone: string
  /** Progress through the current level, 0–1. */
  levelProgress: number
  /** Metres still to run before the next level. */
  toNextLevel: number
  /** True while a boulder is in the runner's own lane, draining him. */
  grinding: boolean
}
