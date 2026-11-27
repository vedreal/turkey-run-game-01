# Tilly's Great Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/vedreal/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/vedreal/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

Thanksgiving is tomorrow, and Tilly the turkey is **not** the main course. A complete, original turkey escape game that plays offline in a desktop browser from its own static files — no build step, no network, no copied assets. Every picture and sound is drawn and synthesised in code.

## Play it

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server, e.g. `node serve.ts`). No installation, no internet.

## How to play

- **SPACE / ↑ / W** — jump. Press again mid-air for a wing flap (double jump).
- **↓ / S** — slide under low branches and the farmer's nets.
- **Click / tap** — also jumps.
- **P** — pause. **M** — mute.

Outrun Farmer Gus across three stages — **the farmyard**, **the cornfield**, and **the farmhouse kitchen** — and reach the forest gate 1800 m away. Dodge fences, hay bales, low branches, falling carving knives, oven vents and rolling pins. Grab corn and pie for points, a golden feather to mend a heart, and duck into a haystack to shake the farmer off your tail.

## The chase

Tilly has 3 hearts and a **farmer gap** meter. Every stumble costs a heart and lets Gus close in; running clean lets her pull away again. If the gap hits zero — or the hearts run out — it's dinner time. The farmer hurls nets when he gets close. Escape through the forest gate for a 500-point freedom bonus.

## What's inside

| File | Job |
| --- | --- |
| `main.ts` | Entry program (Node 22): copies `game/` + `screenshots/` to `/output` and writes `dossier.json` |
| `vendor/makefun-game.ts` | The kit's dossier library, unchanged |
| `game/index.html` | The playable game page |
| `game/src/main.js` | Boot: wires canvas, engine, screens and input |
| `game/src/engine.js` | Game loop, physics, collisions, farmer AI, score, states |
| `game/src/world.js` | Scrolling farm, hazard/pickup spawning, stage progression |
| `game/src/art.js` | All art, drawn in code: turkey, farmer, oven, knives, farm & kitchen |
| `game/src/screens.js` | Title, HUD, pause, caught and escaped screens |
| `game/src/audio.js` | All sound, synthesised with Web Audio (gobbles, fanfare, banjo loop) |
| `game/src/config.js` | Tuning, stages, hazards |
| `game/src/random.js` | Seeded RNG for deterministic screenshot runs |
| `game/src/input.js` | Keyboard, mouse and touch controls |
| `game/src/shots.js` | `?shot=` poses for the screenshots |
| `screenshots/` | Real renders of the game's own code: title, farmyard run, kitchen run, caught |

## Screenshots

The four screenshots are real renders of this game's code, taken in headless Chrome with `?shot=start|play|kitchen|caught&seed=7` — title screen, a mid-run farmyard frame with HUD, a kitchen frame with oven and falling knife, and the caught end screen.

## Bounty

Built for the [turkey-run-game-01 bounty on make.fun](https://make.fun/bounty/turkey-run-game-01) — make the best turkey escape game. MIT licensed.

---

Built with [make.fun](https://make.fun) — referral code `f2pdfak6`.
