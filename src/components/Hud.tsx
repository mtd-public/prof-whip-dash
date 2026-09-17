import { AnimatePresence, motion } from 'framer-motion'
import type { GameState } from '../game/types'
import type { Toast } from '../game/useGameEngine'

interface HudProps {
  state: GameState
  toast: Toast | null
}

/**
 * What is left on the glass. Health moved onto the Professor's back — the
 * overhead camera never looks away from it — so the top of the screen carries
 * only the level meter and the counters.
 */
export function Hud({ state, toast }: HudProps) {
  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__top">
        <div className="level">
          <div className="level__bar">
            <i style={{ width: `${Math.round(state.levelProgress * 100)}%` }} />
          </div>
          <span className="level__tag">Lv {state.level}</span>
        </div>

        <div className="readout">
          <span className="readout__coins">
            <b>{state.coins.toLocaleString()}</b> coins
          </span>
          {state.multiplier > 1 && (
            <motion.span
              className="multiplier"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ×{state.multiplier} danger
            </motion.span>
          )}
          <span>
            <b>{Math.ceil(state.toNextLevel)}</b> m to Lv {state.level + 1}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            className={`toast toast--${toast.tone}`}
            initial={{ opacity: 0, y: 14, scale: 0.7 }}
            animate={{ opacity: 1, y: -18, scale: 1 }}
            exit={{ opacity: 0, y: -44, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* With no bar to watch, the frame itself has to carry low health. */}
      <div
        className="grit"
        style={{ opacity: state.hp <= 34 ? 0.85 : state.grinding ? 0.7 : state.multiplier > 1 ? 0.3 : 0 }}
        data-critical={state.hp <= 34 ? 'true' : undefined}
      />
    </div>
  )
}
