# Biomes — design note (level 1–2)

**Status:** wireframe agreed? Not yet — mock published, awaiting sign-off before
any engine work. Nothing in `src/` has changed on this branch.

**Mock:** https://claude.ai/artifact/EoDuNrUZgfMkTrDHWdA6SR

## The plan

| Level | Biome | Ground |
| --- | --- | --- |
| 1 | Jungle trail | Packed dirt road, cart ruts, plank sleepers |
| 2+ | The sacbé | The limestone causeway the game ships today |

Trees, pyramids, sky, fog, camera, boulders, coins, idol and vermin are
identical in both. The road is the only thing that changes — which is what
makes the change land.

## The one real problem: a dirt road has no joints

The sacbé gets its sense of speed from a cinnabar band every 2.86m. At 20 m/s
that banding is a pulse, and it is why the causeway reads as fast rather than
as a sliding texture. Bare earth has nothing to pulse with. Two devices carry
the read across:

- **Cart ruts along the lane lines** — lane separation without a painted mark,
  doing the job the carved grooves do on stone.
- **Plank sleepers across the road** — on the same 2.86m cadence as the slab
  joints, so the pulse rate is unchanged between biomes.

Get this wrong and level 1 feels slower than level 2 for reasons the player
cannot name.

## The transition

The track is eight recycled 12m modules — 96m of road. Rebuild each module in
the new biome **as it recycles behind the camera**, so the boundary enters at
the far end and sweeps toward the runner. At level-up speed (~13 m/s) the seam
reaches the runner in about 7s and the last old-biome module leaves about 7s
after that. Swapping all eight at once would pop the world over.

## Palette

| Hex | Role |
| --- | --- |
| `#8A6A45` | Packed earth |
| `#9C7B52` | Worn running line down each lane |
| `#5F4A2E` | Cart rut |
| `#6B4A2C` | Plank sleeper |
| `#6D5636` | Trodden verge |
| `#8D8570` | Loose stone |

Earth sits below limestone in value on purpose: the step up at level 2 should
read as an arrival — brighter ground, harder edges.

## Build sketch

| Where | What |
| --- | --- |
| `src/game/palette.ts` | A `BIOMES` table with two entries: surface tones, marker colours, edging, prop list |
| `src/game/kit.ts` | `makeTrackSegment(seed, biome)` branches surface, dividers, cadence markers, edging and props. Jungle, pyramid and sky code untouched |
| `src/game/scene3d.ts` | On recycle, rebuild a module if the level's biome changed. Eight rebuilds spread over ~7s |
| `src/game/physics.ts` | Nothing. Biome derives from `level`, which already exists |

Triangle count is roughly even — sleepers and ruts replace bands and grooves
one for one.

## Open questions

1. **Level 3+** — default is that the sacbé stays for every level after the
   first, so the change is an arrival rather than a rhythm. Alternating is the
   other option.
2. **A gateway at the seam** — a stone arch straddling the boundary turns the
   swap into a landmark you run through. Costs one new prop.
3. **Is level 1 also easier?** Difficulty currently ramps on raw distance, so
   the trail is a skin. A gentler first 500m (one boulder lane, slower vermin)
   is a tuning change, not an art one.
