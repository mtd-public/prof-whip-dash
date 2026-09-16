# Biomes — design note (levels 1–3)

**Status:** wireframe agreed? Not yet — mock published, awaiting sign-off before
any engine work. Nothing in `src/` has changed on this branch.

**Mock:** https://claude.ai/artifact/EoDuNrUZgfMkTrDHWdA6SR

## The plan

| Level | Zone | Ground | Entered through |
| --- | --- | --- | --- |
| 1 | Jungle trail | Packed dirt, cart ruts, plank sleepers | Timber trail gate |
| 2 | The sacbé | The limestone causeway shipping today | Corbelled stone arch |
| 3+ | The city | Flagstone plaza, obsidian inlay | Fortress tunnel |

Levels 1 and 2 share their jungle, pyramids and sky — only the road changes.
Level 3 replaces all of it: no trees, a paved plaza between fortress walls with
flame braziers, colossal statues flanking the road, and three pyramids close
enough to read as architecture rather than skyline.

Constant across all three: camera, fog, lane geometry (1.8m lanes, 12m modules,
2.86m cadence), boulders, coins, idol, vermin and the HUD.

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

**The gate** rides the seam module and passes over the runner, turning a
material change into a place you run through. One prop, three dressings: a
lashed timber gate into the trail, a corbelled stone arch into the sacbé, a
fortress tunnel mouth into the city. Each opening clears the full 5.6m road
with headroom, so nothing about lane switching or the whip changes underneath.
The tunnel is the only one with an inside — about 0.3s at run speed, enough for
the light to drop and come back.

## Dust

The runner leaves no mark today, which is most of why he reads as sliding over
the ground rather than pushing off it.

- **Running:** two puffs per stride, spawned at the heel, growing 0.25m → 0.7m
  and fading out over 0.5s.
- **Lane change:** a six-particle scuff thrown out of the turn, ~0.4m of
  lateral spread.
- Flat quads, no physics, pooled. The dust takes the zone's colour — brown on
  the trail, pale limestone on the sacbé, fine grey ash in the city.

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
| `src/game/palette.ts` | A `BIOMES` table with three entries: surface tones, marker colours, edging, prop list, dust colour |
| `src/game/kit.ts` | `makeTrackSegment(seed, biome)` branches surface, dividers, cadence markers, edging and props. Jungle, pyramid and sky code untouched |
| `src/game/scene3d.ts` | On recycle, rebuild a module if the level's biome changed. Eight rebuilds spread over ~7s. Plus the gate prop on the seam module and the pooled dust emitter |
| `src/game/kit.ts` (props) | Three gates, the city's fortress wall and battlements, colossal statues, two larger pyramids |
| `src/game/physics.ts` | Nothing. Biome derives from `level`, which already exists |

Triangle count is roughly even — sleepers and ruts replace bands and grooves
one for one.

## Open questions

1. **Level 4+** — default is that the city holds from level 3 onward: it is the
   destination, so arriving and staying reads better than looping back to the
   jungle. Cycling all three is the alternative and costs nothing extra.
2. **Is the city road flagstone?** Specified surroundings, not ground. Drawn as
   a polished flagstone plaza so the progression reads dirt → cut stone →
   finished stone. The sacbé could simply continue through the city instead.
3. **Is level 1 also easier?** Still open. Difficulty ramps on raw distance
   today, so the trail is purely a skin. A gentler first 500m (one boulder
   lane, slower vermin) is a tuning change, not an art one.
