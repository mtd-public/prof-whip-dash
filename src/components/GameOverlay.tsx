import { AnimatePresence, motion } from 'framer-motion'
import type { GameState } from '../game/types'

interface GameOverlayProps {
  state: GameState
  onStart: () => void
  onResume: () => void
}

export function GameOverlay({ state, onStart, onResume }: GameOverlayProps) {
  const visible = state.phase !== 'playing'
  const record = state.phase === 'over' && state.score >= state.best && state.score > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="overlay__card"
            initial={{ y: 16, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {state.phase === 'ready' && (
              <>
                <h2>
                  Three lanes.<em>Three boulders.</em>
                </h2>
                <p>
                  They grind, they don't splat. Share a lane with one and you bleed until you reach a clear lane — which
                  is exactly where the gold is.
                </p>
                <dl className="keys">
                  <div>
                    <dt>Swipe or tap</dt>
                    <dd>Tap a side of the screen, or swipe, to switch lane</dd>
                  </div>
                  <div>
                    <dt>Whip button</dt>
                    <dd>Bottom right — cracks at what's ahead of you</dd>
                  </div>
                  <div>
                    <dt>Red pip</dt>
                    <dd>That lane is grinding. Coins there pay triple.</dd>
                  </div>
                </dl>
                <button type="button" className="btn btn--primary" onClick={onStart}>
                  Start the run
                </button>
              </>
            )}

            {state.phase === 'paused' && (
              <>
                <h2>Paused</h2>
                <button type="button" className="btn btn--primary" onClick={onResume}>
                  Resume
                </button>
              </>
            )}

            {state.phase === 'over' && (
              <>
                <h2>Caught</h2>
                <div className="scoreline">
                  <div>
                    <span>Score</span>
                    <b className="gold">{state.score.toLocaleString()}</b>
                  </div>
                  <div>
                    <span>Coins</span>
                    <b>{state.coins.toLocaleString()}</b>
                  </div>
                  <div>
                    <span>Distance</span>
                    <b>{Math.floor(state.dist)}m</b>
                  </div>
                </div>
                <p>{record ? 'New best run.' : `Best ${state.best.toLocaleString()}. The serpent block lunges a full lane in half a second.`}</p>
                <button type="button" className="btn btn--primary" onClick={onStart}>
                  Run again
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
