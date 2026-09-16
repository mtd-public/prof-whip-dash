# Professor WhipDash

A three-lane endless runner for portrait phones and tablets. A fedora'd
academic outruns a rockslide down a **sacbé** — the white limestone causeway
of a Mayan city. The boulders chase him from **behind** and *grind* rather
than splat: share a lane with one and you bleed until you reach a clear lane.
Which is a problem, because that is exactly where the gold is — 70% of coin
runs are threaded through the lane a boulder owns, and every coin collected
while you're being ground pays triple.

Spiders and jade scarabs block the way **ahead**. The answer to those is a
whip crack, timed to the metre.

**[DESIGN.md](DESIGN.md)** has the loop, the tuning table, the art direction
and the open questions.

## Play

```
npm install
npm run dev
```

Swipe ← / → to switch lane, tap to crack the whip. On desktop: arrow keys,
space, `P` to pause.

## Build

```
npm run build          # → dist/, what GitHub Pages serves
npm run build:artifact # → artifact/, each page inlined into one file
```

`base` in `vite.config.ts` is `./`, so the build works at any path — a
project Pages site, a subdirectory, or opened straight off disk.

## Layout

| Path | What it is |
| --- | --- |
| `src/game/kit.ts` | The art kit. Every model — runner, three boulders, spider, scarab, coin, idol, stela, serpent balustrade, brazier, pyramid, 12m track module — assembled from three.js primitives at runtime. No meshes, no textures, no downloads. |
| `src/game/physics.ts` | The whole simulation in plain logical coordinates. No three.js, no DOM: lanes, boulder rows, grind damage, whip windows, coin spawning. |
| `src/game/scene3d.ts` | The renderer. Owns no game state; every frame it reads a `World` and moves pooled meshes to match. |
| `src/game/useGameEngine.ts` | The simulation clock and the React-facing state. The sim runs at 60fps; the HUD re-renders 12 times a second. |
| `src/game/palette.ts` | The Mayan palette — weathered limestone, painted stucco, jade, cinnabar, gold. |
| `src/components/` | The shell: board, HUD, overlay, stats card, keyboard help. |
| `src/board/` | `board.html` — the live art and systems bible. Its hero panel runs the real engine; the rest are spinnable turntables sharing one WebGL context. |
| `tools/inline.mjs` | Builds each page into one self-contained HTML file for hosted previews. |

## Lineage

The UI shell is [generic-game-template](https://github.com/mtd-public/generic-game-template)
— topbar, footer controls, stats sidebar, start/pause/game-over overlay,
keyboard help — and the portrait/landscape board layout follows
[splashy-fish](https://github.com/mtd-public/splashy-fish): the board takes
every pixel below the topbar in portrait, and the identical board is
pillarboxed at a fixed aspect with the stats card beside it in landscape and
on desktop, with `env()` safe-area insets and `touch-action: none` on the play
surface.

What's new here is the art direction — one dark world for the chrome and the
board, Anton / Public Sans / IBM Plex Mono, flat-shaded low-poly geometry
under an ACES tone map with a gradient sky and a single shadow-casting key
light placed *behind* the runner, so the boulders throw their shadows forward
up the lane you are about to run through.
