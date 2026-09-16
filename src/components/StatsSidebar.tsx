import type { GameState } from '../game/types'

/** Landscape and desktop only — portrait keeps everything on the board. */
export function StatsSidebar({ state }: { state: GameState }) {
  return (
    <aside className="stats">
      <div className="stats__section">
        <span className="stat__label">Score</span>
        <span className="stat__value">{state.score.toLocaleString()}</span>
      </div>
      <div className="stats__section">
        <span className="stat__label">Best</span>
        <span className="stat__value stat__value--best">{state.best.toLocaleString()}</span>
      </div>
      <div className="stats__section">
        <span className="stat__label">Level</span>
        <span className="stat__value">{state.level}</span>
      </div>
      <div className="stats__note">
        <h3>Levels</h3>
        <p>The thin jade bar fills over 500m. Every time it does, the level steps up and the causeway keeps getting faster.</p>
      </div>
      <div className="stats__note">
        <h3>Risk pays</h3>
        <p>Coin runs thread the dangerous lane. Collect while a boulder is on you and every coin pays triple.</p>
      </div>
      <div className="stats__note">
        <h3>The whip</h3>
        <p>Reaches your own lane, 2–5m ahead. Crack a spider at 3m for a perfect and a speed burst. Space, or the button on the board in portrait.</p>
      </div>
    </aside>
  )
}
