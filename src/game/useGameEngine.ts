import { useCallback, useEffect, useRef, useState } from 'react'
import { createWorld, levelProgress, moveLane, score, step, TUNING, whip, type World } from './physics'
import { biomeForLevel, worldForLevel } from './palette'
import type { GamePhase, GameState } from './types'

const BEST_KEY = 'whipdash.best'
/** HUD refresh rate — the simulation still runs every frame. */
const HUD_INTERVAL = 0.08

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0
  } catch {
    return 0
  }
}

function initialState(best: number): GameState {
  return {
    phase: 'ready',
    coins: 0,
    score: 0,
    best,
    dist: 0,
    hp: 100,
    multiplier: 1,
    level: 1,
    world: worldForLevel(1).name,
    zone: biomeForLevel(1).name,
    levelProgress: 0,
    toNextLevel: TUNING.levelDistance,
    grinding: false,
  }
}

export interface Toast {
  text: string
  tone: 'gold' | 'hazard' | 'jade'
  key: number
}

/**
 * Owns the simulation clock. The renderer reads `world` directly every frame;
 * React state carries only what the HUD prints, refreshed a few times a
 * second so a 60fps run doesn't re-render the shell 60 times a second.
 */
export function useGameEngine() {
  const world = useRef<World>(createWorld())
  const [state, setState] = useState<GameState>(() => initialState(loadBest()))
  const [toast, setToast] = useState<Toast | null>(null)
  const phase = useRef<GamePhase>('ready')
  const hudTimer = useRef(0)
  const toastKey = useRef(0)

  const setPhase = useCallback((next: GamePhase) => {
    phase.current = next
    setState((s) => ({ ...s, phase: next }))
  }, [])

  const pushToast = useCallback((text: string, tone: Toast['tone']) => {
    toastKey.current += 1
    setToast({ text, tone, key: toastKey.current })
  }, [])

  const start = useCallback(() => {
    world.current = createWorld()
    setToast(null)
    setState((s) => ({ ...initialState(s.best), phase: 'playing' }))
    phase.current = 'playing'
  }, [])

  const togglePause = useCallback(() => {
    if (phase.current === 'playing') setPhase('paused')
    else if (phase.current === 'paused') setPhase('playing')
  }, [setPhase])

  const moveLeft = useCallback(() => {
    if (phase.current === 'playing') moveLane(world.current, -1)
  }, [])

  const moveRight = useCallback(() => {
    if (phase.current === 'playing') moveLane(world.current, 1)
  }, [])

  const crack = useCallback(() => {
    if (phase.current === 'playing') whip(world.current)
    else if (phase.current === 'ready' || phase.current === 'over') start()
  }, [start])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const w = world.current

      if (phase.current === 'playing') {
        step(w, dt)

        if (w.fx.perfect) pushToast(`CRACK! ×${w.combo}`, 'gold')
        else if (w.fx.crack) pushToast('Hit', 'jade')
        if (w.fx.idol) pushToast(`IDOL +${25 * w.multiplier}`, 'gold')
        else if (w.fx.coin && w.multiplier > 1) pushToast(`×${w.multiplier} DANGER`, 'hazard')
        if (w.fx.hit) pushToast('OW', 'hazard')
        if (w.fx.levelUp) pushToast(biomeForLevel(w.level).name.toUpperCase(), 'jade')
        if (w.fx.heart) pushToast('+1 LIFE', 'jade')

        if (w.fx.hit || w.fx.grind) navigator.vibrate?.(w.fx.hit ? [30, 40, 30] : 12)

        hudTimer.current -= dt
        if (hudTimer.current <= 0 || w.over) {
          hudTimer.current = HUD_INTERVAL
          setState((s) => ({
            ...s,
            coins: w.coins,
            score: score(w),
            dist: w.dist,
            hp: w.hp,
            multiplier: w.multiplier,
            level: w.level,
            world: worldForLevel(w.level).name,
            zone: biomeForLevel(w.level).name,
            levelProgress: levelProgress(w),
            toNextLevel: Math.max(0, TUNING.levelDistance - (w.dist % TUNING.levelDistance)),
            grinding: w.grinding,
          }))
        }

        if (w.over) {
          phase.current = 'over'
          const final = score(w)
          setState((s) => {
            const best = Math.max(s.best, final)
            try {
              localStorage.setItem(BEST_KEY, String(best))
            } catch {
              /* private mode — best score just won't persist */
            }
            return { ...s, phase: 'over', score: final, best }
          })
        }
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [pushToast])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          event.preventDefault()
          moveLeft()
          break
        case 'ArrowRight':
        case 'd':
          event.preventDefault()
          moveRight()
          break
        case ' ':
        case 'ArrowUp':
          event.preventDefault()
          crack()
          break
        case 'p':
        case 'P':
        case 'Escape':
          togglePause()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [moveLeft, moveRight, crack, togglePause])

  return { state, world, toast, moveLeft, moveRight, crack, start, togglePause }
}
