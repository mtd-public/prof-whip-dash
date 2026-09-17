/**
 * Mayan limestone palette. The causeway is a sacbé — a raised white road —
 * so the ground reads pale and chalky, and every saturated colour on screen
 * is either painted plaster (cinnabar red, jade, turquoise) or gold.
 */
export const PAL = {
  // Sacbé: weathered limestone, two tones alternating for the speed read
  slabLight: 0xe7dcc4,
  slabDark: 0xd2c3a3,
  slabWorn: 0xc0ae8c,
  groove: 0x9c8c6e,
  plaster: 0xefe6d2,

  // Painted stucco
  cinnabar: 0xb5432e,
  ochre: 0xd08a3c,
  jade: 0x2fa98c,
  turquoise: 0x3fbfd4,
  obsidian: 0x241f2b,

  // Jungle
  leaf: 0x3e8c57,
  leafDeep: 0x23573c,
  vine: 0x4f9e63,
  trunk: 0x53412f,

  // The Professor
  skin: 0xe8b489,
  shirt: 0xd9c89a,
  vest: 0x8a6a45,
  trouser: 0xa98a5f,
  boot: 0x6b4a30,
  hat: 0xc09a63,
  hatBand: 0x6f4a2c,
  leather: 0x7b4a2c,
  lens: 0x2b3a3c,

  // Threats
  rock: 0xb3a88c,
  rockDark: 0x8b8168,
  rockLight: 0xcabfa2,
  moss: 0x5d8a52,
  bug: 0x4a3f55,
  bugLeg: 0x332c3d,
  bugShell: 0x9a6bf0,
  eye: 0xf4e9d0,

  // Egypt
  sandLight: 0xdfc389,
  sandDark: 0xcbae76,
  sandWorn: 0xb89f6e,
  limestone: 0xe6dcc0,
  limestoneDark: 0xd6c9a6,
  graniteRed: 0xb07a5e,
  lapis: 0x2b5f9e,
  faience: 0x3fa7b8,
  egyptGold: 0xf0c24a,
  palmLeaf: 0x4f8c4a,
  palmLeafDeep: 0x3f7a3d,
  palmTrunk: 0x8a6b45,
  nemesFace: 0xe6cf9d,

  // Signal
  gold: 0xf2c14e,
  goldDeep: 0xc08a22,
  hazard: 0xe05437,
  clear: 0x4fb286,
  flame: 0xffa83c,
} as const

/** Sky and fog shift as the run gets deeper into the jungle. */
export const SKY = {
  near: 0x8fb39a,
  far: 0x2a4038,
} as const

/* ------------------------------------------------------------------ zones */

/**
 * Everything that changes between zones. Difficulty never reads from here —
 * it ramps off the level — because the themes loop and a zone coming back
 * around must not walk the challenge back down.
 */
export interface Biome {
  name: string
  surfaceLight: number
  surfaceDark: number
  divider: number
  dividerHighlight: number
  marker: number
  markerInlay: number
  edge: number
  edgeTop: number
  ground: number
  dust: number
  trees: 'jungle' | 'palm' | 'none'
  props: 'scatter' | 'stelae' | 'statues' | 'desert' | 'sphinxes' | 'avenue'
  edging: 'verge' | 'balustrade' | 'wall' | 'berm' | 'relief' | 'plinths'
  /** Pickup dressing for this world. */
  heart: number
  /**
   * How the skyline sits. `near` is the lateral offset; `z`, when given, pins
   * the prop at a fixed distance up the track instead of letting it recycle
   * past — which is what a destination should do. Portrait's horizontal field
   * is about 21°, so anything far off-axis is simply never in frame.
   */
  skyline: { kind: 'stepped' | 'smooth'; near: number; scale: number; z?: number }
  gate: {
    face: number
    brow: number
    jaw: number
    fang: number
    eye: number
    pupil: number
    pupilGlow: number
    crest: [number, number] | null
    vines: boolean
    tunnel: boolean
    height: number
    /** Egypt's gate is a pylon flanked by jackals, not a single mask. */
    style: 'mask' | 'pylon'
  }
}

/** The art theme for a run of three zones — not the simulation's World. */
export interface WorldTheme {
  name: string
  zones: Biome[]
  /** Sky dome stops, top to horizon. */
  sky: [string, string, string, string]
  fog: number
  fogDensity: number
  /** Chrome accent for the topbar lintel. */
  chrome: { stone: string; band: string; ink: string }
}

const MAYA_GATE = {
  eye: 0x241f2b,
  pupil: 0xf2c14e,
  pupilGlow: 0.6,
  vines: false,
  tunnel: false,
  style: 'mask' as const,
}

const EGYPT_GATE = {
  eye: 0x241f2b,
  pupil: 0xf0c24a,
  pupilGlow: 0.7,
  crest: null,
  vines: false,
  tunnel: false,
  style: 'pylon' as const,
}

export const WORLDS: WorldTheme[] = [
  {
    name: 'Maya',
    sky: ['#3f7f8e', '#82aea2', '#d6d9b4', '#b9bd98'],
    fog: 0xadb894,
    fogDensity: 0.011,
    chrome: { stone: '#d2c3a3', band: '#b5432e', ink: '#2b2118' },
    zones: [
      {
        name: 'Jungle trail',
        surfaceLight: 0x9c7b52,
        surfaceDark: 0x8a6a45,
        divider: 0x5f4a2e,
        dividerHighlight: 0xa98a5f,
        marker: 0x6b4a2c,
        markerInlay: 0x8c6238,
        edge: 0x6d5636,
        edgeTop: 0x7b6440,
        ground: 0x3e8c57,
        dust: 0xb5946a,
        trees: 'jungle',
        props: 'scatter',
        edging: 'verge',
        heart: 0x2fa98c,
        skyline: { kind: 'stepped', near: 30, scale: 1 },
        gate: { ...MAYA_GATE, face: 0x6b5a3e, brow: 0x7b5533, jaw: 0x5b4b33, fang: 0xcfc7ad, crest: null, vines: true, height: 5.2 },
      },
      {
        name: 'The sacbé',
        surfaceLight: 0xe7dcc4,
        surfaceDark: 0xd2c3a3,
        divider: 0x9c8c6e,
        dividerHighlight: 0xb5a687,
        marker: 0xb5432e,
        markerInlay: 0x2fa98c,
        edge: 0xc0ae8c,
        edgeTop: 0xd2c3a3,
        ground: 0x3e8c57,
        dust: 0xd8cdb0,
        trees: 'jungle',
        props: 'stelae',
        edging: 'balustrade',
        heart: 0x2fa98c,
        skyline: { kind: 'stepped', near: 30, scale: 1 },
        gate: { ...MAYA_GATE, face: 0xd2c3a3, brow: 0xb5432e, jaw: 0xc0ae8c, fang: 0xefe6d2, crest: [0x2fa98c, 0x3fbfd4], height: 6 },
      },
      {
        name: 'The city',
        surfaceLight: 0xe2dcbf,
        surfaceDark: 0xd3cdb0,
        divider: 0x3a3444,
        dividerHighlight: 0x565064,
        marker: 0x9a937c,
        markerInlay: 0xb5432e,
        edge: 0x8b856d,
        edgeTop: 0x9d977e,
        ground: 0xa9a48b,
        dust: 0xbdb7a2,
        trees: 'none',
        props: 'statues',
        edging: 'wall',
        heart: 0x2fa98c,
        skyline: { kind: 'stepped', near: 19, scale: 1.5 },
        gate: { ...MAYA_GATE, face: 0x9d977e, brow: 0xb5432e, jaw: 0x8b856d, fang: 0xc9c3a8, crest: null, pupil: 0xffa83c, pupilGlow: 1.4, tunnel: true, height: 7 },
      },
    ],
  },
  {
    name: 'Egypt',
    sky: ['#2f6fa8', '#8fb9c9', '#e6d6a8', '#f0dfae'],
    fog: 0xd8c79a,
    fogDensity: 0.0072,
    chrome: { stone: '#dfc389', band: '#2b5f9e', ink: '#241c12' },
    zones: [
      {
        name: 'The deep desert',
        surfaceLight: 0xdfc389,
        surfaceDark: 0xcbae76,
        divider: 0xa8874f,
        dividerHighlight: 0xe3cb97,
        marker: 0xc2a878,
        markerInlay: 0xb89f6e,
        edge: 0xdcc48d,
        edgeTop: 0xe3cb97,
        ground: 0xd4b87f,
        dust: 0xe6d3a4,
        trees: 'palm',
        props: 'desert',
        edging: 'berm',
        heart: 0x3fa7b8,
        // Far out and small — the whole point of the world's arc.
        skyline: { kind: 'smooth', near: 20, scale: 0.9, z: -175 },
        gate: { ...EGYPT_GATE, face: 0xdcc48d, brow: 0xb07a5e, jaw: 0xc2a878, fang: 0xe6cf9d, height: 5.6 },
      },
      {
        name: 'The causeway',
        surfaceLight: 0xe6dcc0,
        surfaceDark: 0xd6c9a6,
        divider: 0xa9997a,
        dividerHighlight: 0xc4b795,
        marker: 0xb07a5e,
        markerInlay: 0x2b5f9e,
        edge: 0xc8b68f,
        edgeTop: 0xd6c9a6,
        ground: 0xcdb079,
        dust: 0xe0d2ab,
        trees: 'palm',
        props: 'sphinxes',
        edging: 'relief',
        heart: 0x3fa7b8,
        skyline: { kind: 'smooth', near: 24, scale: 1.8, z: -135 },
        gate: { ...EGYPT_GATE, face: 0xe6dcc0, brow: 0xb07a5e, jaw: 0xd6c9a6, fang: 0xefe6d2, height: 6.4 },
      },
      {
        name: 'The temple city',
        surfaceLight: 0xd8ccb2,
        surfaceDark: 0xc9bda4,
        divider: 0x2b5f9e,
        dividerHighlight: 0xf0c24a,
        marker: 0xa7987c,
        markerInlay: 0xb07a5e,
        edge: 0xb3a488,
        edgeTop: 0xc3b393,
        ground: 0xbdae94,
        dust: 0xcabb9e,
        trees: 'none',
        props: 'avenue',
        edging: 'plinths',
        heart: 0x3fa7b8,
        skyline: { kind: 'smooth', near: 28, scale: 2.8, z: -100 },
        gate: { ...EGYPT_GATE, face: 0xd9c79c, brow: 0xb07a5e, jaw: 0xc3b393, fang: 0xe6cf9d, pupilGlow: 1.3, height: 7.4 },
      },
    ],
  },
]

const ZONES_PER_WORLD = 3

/** Worlds alternate every three levels; the zone cycles inside each. */
export function worldForLevel(level: number): WorldTheme {
  const i = Math.floor((Math.max(1, level) - 1) / ZONES_PER_WORLD) % WORLDS.length
  return WORLDS[i]
}

export function biomeForLevel(level: number): Biome {
  return worldForLevel(level).zones[(Math.max(1, level) - 1) % ZONES_PER_WORLD]
}
