# World 2 — Egypt (levels 4–6)

**Status:** built. Both worlds, the radial health ring, heart pickups, the
boulder countdown and the Cinzel chrome are all in `src/`.

**Concepts:** https://claude.ai/artifact/AxY82sfgSRbKcMRseg58Kx

## The plan

| Level | Zone | Ground | Entered through |
| --- | --- | --- | --- |
| 4 | The deep desert | Wind-combed sand, palm shade | Pylon gate |
| 5 | The causeway | Processional stone between ram sphinxes | Pylon gate |
| 6 | The temple city | Granite avenue, colossi, obelisks | Pylon gate |

Worlds **alternate**: `world = floor((level - 1) / 3) % 2`, so levels 1–3 are
Maya, 4–6 Egypt, 7–9 Maya again, and so on forever. Zone is still
`(level - 1) % 3`. Difficulty keys off the **level**, never the zone or the
world — level 7's jungle is much harder than level 1's, same trees.

## Approaching the pyramids

The brief was to start in open desert and arrive at the city, so the pyramids
have to grow across three levels. They do it by moving **up the track**, not
out to the side:

| Zone | `skyline.z` | `skyline.scale` |
| --- | --- | --- |
| Deep desert | −175 | 0.9 |
| Causeway | −135 | 1.8 |
| Temple city | −100 | 2.8 |

This is the one non-obvious constraint in the whole world. Portrait at fov 43
is roughly a **21° horizontal** field — anything at ±90 lateral offset, where
the Maya pyramids sit happily in the corner of a landscape frame, is simply
off-screen. A pyramid you want the player to see has to be near the road's
vanishing point. Egypt's fog is also thinner than the jungle's
(`0.0072` vs `0.011`) so the far shapes survive the distance.

Two related traps, both hit during the build:

- **A variable pyramid base drifts into the road.** `30 + r()*14` produced a
  100m-wide mass sitting on the lanes. The Egyptian base is fixed.
- **Easing between skyline kinds is wrong.** Stepped (Maya) and smooth
  (Egypt) pyramids are different shapes, not different sizes, so the lerp
  snaps (`ease = 1`) when the kind changes and only eases within a world.

## The health ring

The top health bar is **gone**. Health lives on the Professor's back as a
six-segment gold ring — a torus split into arcs, parented to the runner at
`(0, 1.34, −0.26)` and turned to face the camera. A hit unlights a segment and
throws a pooled shard; the ring goes ochre at two segments and hazard-red with
a pulse at one. The HUD keeps only the level meter, the readout and the grit
line, which now carries the critical-health state the bar used to.

The ring is legible because the camera is locked overhead-diagonal and the
Professor's back is always square to it. On a chase camera this idea does not
work at all.

**Both pickups heal.** The idol still heals as it always did; hearts
(scarab-winged in Egypt, plain in Maya, so they are rebuilt on world change —
a scarab is not a tinted heart) restore one segment, `100 / 6`. Hearts spawn
every 11–18 seconds and only into a **clear lane**: a lane no boulder holds and
none is committing to. Without that check the heal is bait.

## The boulder countdown

Each boulder carries a sprite showing whole seconds until it rolls out of
frame, drawn from `TUNING.boulderLife - age` against pre-rendered Cinzel
numeral textures (pale 5–4, amber 3–2, green 1). Three sprites are pooled. It
turns the despawn timer from something the player infers into something they
can plan a lane change around.

## Chrome

`Cinzel` for display, `Alfa Slab One` for the shout, `Courier Prime` for the
readout — the Legends-of-the-Hidden-Temple register the brief asked for,
without a licensed face. The topbar is a carved lintel: incised text-shadow
and a painted course under it. `.app[data-world='Egypt']` repaints
`--chrome-stone`, `--chrome-band` and `--chrome-ink` from limestone and lapis,
so the frame changes with the world while the layout does not move.
