import { useEffect, useRef, useState } from 'react'

const SHORTCUTS: Array<[string, string]> = [
  ['← →', 'Switch lane'],
  ['Space / ↑', 'Crack the whip'],
  ['P / Esc', 'Pause'],
]

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="help" ref={ref}>
      <button type="button" className="btn btn--ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Keys
      </button>
      {open && (
        <div className="help__panel">
          {SHORTCUTS.map(([key, label]) => (
            <div key={key}>
              <kbd>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
