# Professor WhipDash

A three-lane endless runner for portrait phones and tablets: a fedora'd
academic outruns a rockslide down a collapsing temple causeway. The boulders
chase him from **behind** and grind rather than splat — share a lane with one
and you bleed until you reach a clear lane. Spiders and scarabs block the way
**ahead**, and a whip crack is the only answer.

Concepts and numbers: **[DESIGN.md](DESIGN.md)**

## What's here

| File | What it is |
| --- | --- |
| `web/whipdash-kit.js` | The art kit. Every model — Professor, three boulders, spider, scarab, relic, 12m track module — built from three.js primitives at runtime. No meshes, no textures, no downloads. |
| `web/index.html` | Live concept board. One WebGL context renders every panel on the page: turntables for each actor, the track module, the in-game camera in a phone frame, palette and spec. |
| `web/play.html` | Playable vertical slice. Portrait-first, swipe to change lane, tap to crack the whip, boulder rows claiming lanes behind you. |

Serve the folder and open either page — no build step:

```
python3 -m http.server 8000 --directory web
```

## Portrait shell

The layout conventions come from
[splashy-fish](https://github.com/mtd-public/splashy-fish): a fixed topbar,
a board that takes every remaining pixel in portrait, and the same board
pillarboxed at a fixed aspect with a side card in landscape and on desktop,
with `env()` safe-area insets on the HUD and `touch-action: none` on the play
surface. The art direction is new: a single dark world for the chrome and the
board, Anton / Public Sans / IBM Plex Mono, and flat-shaded low-poly geometry
under an ACES tone map.

## Next step

Port `web/` into the same Vite + React + TypeScript structure splashy-fish
uses — `src/game/physics.ts` for the pure lane/damage/whip simulation,
`src/game/scene3d.ts` for the renderer, `src/game/useGameEngine.ts` for the
loop, `src/game/palette.ts` for the biome ramp, components for the shell —
plus the GitHub Pages deploy workflow. The kit and the tuning table in
`web/play.html` are written to move across unchanged.
