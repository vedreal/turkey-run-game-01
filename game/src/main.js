// Boot for Tilly's Great Thanksgiving Escape.
// Wires the canvas to the engine, the screens to the engine's draw hook,
// the keyboard and mouse to the engine's actions — then either poses one
// frozen frame for a screenshot (?shot=...) or starts the live game loop.

import { VIEW_W, VIEW_H } from './config.js';
import { Engine } from './engine.js';
import { drawFrame } from './screens.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const engine = new Engine(canvas);
engine.drawFrame = (eng) => drawFrame(eng);
engine.uiButtons = [];
engine.hoverButton = null;
// A debug handle for play-testing in the browser console; harmless in play.
window.__tilly = engine;

// A screenshot run renders exactly one frozen frame of the game's own
// code and stops — no loop, no input, no sound.
if (applyShot(engine)) {
  drawFrame(engine);
} else {
  attachInput(engine, canvas);
  engine.startLoop();
}
