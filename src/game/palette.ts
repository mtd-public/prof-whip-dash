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
