// Deterministic screenshot states for Tilly's Great Thanksgiving Escape.
// The game reads ?shot=start|play|kitchen|caught|escaped&seed=N from the
// URL and poses itself: title screen, a mid-run farmyard frame with the
// HUD, a kitchen frame full of oven and knives, and the two end screens.
// Every pixel is still rendered by the game's own drawing code — these
// states only fast-forward the simulation and freeze it for the camera.

import { GROUND_Y, RUN, ESCAPE_METRE } from './config.js';
import { resetWorld, updateWorld, toScreenX } from './world.js';

function seedFrom(params) {
  const s = Number(params.get('seed'));
  return Number.isFinite(s) && s > 0 ? Math.floor(s) : 1;
}

// Step the world forward without collisions, so the frame is a lively
// mid-run moment instead of an empty start line.
function fastForward(engine, seconds) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    updateWorld(engine.world, 1 / 60, engine.turkey);
    engine.turkey.phase += 1 / 60;
    engine.time += 1 / 60;
  }
}

function poseMidJump(engine) {
  const t = engine.turkey;
  t.y = GROUND_Y - 130;
  t.vy = -260;
  t.jumps = 1;
  t.phase = 3.1;
}

export function applyShot(engine) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = seedFrom(params);

  if (shot === 'start') {
    resetWorld(engine.world, seed);
    engine.state = 'title';
    engine.time = 2.0;
    return true;
  }

  if (shot === 'play') {
    resetWorld(engine.world, seed);
    engine.state = 'playing';
    fastForward(engine, 3.5);
    poseMidJump(engine);
    engine.hearts = 3;
    engine.gap = 58;
    engine.score = Math.floor(engine.world.distance) * RUN.scorePerMetre + 75;
    return true;
  }

  if (shot === 'kitchen') {
    resetWorld(engine.world, seed);
    engine.state = 'playing';
    // Run until the kitchen stage, then pose Tilly over an oven vent with
    // a carving knife whistling down beside her.
    fastForward(engine, 21);
    const w = engine.world;
    let oven = w.obstacles.find(
      (o) => o.kind === 'oven' && toScreenX(w, o.x) > 340 && toScreenX(w, o.x) < 820,
    );
    if (!oven) {
      oven = { kind: 'oven', x: w.scrollX + 640, y: GROUND_Y, vy: 0, state: 'live', warnT: 0, angle: 0, w: 110, h: 84 };
      w.obstacles.push(oven);
    }
    w.obstacles.push({
      kind: 'knife', x: w.scrollX + 480, y: GROUND_Y - 210, vy: 900,
      state: 'fall', warnT: 0, angle: 0.5, w: 34, h: 96,
    });
    poseMidJump(engine);
    engine.hearts = 2;
    engine.gap = 30;
    engine.score = Math.floor(w.distance) * RUN.scorePerMetre + 640;
    return true;
  }

  if (shot === 'caught') {
    resetWorld(engine.world, seed);
    engine.state = 'playing';
    fastForward(engine, 8);
    engine.state = 'caught';
    engine.hearts = 0;
    engine.gap = 0;
    engine.endReason = 'The farmer closed the gap and grabbed Tilly by the tail feathers.';
    engine.score = Math.floor(engine.world.distance) * RUN.scorePerMetre + 320;
    engine.recordBest();
    return true;
  }

  if (shot === 'escaped') {
    resetWorld(engine.world, seed);
    engine.state = 'playing';
    fastForward(engine, 26);
    engine.world.scrollX = engine.world.gateX - 640;
    engine.world.distance = engine.world.scrollX / RUN.pxPerMetre;
    engine.state = 'escaped';
    engine.bonus += 500;
    engine.score = Math.floor(engine.world.distance) * RUN.scorePerMetre + engine.bonus;
    engine.recordBest();
    return true;
  }

  return false;
}
