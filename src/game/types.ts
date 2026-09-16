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
  /** Per-lane threat: 0 clear, 1 committing, 2 claimed and grinding. */
  lanes: [number, number, number]
  /** True while a boulder is in the runner's own lane, draining him. */
  grinding: boolean
}
