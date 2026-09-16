import { AnimatePresence, motion } from 'framer-motion'
import type { GameState } from '../game/types'
import type { Toast } from '../game/useGameEngine'

const HP_SEGMENTS = 6

interface HudProps {
  state: GameState
  toast: Toast | null
}

/**
 * Everything the player reads mid-run. The lane ribbon is the important part:
 * the boulders are behind the camera, so the pips are the only way to know
 * which lane is about to grind.
 */
export function Hud({ state, toast }: HudProps) {
  const filled = Math.ceil((state.hp / 100) * HP_SEGMENTS)

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__top">
        <div className="ribbon">
          {state.lanes.map((lane, i) => (
            <i key={i} className="pip" data-state={lane === 2 ? 'claimed' : lane === 1 ? 'committing' : 'clear'} />
          ))}
        </div>
        <div className={`health${state.hp <= 34 ? ' health--low' : ''}`}>
          {Array.from({ length: HP_SEGMENTS }, (_, i) => (
            <i key={i} className={i < filled ? '' : 'spent'} />
          ))}
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
            <b>{Math.floor(state.dist)}</b> m
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
