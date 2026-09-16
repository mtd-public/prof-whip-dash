# Professor WhipDash — design concepts v0.1

A three-lane endless runner for portrait phones and tablets. A fedora'd
academic outruns a rockslide down a **sacbé** — the white limestone causeway
of a Mayan city. The boulders are **behind** him; the vermin are **in front**
of him; the gold is in whichever lane is currently trying to kill him.

Live art bible (every model rendered from three.js primitives in the browser):
`board.html` · The game: `index.html` · Both build from `src/game/`.

---

## 1. The core loop

1. Auto-run forward, three lanes, speed ramps with distance.
2. Boulders behind you claim lanes in **rows**. At least one lane in a row is
   always clear — the game is finding it, not reacting to a coin flip.
3. Sharing a lane with a claiming boulder does not kill you, it **grinds**:
   a continuous HP drain that only stops when you reach a clear lane. No
   boulder holds a lane for more than **5 seconds** — then it breaks away,
   overtakes the runner and rolls off down the causeway ahead of him, and that
   lane cools down for 2s before it can be claimed again.
4. Spiders and scarabs sit in front of you. Tap to crack the whip; it reaches
   2–5m ahead **in your own lane only**, so the decision is *when*, not *where*.
5. A vermin hit costs 12 HP and a 0.6s stumble — and the real price is that
   the boulders close 4m while you're slow.
6. **70% of coin runs spawn in a lane a boulder owns or is about to own**, and
   the payout multiplier is 1 in a clear lane, 2 while contested, 3 while
   being ground. The whole game is one question: how long can you stay in the
   red lane?

## 2. The core problem: reading the threat

Under the original chase camera the boulders sat *behind the lens* entirely,
and these four devices existed to put them on screen. The overhead diagonal
changes the balance: all three lanes and the blocks holding them are now in
frame, so the ribbon confirms what you can already see rather than being the
only source of truth. It stays — a red pip is faster to read at 20 m/s than a
silhouette — but it is no longer load-bearing.

| Device | What it does |
| --- | --- |
| **The camera** | Since the overhead diagonal, every lane and every block holding one is on screen. This row used to be a three-pip lane ribbon; it was confirming what the player could already see, so it is gone and the HUD is two bars instead. |
| **Shadows arriving first** | The key light sits behind the runner, so each boulder throws a long shadow *past* him onto the slabs ahead. Shadow width reads as distance. |
| **Dust at the frame edge** | A bottom vignette of ochre grit, tinted red and tightened as the nearest claiming boulder closes. Peripheral, never blocking. |
| **The shoulder glance** | Not built, and the overhead diagonal may have made it unnecessary — the geography is permanently on screen now. |

## 3. Numbers

| Parameter | Value | Why |
| --- | --- | --- |
| Health pool | 100 HP, one long bar with quarter marks | Countable without chopping the bar into segments |
| Level | one per 500m | The jade meter under the health bar. Levels arrive faster as speed ramps: 43s, 39s, 35s, 33s, 29s… |
| Grind drain | 18 HP/s (ramps 12 → 24 over 3s in-lane) | Lingering punished harder than clipping |
| Contested drain | 6 HP/s | The telegraph has teeth |
| Vermin hit | −12 HP + 0.6s stumble | Cost is positional, not just numeric |
| Regeneration | +4 HP/s after 2.5s fully clear | Reaching safety *is* the reward loop |
| Whip window | 0.42s (target 2–5m out) | Late crack = graze, no damage, no punish |
| Perfect crack | target 3.0–3.8m | +1 combo, +8% speed for 2s, relics double |
| Lane switch | 0.16s | Dodge on reaction; panic-tapping overshoots |
| Run speed | 11 → 21 m/s, +0.35 per 100m | Boulders hold 1.04× player speed while claiming |
| Boulder stand-off | 2.4m grinding / 11.5m holding | Holding boulders sit back up the causeway; a claim brings one down onto your heels |
| Boulder lifetime | 5s, then a 1.6s roll-away | Nothing grinds you forever; it accelerates past you and away up the track, never fading in place |
| Despawn swerve | 2.4m, over a 5m window | It swings wide to overtake rather than rolling through the runner — 0.36m of clearance at the pass |
| Lane cooldown | 2s after a despawn | Longer than the roll-away, so a lane is never re-claimed while its block is still in flight. A guard stops all three cooling at once |
| Coin run | 4–8 coins, 2.2m apart, one lane | 70% threaded through the dangerous lane |
| Coin value | 1 × multiplier | Multiplier is 1 / 2 / 3 by lane state |
| Jade idol | 25 × multiplier, every 16–26s | Always spawns in the dangerous lane |
| Score | coins × 10 + metres | Coins are the skill expression; distance is the participation trophy |

## 4. The cast

| Actor | Behaviour |
| --- | --- |
| **Professor WhipDash** | 1.8m. Fedora (brim oversized to 0.88m for the silhouette test), goggles on the brim, field vest, satchel, 9-segment whip. |
| **Limestone block** | Picks one lane and stays. Never accelerates, never leaves. The metronome of the chase. |
| **The overgrown** | Mossy, vine-trailed, lopsided. Drifts one lane every 3–5s; wobble + amber pip before it commits. |
| **Kukulkán** | A feathered-serpent mask carved into the leading face: cinnabar plaster, obsidian eyes, jade plumes. Holds back, then lunges a full lane in 0.5s. |
| **Cave spider** | Drops into your lane on a thread. Violet dorsal flash = whippable. |
| **Jade scarab** | Trundles across lanes at ankle height; the gold horn is the aim point. |
| **Glyph coin** | Faintly emissive, so a run reads as a line of light through the dangerous lane. |
| **Jade idol** | Plumed headdress, obsidian eyes, cinnabar plinth. Only ever spawns in the lane that hurts. |

## 5. Art direction — "just under premium"

The Kenney read comes from restraint; the premium half is entirely lighting,
tone mapping and timing.

- **Geometry**: boxes, cylinders, icosahedra assembled in code. No downloaded
  mesh, no texture, no UVs. See `web/whipdash-kit.js`.
- **Material**: `MeshLambertMaterial`, `flatShading: true`. No PBR cost.
- **Light rig**: hemisphere `#BFD8E8` over `#4A3F2E` at 0.85, warm key 1.35
  from behind-left (this is what throws the boulder shadows forward), cool
  rim 0.5.
- **Tone map**: ACES Filmic at 1.05 exposure — the single biggest step up
  from "hobby WebGL".
- **Sky**: one unlit gradient dome, no fog, one draw call — the difference
  between "a scene" and "a void above a road".
- **Fog**: `FogExp2` at 0.011 in a pale jungle haze, so distance fades into
  humidity rather than to black, and it hides the module recycle seam.
- **Post**: vignette and dust are CSS layers over the canvas. Zero GPU passes.
- **Silhouette rule**: every actor must be identifiable as a black shape at
  40px tall.
- **Emissive budget**: torches, relics, Idol eyes. Nothing else glows, so
  glow always means something.

### Palette

| Hex | Role |
| --- | --- |
| `#E7DCC4` / `#D2C3A3` | Sacbé light / dark (alternating at 2.86m gives the speed read) |
| `#B5432E` | Cinnabar — painted glyph bands, serpent banding, stela caps |
| `#2FA98C` / `#3FBFD4` | Jade / turquoise — inlay, plumes, scarab shell |
| `#241F2B` | Obsidian — eyes, jaw lines |
| `#3E8C57` / `#23573C` | Canopy / deep leaf |
| `#C09A63` | Fedora |
| `#F0BC48` | Gold — reward |
| `#E05437` | Hazard — grinding |
| `#4FB286` | Clear — safe lane |

## 6. Portrait and the hand

- 9:16 play column at every size. Tablets and landscape get the same column,
  pillarboxed — the lanes never widen.
- Camera: overhead diagonal — 43° FOV, 16m up, 18m back, 8m to the side,
  looking 12.5m ahead. Locked laterally, so lane changes move the runner
  across the frame. Tune it on `camera.html`, which prints the rig to paste.
- Lane changes fire the moment a swipe passes 28px rather than on release — at
  20 m/s, waiting for pointerup is a hit — and the origin resets after each
  one, so a long drag crosses two lanes.
- **Two ways to change lane, both answering the same question.** Swipe ←/→
  (28px threshold, fires on threshold rather than release — at 20 m/s waiting
  for pointerup is a hit), or tap the left/right half of the board, which moves
  to that side. The split is measured against the board, not the window, so the
  pillarboxed landscape layout still divides down the middle of the play area.
- **The whip has its own button** in portrait: a bar across the bottom of the
  board, 90dvw wide and 62px tall, centred so either thumb reaches it. It sits
  below the runner, who rides about two thirds down under the overhead camera.
  It stops its own pointer events reaching the board, so cracking never costs a
  lane change — though it does mean the bottom ~9% of the board is whip, not
  lane. Landscape and desktop keep the footer bar instead. Space works
  everywhere.
- Swipe ↓ to slide (reserved).
- No interactive UI in the bottom 12% — that's where the thumb and the home
  indicator live. Pause is top-right.
- Haptics carry the grind: a 30ms tick per HP segment lost, escalating.
- First session: boulders held 14m back until the first successful crack.
  Nobody reads a tutorial.

## 7. Juice, in build order

1. Crack impact — 2 frames of hitstop, whip tip flashed white, 0.06 camera punch.
2. Lane-change lean — body roll to 14°, hat brim lagging 3 frames.
3. Grind contact — 0.35 shake, sparks off the kerb, hard tick per HP segment.
4. Boulder rumble — low-pass noise bed whose cutoff tracks nearest distance.
5. Relic pickup — gem scales to 1.4 and vanishes in 5 frames, bell note up the combo scale.
6. Near miss — boulder within 0.6m of a lane edge: FOV +4° and back over 0.5s.
7. Death — camera drops to slab height, boulder rolls over the lens, cut to score.
8. Revive — one per run: Idol's eyes go dark, boulders reset 18m back, 40 HP returned.

## 8. Performance budget

| Budget | Target |
| --- | --- |
| Draw calls / frame | ≤ 90 (materials shared across every module) |
| Triangles on screen | ≤ 45k |
| Shadow map | one directional light, 1024², frustum tightened to 18×21m |
| Device pixel ratio | capped at 2.0 |
| Track | six recycled 12m modules, ~1,900 tris each |

## 9. Progression — the three zones

One zone per level, 500m each, and the theme **loops**: zone index is
`(level - 1) % 3`.

| Level | Zone | Ground | Entered through |
| --- | --- | --- | --- |
| 1, 4, 7… | Jungle trail | Packed earth, cart ruts, half-buried sleepers | Timber idol, moss and vines |
| 2, 5, 8… | The sacbé | Limestone slabs, carved grooves, cinnabar bands | The Kukulkán mask in plaster |
| 3, 6, 9… | The city | Flagstone plaza, obsidian inlay, fortress walls | The stone maw, eyes alight |

Because the theme loops, **difficulty ramps off the level, never the zone** —
otherwise the game would get easier every time the trail came back around.
Level 1 is the on-ramp: one lane claimed at a time, vermin 2.8s apart, longer
gaps between boulder rows. From level 2 a second claimed lane becomes a coin
flip that hardens each level, capping at 85%, and vermin close up to 0.75s.

The gate rides the seam module: each 12m module is rebuilt in the new zone as
it recycles behind the camera, so the boundary enters 96m out and sweeps toward
the runner over about 7s, with the idol's jaws arriving at the seam. Its
opening clears the full 5.6m road, upper fangs hang at the corners and the
lower teeth sit outside the road, so nothing rises into a running lane.

Dust comes off the heels while running — a puff every 0.14s, growing 0.26m to
0.72m and fading over ~0.4s — with a six-particle scuff thrown out of every
lane change. Flat ground-aligned quads, pooled at 40, tinted per zone.

## 10. Open questions

- Does the second claimed lane (from 900m) arrive too early? It halves the
  decision space and may want a 1200m threshold.
- Is ×3 enough to make players *want* the red lane, or does the 18 HP/s drain
  dominate? The two numbers are the whole economy and want playtesting
  together, not separately.
- The 5s boulder life caps the worst case at 90 HP of grind — just under a
  full bar. Deliberate, but it means a player who ignores the ribbon entirely
  survives one full claim and no more.
- With a locked camera, a lane change moves the runner diagonally across the
  frame rather than horizontally. It reads fine at this offset; it would not
  at a much larger one.
- Slide is built into the input layer but has no obstacle yet — low vine
  arches are the obvious candidate, but they compete with the vermin for the
  player's forward attention.
- The Idol's lunge currently has no audio tell. Without one it may read as
  unfair at 18 m/s.
