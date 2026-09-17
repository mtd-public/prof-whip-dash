# World 2 — design note (levels 4–6, plus three UI changes)

**Status:** concepts only. Nothing in `src/` has changed on this branch.

**Mock:** https://claude.ai/artifact/WRd1MZix2gL4yq33HrQfUT

## The zones

| Level | Zone | Ground | Skyline |
| --- | --- | --- | --- |
| 4 | The deep desert | Rippled sand, sledge ruts, half-buried kerb stones | Pyramids 220m out, small and hazed |
| 5 | The causeway | Dressed limestone, granite thresholds inlaid lapis and gold | Pyramids 90m, the Great Sphinx |
| 6 | The temple city | Polished granite, lapis and gold lane inlay | Pyramids 28m, pylon gate closing the avenue |

The progression mirrors World 1 — rough ground, dressed stone, finished stone —
but **the pyramids growing across the three zones give World 2 a direction
World 1 never had.** That is one skyline config per zone (count, distance,
scale), replacing the hardcoded lerp the Mayan city already uses.

Roadside: palms, bones and toppled markers in the desert; ram-headed sphinxes
and obelisks on the causeway; a full avenue of sphinxes and colossal seated
statues in the city.

## Where World 2 sits

Keep the three-zone cycle and alternate the world every three levels:

```
zone  = (level - 1) % 3
world = floor((level - 1) / 3) % 2
```

So levels 1–3 are Maya, 4–6 Egypt, 7–9 Maya again. Difficulty keeps ramping off
the level, untouched by either. Adding World 3 later is one more entry.

## The gate

World 1's gate is the open mouth of the thing chasing you. Egypt has no
monster-mouth doorway, but it has the **pylon** — two battered towers with the
gap between them, flanked by colossi. So you run *between* a pair of colossal
seated jackals under a winged sun disc, and the same jackal is the face carved
on World 2's third boulder. The rule holds: the gate is always the thing
hunting you, made enormous.

Everything else about the gate carries over unchanged — the opening clears the
5.6m road, it rides the seam module, one builder with three dressings.

## Typeface

Anton is a condensed grotesque doing a poster job; it reads modern. "Legends of
the Hidden Temple" and "Indiana Jones" both mean the same thing
typographically: **serifs with weight, cut rather than drawn.**

| Role | Face | Why |
| --- | --- | --- |
| Wordmark, headings | **Cinzel** 700 | Roman inscriptional capitals — the letterform actually cut into temple stone, and it holds at 15px where the heavier options clog |
| In-world shouts | **Alfa Slab One** | A 1930s serial poster. For CRACK!, LEVEL 4, IDOL +75 |
| HUD labels, counters | **Courier Prime** | A typewriter: field notes and expedition manifests, replacing IBM Plex Mono's engineering register |
| Body, overlays | Public Sans | Unchanged — the one face here doing no acting |

Fallback if Cinzel reads too formal in motion: **Bevan**, a woodtype slab as
chunky as Anton but with serifs.

Topbar treatment: a carved lintel — stone band, incised wordmark, buttons as
small tablets — whose stone takes the world's colour (limestone and cinnabar in
Maya, sandstone and lapis in Egypt).

## Health on the Professor's back

The overhead camera looks at his back all run, so the satchel becomes a ring of
**six segments** — the same count the bar had. Gold while healthy, amber at
two, red and pulsing at one. The top bar goes away entirely.

A lost segment is an **event**, not a fade: it snaps off and tumbles away, the
camera punches, the screen edge flashes.

**The risk is size.** At gameplay scale the ring is ~34px across and the player
is looking at the road. Mitigations: the ring is oversized relative to the pack
(nearly a shield); it reads by colour and count, never fine gradation; and at
two segments the grit vignette turns red permanently, so the frame tells you
before the ring does. If a playtest still feels blind, the cheapest rescue is a
thin arc under the level meter, not the old bar.

### Hearts

- One heart restores one segment; caps at six.
- **They spawn in clear lanes only** — the exact inverse of coin runs, which
  thread the claimed lane.
- So the lanes now say two different things: gold is in the lane that hurts,
  life is in the lane that doesn't. Greed and survival pull opposite ways,
  spatially. That is the best thing this change buys.
- Dressed per world: a jade heart in Maya, a scarab amulet in Egypt.

## Boulder countdown

A boulder holds a lane for five seconds then rolls away, and the player has no
way to know that — so the safest play is always to leave, which quietly deletes
the ×3 danger economy. Put the number on the block and the decision becomes
real: two seconds left is worth riding out for triple coins; four is not.

- A small stone tally hovering over the block, always facing the camera.
- Whole seconds, 5 → 1. Amber at three, green at one.
- Shown **only while it holds a lane** — it appears as the block commits and
  goes out the moment it breaks away. The tally is a promise, so it must never
  lie.
- Billboarded canvas sprite redrawn only when the integer changes: three
  sprites, one draw each.

## Build sketch

| Piece | Cost |
| --- | --- |
| Three more BIOMES entries plus a world dimension on the lookup | palette + kit |
| Eight new prop builders: palm, sphinx, ram sphinx, obelisk, colossus, jackal, smooth pyramid, pylon | the largest piece |
| Skyline config per zone, replacing the hardcoded city lerp | ~20 lines |
| Typeface swap: font link and three CSS variables; the lintel topbar is more | small |
| Health ring, snap-off effect, heart pickup, clear-lane spawn rule | medium |
| Boulder tally sprites, driven off the age the boulder already tracks | small |

Physics keeps the same 100 HP underneath the ring — this is presentation, not a
new damage model.

## Open questions

1. **Alternate the worlds, or stack them?** Drawn as alternating every three
   levels. The other reading is that Egypt comes after Maya and stays, which
   makes reaching it an achievement instead of variety.
2. **Cinzel or Bevan** for the chrome.
3. **Does the health bar go entirely?** Drawn that way, per the brief. The
   fallback if it plays blind is noted above.
4. **Do hearts replace the relic heal?** Three relics currently give +12 HP. If
   hearts arrive, that rule probably retires — otherwise there are two healing
   systems and the relic quietly becomes the better one.
