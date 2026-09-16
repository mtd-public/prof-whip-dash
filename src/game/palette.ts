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
 * Everything that changes between zones. The theme loops — zone index is
 * `(level - 1) % 3` — so difficulty has to ramp off the level, never off the
 * zone, or the game would get easier every time the trail came back around.
 */
export interface Biome {
  name: string
  /** Alternating road tones. */
  surfaceLight: number
  surfaceDark: number
  /** Lane lines: carved groove, cart rut or obsidian inlay. */
  divider: number
  dividerHighlight: number
  /** The 2.86m cadence marker that carries the speed read. */
  marker: number
  markerInlay: number
  /** Kerb / verge / wall. */
  edge: number
  edgeTop: number
  /** Ground either side of the road. */
  ground: number
  /** Heel dust. */
  dust: number
  trees: boolean
  /** Roadside dressing. */
  props: 'scatter' | 'stelae' | 'statues'
  edging: 'verge' | 'balustrade' | 'wall'
  /** Gate dressing — the idol you run into. */
  gate: {
    face: number
    brow: number
    jaw: number
    fang: number
    eye: number
    /** Eye sockets burn in the city. */
    pupil: number
    pupilGlow: number
    crest: [number, number] | null
    vines: boolean
    /** Only the city maw has a throat. */
    tunnel: boolean
    height: number
  }
}

export const BIOMES: Biome[] = [
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
    trees: true,
    props: 'scatter',
    edging: 'verge',
    gate: {
      face: 0x6b5a3e,
      brow: 0x7b5533,
      jaw: 0x5b4b33,
      fang: 0xcfc7ad,
      eye: 0x241f2b,
      pupil: 0xf2c14e,
      pupilGlow: 0.5,
      crest: null,
      vines: true,
      tunnel: false,
      height: 5.2,
    },
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
    trees: true,
    props: 'stelae',
    edging: 'balustrade',
    gate: {
      face: 0xd2c3a3,
      brow: 0xb5432e,
      jaw: 0xc0ae8c,
      fang: 0xefe6d2,
      eye: 0x241f2b,
      pupil: 0xf2c14e,
      pupilGlow: 0.6,
      crest: [0x2fa98c, 0x3fbfd4],
      vines: false,
      tunnel: false,
      height: 6,
    },
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
    trees: false,
    props: 'statues',
    edging: 'wall',
    gate: {
      face: 0x9d977e,
      brow: 0xb5432e,
      jaw: 0x8b856d,
      fang: 0xc9c3a8,
      eye: 0x241f2b,
      pupil: 0xffa83c,
      pupilGlow: 1.4,
      crest: null,
      vines: false,
      tunnel: true,
      height: 7,
    },
  },
]

/** The theme loops every three levels. */
export function biomeForLevel(level: number): Biome {
  return BIOMES[(Math.max(1, level) - 1) % BIOMES.length]
}
