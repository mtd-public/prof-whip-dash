import { GameCanvas } from './components/GameCanvas'
import { GameOverlay } from './components/GameOverlay'
import { Hud } from './components/Hud'
import { KeyboardHelp } from './components/KeyboardHelp'
import { StatsSidebar } from './components/StatsSidebar'
import { useGameEngine } from './game/useGameEngine'
import { useBoardControls } from './hooks/useBoardControls'

export default function App() {
  const { state, world, toast, moveLeft, moveRight, crack, start, togglePause } = useGameEngine()
  const playable = state.phase === 'playing'
  const controls = useBoardControls({ onLeft: moveLeft, onRight: moveRight })

  return (
    <div className="app" data-world={state.world}>
      <header className="topbar">
        <h1 className="wordmark">
          Professor <span>WhipDash</span>
        </h1>
        <div className="topbar__stats">
          <span className="topbar__stat">
            <span className="stat__label">Score</span> {state.score.toLocaleString()}
          </span>
        </div>
        <div className="topbar__actions">
          <KeyboardHelp />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={togglePause}
            disabled={state.phase !== 'playing' && state.phase !== 'paused'}
          >
            {state.phase === 'paused' ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="board-shell" {...controls}>
          <GameCanvas world={world} phase={state.phase} />
          <div className="board-shell__vignette" />
          {state.phase !== 'ready' && <Hud state={state} toast={toast} />}
          <GameOverlay state={state} onStart={start} onResume={togglePause} />

          {/* Portrait's whip control. It sits inside the board, bottom right,
              clear of the runner and under the thumb. Its own pointer events
              stay out of the board's tap-to-switch handler. */}
          <button
            type="button"
            className="whip-tap"
            aria-label="Crack the whip"
            disabled={!playable}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              crack()
            }}
          >
            <span aria-hidden="true">➤</span>
            Whip
          </button>
        </div>

        <StatsSidebar state={state} />
      </main>

      <div className="footer-bar">
        <button
          type="button"
          className="btn btn--footer-side"
          onClick={moveLeft}
          disabled={!playable}
          aria-label="Move left"
        >
          ◀
        </button>
        <button type="button" className="btn btn--primary btn--whip" onClick={crack} disabled={!playable}>
          Crack the whip
        </button>
        <button
          type="button"
          className="btn btn--footer-side"
          onClick={moveRight}
          disabled={!playable}
          aria-label="Move right"
        >
          ▶
        </button>
      </div>
    </div>
  )
}
