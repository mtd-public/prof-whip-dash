/**
 * Camera study: the live game with its rig exposed as presets and sliders, so
 * an angle can be chosen by looking at it rather than by reading numbers.
 */
import { CHASE_RIG, type CameraRig } from '../game/scene3d'
import { createDemo } from './demoRun'
import './camera.css'

interface Preset {
  id: string
  name: string
  note: string
  rig: CameraRig
}

const PRESETS: Preset[] = [
  {
    id: 'chase',
    name: 'Chase (old)',
    note: 'The original straight-on chase. Boulders stay behind the lens until they claim.',
    rig: { height: 4.6, back: 10, side: 0, lookAhead: -6, lookSide: 0, lookHeight: 1.35, fov: 55, follow: 0.34 },
  },
  {
    id: 'raised',
    name: 'Raised chase',
    note: 'Same axis, lifted and tipped down. Keeps the silhouette, shows more track.',
    rig: { height: 8, back: 9, side: 0, lookAhead: -9, lookSide: 0, lookHeight: 0.6, fov: 50, follow: 0.3 },
  },
  {
    id: 'diagonal',
    name: 'Overhead diagonal — shipping',
    note: 'The rig the build now uses: locked camera, causeway corner to corner.',
    rig: { ...CHASE_RIG },
  },
  {
    id: 'iso',
    name: 'Steep isometric',
    note: 'Near top-down. Maximum read of the lanes, the Professor becomes a hat.',
    rig: { height: 14, back: 10, side: 8, lookAhead: -9, lookSide: -3, lookHeight: 0.3, fov: 40, follow: 0.16 },
  },
]

type Field = { key: keyof CameraRig; label: string; min: number; max: number; step: number; unit: string }

const FIELDS: Field[] = [
  { key: 'height', label: 'Height', min: 2, max: 22, step: 0.5, unit: 'm' },
  { key: 'back', label: 'Distance behind', min: 2, max: 18, step: 0.5, unit: 'm' },
  { key: 'side', label: 'Side offset', min: -14, max: 14, step: 0.5, unit: 'm' },
  { key: 'lookAhead', label: 'Look-at, ahead', min: -20, max: 2, step: 0.5, unit: 'm' },
  { key: 'lookSide', label: 'Look-at, sideways', min: -10, max: 10, step: 0.5, unit: 'm' },
  { key: 'lookHeight', label: 'Look-at, height', min: -1, max: 4, step: 0.1, unit: 'm' },
  { key: 'fov', label: 'Field of view', min: 25, max: 75, step: 1, unit: '°' },
  { key: 'follow', label: 'Lane follow', min: 0, max: 1, step: 0.02, unit: '' },
]

const canvas = document.getElementById('view') as HTMLCanvasElement
const { scene } = createDemo(canvas)

let current: CameraRig = { ...PRESETS[0].rig }
let activePreset = PRESETS[0]

const sliders = new Map<keyof CameraRig, { input: HTMLInputElement; value: HTMLElement }>()

function apply(rig: CameraRig, { syncInputs = true } = {}) {
  current = { ...rig }
  scene.setRig(current)
  if (syncInputs) {
    for (const [key, ui] of sliders) {
      ui.input.value = String(current[key])
      ui.value.textContent = format(key, current[key])
    }
  }
  const lines = FIELDS.map((f) => `  ${f.key}: ${current[f.key]},`).join('\n')
  document.getElementById('rig')!.textContent = `const CHASE_RIG: CameraRig = {\n${lines}\n}`
}

function format(key: keyof CameraRig, value: number) {
  const field = FIELDS.find((f) => f.key === key)!
  return `${value}${field.unit}`
}

/* --- presets --- */
const presetsEl = document.getElementById('presets')!
for (const preset of PRESETS) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'preset'
  btn.dataset.id = preset.id
  btn.innerHTML = `<b>${preset.name}</b><span>${preset.note}</span>`
  btn.addEventListener('click', () => {
    activePreset = preset
    apply({ ...preset.rig })
    for (const el of presetsEl.children) el.classList.toggle('on', (el as HTMLElement).dataset.id === preset.id)
  })
  presetsEl.append(btn)
}

/* --- sliders --- */
const slidersEl = document.getElementById('sliders')!
for (const field of FIELDS) {
  const row = document.createElement('label')
  row.className = 'slider'
  const head = document.createElement('div')
  const name = document.createElement('span')
  name.textContent = field.label
  const value = document.createElement('b')
  head.append(name, value)
  const input = document.createElement('input')
  input.type = 'range'
  input.id = `rig-${field.key}`
  input.min = String(field.min)
  input.max = String(field.max)
  input.step = String(field.step)
  input.addEventListener('input', () => {
    const next = { ...current, [field.key]: Number(input.value) }
    apply(next, { syncInputs: false })
    value.textContent = format(field.key, Number(input.value))
  })
  row.append(head, input)
  slidersEl.append(row)
  sliders.set(field.key, { input, value })
}

document.getElementById('reset')!.addEventListener('click', () => apply({ ...activePreset.rig }))

presetsEl.children[0].classList.add('on')
apply({ ...PRESETS[0].rig })
