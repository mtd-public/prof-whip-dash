import { AnimatePresence, motion } from 'framer-motion'
import type { GameState } from '../game/types'
import type { Toast } from '../game/useGameEngine'

interface HudProps {
  state: GameState
  toast: Toast | null
}

/**
 * Everything the player reads mid-run, in priority order down the screen:
 * how much life is left, how close the next level is, then the counters.
 * Threat itself is read off the causeway now — the overhead camera keeps
 * every lane and the blocks holding them in frame.
 */
export function Hud({ state, toast }: HudProps) {
  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__top">
        <div className={`health${state.hp <= 34 ? ' health--low' : ''}`}>
          <i style={{ width: `${Math.max(0, Math.min(100, state.hp))}%` }} />
          {/* Quarter marks, so hits stay countable without segmenting the bar. */}
          <u style={{ left: '25%' }} />
          <u style={{ left: '50%' }} />
          <u style={{ left: '75%' }} />
        </div>

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

      <div className="grit" style={{ opacity: state.grinding ? 0.75 : state.multiplier > 1 ? 0.3 : 0 }} />
    </div>
  )
}
