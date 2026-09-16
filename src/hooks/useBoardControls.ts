import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

const SWIPE_PX = 28

interface Handlers {
  onLeft: () => void
  onRight: () => void
  onTap: () => void
}

/**
 * Board gestures. A lane change fires the moment the swipe passes threshold
 * rather than on release — at 20 m/s, waiting for pointerup is a hit — and
 * the origin resets after each one so a long drag can cross two lanes. A
 * press that never swipes is a tap, which cracks the whip.
 */
export function useBoardControls({ onLeft, onRight, onTap }: Handlers) {
  const origin = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  function onPointerDown(event: ReactPointerEvent) {
    origin.current = { x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  function onPointerMove(event: ReactPointerEvent) {
    if (!origin.current) return
    const dx = event.clientX - origin.current.x
    const dy = event.clientY - origin.current.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) onLeft()
    else onRight()
    swiped.current = true
    origin.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp() {
    if (origin.current && !swiped.current) onTap()
    origin.current = null
  }

  function onPointerCancel() {
    origin.current = null
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
