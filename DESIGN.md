# Professor WhipDash — design concepts v0.1

A three-lane endless runner for portrait phones and tablets. A fedora'd
academic outruns a rockslide down a collapsing temple causeway. The boulders
are **behind** him; the vermin are **in front** of him; the whip is the only
answer to the second problem and lane position is the only answer to the
first.

Live concept board (every model rendered from three.js primitives in the
browser): `web/index.html` · Playable vertical slice: `web/play.html`

---

## 1. The core loop

1. Auto-run forward, three lanes, speed ramps with distance.
2. Boulders behind you claim lanes in **rows**. At least one lane in a row is
   always clear — the game is finding it, not reacting to a coin flip.
3. Sharing a lane with a claiming boulder does not kill you, it **grinds**:
   a continuous HP drain that only stops when you reach a clear lane.
4. Spiders and scarabs sit in front of you. Tap to crack the whip; it reaches
   2–5m ahead **in your own lane only**, so the decision is *when*, not *where*.
5. A vermin hit costs 12 HP and a 0.6s stumble — and the real price is that
   the boulders close 4m while you're slow.

## 2. The core problem: the threat is behind the camera

A chase camera looks forward. If the player can't read which lanes are
claimed, every hit feels unfair. Four devices put the rear threat on screen
without ever turning the camera around:

| Device | What it does |
| --- | --- |
| **Lane ribbon** | Three pips across the top, welded to the lanes below. Jade = clear, amber = a boulder is committing (1.2s telegraph), red = claimed and grinding. The only pure-UI element in the game, and the one you actually play off. |
| **Shadows arriving first** | The key light sits behind the runner, so each boulder throws a long shadow *past* him onto the slabs ahead. Shadow width reads as distance. |
| **Dust at the frame edge** | A bottom vignette of ochre grit, tinted red and tightened as the nearest claiming boulder closes. Peripheral, never blocking. |
| **The shoulder glance** | Every ~20s, or on the first frame of a grind, the camera dips and rolls 12° for 0.4s. A flourish with a job: it re-establishes the geography for free. |

## 3. Numbers

| Parameter | Value | Why |
| --- | --- | --- |
| Health pool | 100 HP, 6 visible segments | Players count hits, not pixels |
| Grind drain | 18 HP/s (ramps 12 → 24 over 3s in-lane) | Lingering punished harder than clipping |
| Contested drain | 6 HP/s | The telegraph has teeth |
| Vermin hit | −12 HP + 0.6s stumble | Cost is positional, not just numeric |
| Regeneration | +4 HP/s after 2.5s fully clear | Reaching safety *is* the reward loop |
| Whip window | 0.42s (target 2–5m out) | Late crack = graze, no damage, no punish |
| Perfect crack | target 3.0–3.8m | +1 combo, +8% speed for 2s, relics double |
| Lane switch | 0.16s | Dodge on reaction; panic-tapping overshoots |
| Run speed | 11 → 21 m/s, +0.35 per 100m | Boulders hold 1.04× player speed while claiming |
| Boulder stand-off | 2.4m grinding / 11.5m holding | Holding boulders sit behind the camera and *roll into frame* when they commit |

## 4. The cast

| Actor | Behaviour |
| --- | --- |
| **Professor WhipDash** | 1.8m. Fedora (brim oversized to 0.88m for the silhouette test), goggles on the brim, field vest, satchel, 9-segment whip. |
| **Grindstone** | Picks one lane and stays. Never accelerates, never leaves. The metronome of the chase. |
| **The Tumbler** | Mossy, lopsided, drifts one lane every 3–5s. Wobble + amber pip before it commits. |
| **The Idol** | Carved face, gold band, red eyes. Holds two lanes back, then lunges a full lane in 0.5s. Eyes flare on the wind-up. |
| **Cave spider** | Drops into your lane on a thread. Violet dorsal flash = whippable. |
| **Scarab** | Trundles across lanes at ankle height; the gold horn is the aim point. |
| **Relic shard** | The only emissive pickup on the track. Three shards = +12 HP. |

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
- **Fog**: `FogExp2` tinted to the biome sky, hiding the module recycle seam.
- **Post**: vignette and dust are CSS layers over the canvas. Zero GPU passes.
- **Silhouette rule**: every actor must be identifiable as a black shape at
  40px tall.
- **Emissive budget**: torches, relics, Idol eyes. Nothing else glows, so
  glow always means something.

### Palette

| Hex | Role |
| --- | --- |
| `#D8B98C` / `#C6A476` | Slab light / slab dark (alternating at 2.86m gives the speed read) |
| `#4E9A62` / `#2F6B4A` | Canopy / deep leaf |
| `#8F8880` | Granite |
| `#C09A63` | Fedora |
| `#F0BC48` | Gold — reward |
| `#E05437` | Hazard — grinding |
| `#4FB286` | Clear — safe lane |

## 6. Portrait and the hand

- 9:16 play column at every size. Tablets and landscape get the same column,
  pillarboxed — the lanes never widen.
- Camera: 55° vertical FOV at (0, 4.6, 10.0), looking 6m ahead. Portrait crops
  the sides, never the read.
- Swipe ←/→ to change lane (28px threshold, 120ms input buffer). Tap anywhere
  to crack the whip (0.30s cooldown). Swipe ↓ to slide (reserved).
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

## 9. Progression

| Biome | From | Change |
| --- | --- | --- |
| Causeway | 0m | Sandstone, jade canopy, torchlight |
| Flooded vault | 1500m | Wet slabs with a reflection plane, cooler key, boulders throw spray |
| The furnace | 3500m | Obsidian and ember light; the Idol's eyes stop being the brightest thing on screen |

## 10. Open questions

- Does the second claimed lane (from 700m) arrive too early? It halves the
  decision space and may want to be a 1200m threshold.
- Slide is built into the input layer but has no obstacle yet — low vine
  arches are the obvious candidate, but they compete with the vermin for the
  player's forward attention.
- The Idol's lunge currently has no audio tell. Without one it may read as
  unfair at 18 m/s.
