// The engine of Tilly's Great Thanksgiving Escape: the game loop, Tilly's
// jumps and slides, the farmer's chase, collisions, hearts, score and the
// state machine (title -> playing -> paused / caught / escaped). It owns no
// pixels — screens.js draws everything from the state kept here.

import {
  GROUND_Y,
  TURKEY_X,
  PHYSICS,
  RUN,
  PICKUP_SCORE,
  ESCAPE_METRE,
  HAZARDS,
  VIEW_W,
} from './config.js';
import {
  createWorld,
  resetWorld,
  updateWorld,
  throwNet,
  toScreenX,
} from './world.js';
import { SoundBank } from './audio.js';

const BEST_KEY = 'tilly-escape-best-score';

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // A browser that refuses storage still plays fine.
  }
}

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundBank();
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.world = createWorld((Date.now() % 100000) | 0);
    this.turkey = this.freshTurkey();
    this.hearts = RUN.startHearts;
    this.gap = RUN.farmerGapStart; // 0..100, the farmer's distance behind
    this.score = 0;
    this.bonus = 0;
    this.best = loadBest();
    this.time = 0;
    this.flashT = 0; // red flash timer after a hit
    this.netCooldown = 0;
    this.endReason = '';
    this.onStateChange = null; // screens.js hooks the pause button through this
    this.running = false;
    this.lastTs = 0;
  }

  freshTurkey() {
    return {
      y: GROUND_Y, // feet position; GROUND_Y means standing on the ground
      vy: 0,
      jumps: 0, // 0 on the ground, 1 after one jump, 2 after the flap
      sliding: false,
      slideT: 0,
      hurtT: 0, // invulnerable window right after a hit
      hiddenT: 0, // haystack cloak timer
      phase: 0, // run-cycle phase for the legs
    };
  }

  // ---- flow ----------------------------------------------------------------

  startRun() {
    resetWorld(this.world, (Date.now() % 100000) | 0);
    this.turkey = this.freshTurkey();
    this.hearts = RUN.startHearts;
    this.gap = RUN.farmerGapStart;
    this.score = 0;
    this.bonus = 0;
    this.flashT = 0;
    this.netCooldown = 4;
    this.endReason = '';
    this.state = 'playing';
    this.sound.unlock();
    this.sound.startMusic();
    this.emitState();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.sound.stopMusic();
    this.emitState();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.sound.startMusic();
    this.emitState();
  }

  toTitle() {
    this.state = 'title';
    this.sound.stopMusic();
    this.emitState();
  }

  emitState() {
    if (this.onStateChange) this.onStateChange(this.state);
  }

  // ---- input actions ---------------------------------------------------------

  jump() {
    if (this.state === 'title') {
      this.startRun();
      return;
    }
    if (this.state === 'caught' || this.state === 'escaped') {
      this.startRun();
      return;
    }
    if (this.state !== 'playing') return;
    const t = this.turkey;
    if (t.sliding) return;
    if (t.jumps === 0) {
      t.vy = PHYSICS.jumpVelocity;
      t.jumps = 1;
      this.sound.gobble();
    } else if (t.jumps === 1) {
      t.vy = PHYSICS.flapVelocity;
      t.jumps = 2;
      this.sound.flap();
    }
  }

  slide() {
    if (this.state !== 'playing') return;
    const t = this.turkey;
    if (t.y < GROUND_Y) return; // only slide on the ground
    t.sliding = true;
    t.slideT = PHYSICS.slideTime;
  }

  // ---- the loop --------------------------------------------------------------

  startLoop() {
    if (this.running) return;
    this.running = true;
    const step = (ts) => {
      if (!this.running) return;
      const dt = Math.min(0.033, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
      this.lastTs = ts;
      this.update(dt);
      this.render();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  stopLoop() {
    this.running = false;
  }

  update(dt) {
    this.time += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.state !== 'playing') return;

    const t = this.turkey;
    const w = this.world;

    // Tilly's vertical motion.
    t.vy = Math.min(PHYSICS.maxFall, t.vy + PHYSICS.gravity * dt);
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.jumps = 0;
    }
    t.phase += dt * (0.9 + w.speed / 500);
    if (t.slideT > 0) {
      t.slideT -= dt;
      if (t.slideT <= 0) t.sliding = false;
    }
    if (t.hurtT > 0) t.hurtT -= dt;
    if (t.hiddenT > 0) t.hiddenT -= dt;

    updateWorld(w, dt, t);

    // The farmer closes in on every stumble and drifts back while Tilly
    // runs clean; a haystack cloak pushes him back a long way.
    if (t.hurtT <= 0) {
      this.gap = Math.min(100, this.gap + RUN.farmerGapRegen * dt);
    }

    // The farmer hurls a net when he gets close enough to smell dinner.
    this.netCooldown -= dt;
    if (this.gap < 40 && this.netCooldown <= 0) {
      throwNet(w, this.farmerX() + 60);
      this.netCooldown = 5;
      this.sound.farmerYell();
    }

    this.checkPickups();
    this.checkHits();

    this.score = Math.floor(w.distance) * RUN.scorePerMetre + this.bonus;

    if (w.gateReached) {
      this.finishEscape();
    }
    if (this.gap <= 0) {
      this.finishCaught('The farmer closed the gap and grabbed Tilly by the tail feathers.');
    }
  }

  // How far behind Tilly the farmer runs, in screen pixels.
  farmerX() {
    return TURKEY_X - 60 - this.gap * 2.2;
  }

  // ---- collisions --------------------------------------------------------------

  turkeyBox() {
    const t = this.turkey;
    const h = t.sliding ? 46 : 82;
    return { x: TURKEY_X - 26, y: t.y - h, w: 56, h };
  }

  static boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  checkPickups() {
    const t = this.turkey;
    const box = this.turkeyBox();
    for (const p of this.world.pickups) {
      if (p.taken) continue;
      const sx = toScreenX(this.world, p.x);
      const pb = { x: sx - 22, y: p.y - 60, w: 44, h: 60 };
      if (Engine.boxesOverlap(box, pb)) {
        p.taken = true;
        this.applyPickup(p.kind);
      }
    }
  }

  applyPickup(kind) {
    if (kind === 'corn') {
      this.bonus += PICKUP_SCORE.corn;
      this.sound.pickup();
    } else if (kind === 'pie') {
      this.bonus += PICKUP_SCORE.pie;
      this.sound.pickup();
    } else if (kind === 'feather') {
      this.hearts = Math.min(RUN.maxHearts, this.hearts + 1);
      this.sound.goldenFeather();
    } else if (kind === 'haystack') {
      this.turkey.hiddenT = 3;
      this.gap = Math.min(100, this.gap + RUN.farmerGapHaystack);
      this.sound.pickup();
    }
  }

  checkHits() {
    const t = this.turkey;
    if (t.hurtT > 0) return; // briefly invulnerable after a hit
    const box = this.turkeyBox();

    for (const ob of this.world.obstacles) {
      if (ob.state === 'warn') continue; // a warned knife has not fallen yet
      const sx = toScreenX(this.world, ob.x);
      if (sx < -160 || sx > VIEW_W + 160) continue;
      const h = HAZARDS[ob.kind];
      // The oven's flame reaches above its box; jumping must clear the flame.
      const extraTop = ob.kind === 'oven' ? 30 : 0;
      const obBox = { x: sx - h.w / 2 + 6, y: ob.y - h.h - extraTop + 8, w: h.w - 12, h: h.h + extraTop - 8 };
      // A stuck knife is a thin spike; a falling one is a spinning blade.
      if (ob.kind === 'knife' && ob.state === 'stuck') {
        obBox.x = sx - 8;
        obBox.w = 16;
        obBox.y = GROUND_Y - 96;
        obBox.h = 96;
      }
      if (Engine.boxesOverlap(box, obBox)) {
        this.takeHit(ob.kind);
        return;
      }
    }

    for (const net of this.world.nets) {
      const sx = toScreenX(this.world, net.x);
      const netBox = { x: sx - 46, y: net.y - 64, w: 92, h: 64 };
      if (Engine.boxesOverlap(box, netBox)) {
        this.takeHit('net');
        this.world.nets = this.world.nets.filter((n) => n !== net);
        return;
      }
    }
  }

  takeHit(kind) {
    const t = this.turkey;
    this.hearts -= 1;
    this.gap = Math.max(0, this.gap - RUN.farmerGapStumble);
    t.hurtT = 1.1;
    t.hiddenT = 0;
    this.flashT = 0.35;
    this.sound.thud();
    if (kind === 'knife') this.sound.knifeWhistle();
    if (this.hearts <= 0) {
      this.finishCaught('Tilly took one tumble too many — three strikes and dinner is served.');
    }
  }

  // ---- endings -----------------------------------------------------------------

  finishCaught(reason) {
    if (this.state !== 'playing') return;
    this.state = 'caught';
    this.endReason = reason;
    this.sound.stopMusic();
    this.sound.caughtSting();
    this.recordBest();
    this.emitState();
  }

  finishEscape() {
    if (this.state !== 'playing') return;
    this.state = 'escaped';
    this.bonus += 500; // the forest gate pays a freedom bonus
    this.score = Math.floor(this.world.distance) * RUN.scorePerMetre + this.bonus;
    this.sound.stopMusic();
    this.sound.fanfare();
    this.recordBest();
    this.emitState();
  }

  recordBest() {
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.score);
    }
  }

  // ---- drawing -------------------------------------------------------------------

  render() {
    // screens.js owns every pixel; the engine only hands it the state.
    if (this.drawFrame) this.drawFrame(this);
  }
}
