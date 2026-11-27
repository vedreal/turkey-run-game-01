// Every screen of Tilly's Great Thanksgiving Escape: the title screen, the
// run itself with its HUD (score, distance, hearts, the farmer's gap and
// the stage banner), the pause overlay, and the caught and escaped endings.
// The engine owns the state; this file owns every pixel, including the
// clickable buttons it reports back through engine.uiButtons.

import { GROUND_Y, TURKEY_X, VIEW_W, VIEW_H, ESCAPE_METRE, RUN } from './config.js';
import { toScreenX } from './world.js';
import {
  drawTurkey,
  drawFarmer,
  drawFence,
  drawHaybale,
  drawBranch,
  drawKnife,
  drawOven,
  drawRollingPin,
  drawNet,
  drawCorn,
  drawPie,
  drawFeather,
  drawHaystackPickup,
  drawBackground,
  drawForestGate,
} from './art.js';

const CREAM = '#f7f1e3';
const NAVY = '#1e2a44';
const RED = '#b03a2e';
const GOLD = '#f2b705';

let lastStageId = '';
let bannerT = 0;

function button(engine, id, label, cx, y, w = 300, h = 64) {
  const x = cx - w / 2;
  engine.uiButtons.push({ id, x, y, w, h });
  const ctx = engine.ctx;
  const hover = engine.hoverButton === id;
  ctx.fillStyle = hover ? '#c0392b' : RED;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -4, -7, -12, 0, -5);
  ctx.bezierCurveTo(7, -12, 12, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? RED : 'rgba(255,255,255,0.35)';
  ctx.fill();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawHud(engine) {
  const ctx = engine.ctx;
  const w = engine.world;
  const metres = Math.floor(w.distance);

  // Top bar.
  ctx.fillStyle = 'rgba(30, 42, 68, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 74);

  // Score, left.
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${engine.score.toLocaleString('en-US')}`, 24, 46);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = GOLD;
  ctx.fillText(`BEST ${engine.best.toLocaleString('en-US')}`, 24, 68);

  // Distance and stage progress, centre.
  const progress = Math.min(1, metres / ESCAPE_METRE);
  const barX = 430;
  const barW = 420;
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${w.stage.name}  •  ${metres} m`, 640, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(ctx, barX, 42, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = GOLD;
  roundRect(ctx, barX, 42, barW * progress, 16, 8);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('FOREST GATE', barX + barW + 8, 56);

  // Hearts, right.
  for (let i = 0; i < RUN.maxHearts; i++) {
    drawHeart(ctx, 1080 + i * 34, 30, 26, i < engine.hearts);
  }
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('LIVES', 1052, 36);

  // The farmer gap: how close Gus is. The bar drains from green to red.
  const gapW = 220;
  const gapX = 24;
  const gapY = 92;
  ctx.fillStyle = 'rgba(30, 42, 68, 0.82)';
  roundRect(ctx, gapX - 10, gapY - 8, gapW + 250, 34, 10);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', gapX, gapY + 15);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRect(ctx, gapX + 78, gapY, gapW, 14, 7);
  ctx.fill();
  const gapFrac = engine.gap / 100;
  ctx.fillStyle = gapFrac > 0.5 ? '#7fae4c' : gapFrac > 0.25 ? GOLD : RED;
  roundRect(ctx, gapX + 78, gapY, gapW * gapFrac, 14, 7);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(engine.gap > 50 ? 'far behind' : engine.gap > 25 ? 'closing in!' : 'RIGHT BEHIND YOU!', gapX + 78 + gapW + 10, gapY + 14);

  // Controls hint, bottom right.
  ctx.fillStyle = 'rgba(30, 42, 68, 0.7)';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('SPACE jump (x2 flap)  •  DOWN slide  •  P pause  •  M mute', VIEW_W - 20, VIEW_H - 16);
  ctx.textAlign = 'left';
}

function drawWorldScene(engine) {
  const ctx = engine.ctx;
  const w = engine.world;
  const t = engine.turkey;
  const isKitchen = w.stage.id === 'kitchen';

  drawBackground(ctx, w.stage, w.scrollX, engine.time, isKitchen);

  // The forest gate waits at the end of the kitchen.
  const gateSx = toScreenX(w, w.gateX);
  if (gateSx > -220 && gateSx < VIEW_W + 220) {
    drawForestGate(ctx, gateSx, GROUND_Y, engine.time);
  }

  // Pickups.
  for (const p of w.pickups) {
    const sx = toScreenX(w, p.x);
    if (sx < -80 || sx > VIEW_W + 80) continue;
    if (p.kind === 'corn') drawCorn(ctx, sx, p.y, engine.time);
    else if (p.kind === 'pie') drawPie(ctx, sx, p.y, engine.time);
    else if (p.kind === 'feather') drawFeather(ctx, sx, p.y, engine.time);
    else if (p.kind === 'haystack') drawHaystackPickup(ctx, sx, p.y);
  }

  // Hazards, with a pulsing warning shadow under a knife about to fall.
  for (const ob of w.obstacles) {
    const sx = toScreenX(w, ob.x);
    if (sx < -180 || sx > VIEW_W + 180) continue;
    if (ob.kind === 'knife' && ob.state === 'warn') {
      const pulse = 0.4 + 0.3 * Math.sin(engine.time * 16);
      ctx.fillStyle = `rgba(176, 58, 46, ${pulse})`;
      ctx.beginPath();
      ctx.ellipse(sx, GROUND_Y + 4, 34, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', sx, GROUND_Y - 110);
      ctx.textAlign = 'left';
      drawKnife(ctx, sx, ob.y, 0);
      continue;
    }
    if (ob.kind === 'fence') drawFence(ctx, sx, ob.y);
    else if (ob.kind === 'haybale') drawHaybale(ctx, sx, ob.y);
    else if (ob.kind === 'branch') drawBranch(ctx, sx, ob.y);
    else if (ob.kind === 'knife') drawKnife(ctx, sx, ob.y, ob.angle);
    else if (ob.kind === 'oven') drawOven(ctx, sx, ob.y, engine.time);
    else if (ob.kind === 'rollingpin') drawRollingPin(ctx, sx, ob.y, ob.angle);
  }

  // Nets the farmer threw.
  for (const net of w.nets) {
    drawNet(ctx, toScreenX(w, net.x), net.y);
  }

  // Farmer Gus, chasing from behind. He only shows once he is on screen.
  const fx = engine.farmerX();
  if (fx > -140) {
    drawFarmer(ctx, fx, GROUND_Y, engine.time, 1 - engine.gap / 100);
  }

  // Tilly herself, with a red flash frame right after a hit.
  drawTurkey(ctx, TURKEY_X, t.y, t.phase, {
    sliding: t.sliding,
    flapping: t.jumps === 2 && t.y < GROUND_Y,
    hidden: t.hiddenT > 0,
    hurt: t.hurtT > 0,
  });
  if (engine.flashT > 0) {
    ctx.fillStyle = `rgba(176, 58, 46, ${engine.flashT * 0.9})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // A "HIDDEN!" whisper while the haystack cloak lasts.
  if (t.hiddenT > 0) {
    ctx.fillStyle = NAVY;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN IN THE HAY!', TURKEY_X, t.y - 150);
    ctx.textAlign = 'left';
  }
}

function drawStageBanner(engine) {
  const w = engine.world;
  if (w.stage.id !== lastStageId) {
    lastStageId = w.stage.id;
    bannerT = 2.2;
  }
  if (bannerT > 0) {
    bannerT -= 1 / 60;
    const ctx = engine.ctx;
    const alpha = Math.min(1, bannerT);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30, 42, 68, 0.85)';
    roundRect(ctx, VIEW_W / 2 - 260, 130, 520, 64, 12);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(w.stage.name, VIEW_W / 2, 172);
    ctx.restore();
    ctx.textAlign = 'left';
  }
}

function drawTitle(engine) {
  const ctx = engine.ctx;
  // A calm dawn farmyard behind the title, with Tilly mid-stride at the
  // right edge and Gus closing in at the left.
  drawBackground(ctx, engine.world.stage, 0, engine.time, false);
  drawTurkey(ctx, 1180, GROUND_Y, engine.time, {});
  drawFarmer(ctx, 90, GROUND_Y, engine.time, 0.4);

  ctx.fillStyle = 'rgba(30, 42, 68, 0.38)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('A THANKSGIVING ESCAPE', VIEW_W / 2, 120);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText("TILLY'S GREAT", VIEW_W / 2, 210);
  ctx.fillText('ESCAPE', VIEW_W / 2, 300);
  ctx.fillStyle = '#ffd9a0';
  ctx.font = '24px Georgia, serif';
  ctx.fillText('Thanksgiving is tomorrow, and Tilly the turkey is NOT the main course.', VIEW_W / 2, 350);
  ctx.fillText('Outrun Farmer Gus, dodge the oven and the carving knives,', VIEW_W / 2, 384);
  ctx.fillText('and reach the forest gate 1800 m away.', VIEW_W / 2, 418);

  const blink = 0.55 + 0.45 * Math.sin(engine.time * 4);
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN', VIEW_W / 2, 480);
  ctx.restore();

  ctx.fillStyle = '#ffd9a0';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('SPACE / ↑ jump (twice to flap)    •    ↓ slide under branches & nets', VIEW_W / 2, 540);
  ctx.fillText('Grab corn & pie for points — a golden feather mends a heart, a haystack hides you', VIEW_W / 2, 572);
  if (engine.best > 0) {
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`BEST SCORE: ${engine.best.toLocaleString('en-US')}`, VIEW_W / 2, 616);
  }
  ctx.textAlign = 'left';

  button(engine, 'start', 'START THE ESCAPE', VIEW_W / 2, 636, 320, 58);
}

function drawPause(engine) {
  const ctx = engine.ctx;
  ctx.fillStyle = 'rgba(30, 42, 68, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 260);
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Tilly is catching her breath. The farmer is not far behind.', VIEW_W / 2, 310);
  ctx.textAlign = 'left';
  button(engine, 'resume', 'RESUME', VIEW_W / 2, 380, 260, 60);
  button(engine, 'restart', 'RESTART RUN', VIEW_W / 2, 460, 260, 60);
  button(engine, 'title', 'BACK TO TITLE', VIEW_W / 2, 540, 260, 60);
}

function drawEnd(engine, escaped) {
  const ctx = engine.ctx;
  const w = engine.world;
  ctx.fillStyle = escaped ? 'rgba(46, 93, 51, 0.78)' : 'rgba(124, 36, 26, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.textAlign = 'center';
  if (escaped) {
    drawForestGate(ctx, VIEW_W / 2 + 110, 300, engine.time);
    drawTurkey(ctx, VIEW_W / 2 - 130, 300, engine.time, {});
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText('ESCAPED!', VIEW_W / 2, 420);
    ctx.fillStyle = CREAM;
    ctx.font = '24px Georgia, serif';
    ctx.fillText('Tilly burst through the forest gate — free, feathered and fabulous.', VIEW_W / 2, 462);
    ctx.fillText('Happy Thanksgiving, free bird. The farmer can eat tofu.', VIEW_W / 2, 494);
  } else {
    // Farmer Gus, triumphant, holding a very dizzy Tilly upside down.
    drawFarmer(ctx, VIEW_W / 2 - 40, 330, engine.time, 1);
    ctx.save();
    ctx.translate(VIEW_W / 2 + 90, 250);
    ctx.rotate(2.8);
    drawTurkey(ctx, 0, 0, 0, { hurt: true });
    ctx.restore();
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 430);
    ctx.font = '24px Georgia, serif';
    ctx.fillText(engine.endReason || 'The farmer got you.', VIEW_W / 2, 472);
    ctx.fillText('Thanksgiving dinner is served... almost. Run again, Tilly!', VIEW_W / 2, 504);
  }

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`SCORE ${engine.score.toLocaleString('en-US')}   •   ${Math.floor(w.distance)} m`, VIEW_W / 2, 556);
  ctx.fillStyle = CREAM;
  ctx.font = '22px Georgia, serif';
  const isBest = engine.score > 0 && engine.score >= engine.best;
  ctx.fillText(
    isBest ? `NEW BEST SCORE!` : `BEST ${engine.best.toLocaleString('en-US')}`,
    VIEW_W / 2,
    592,
  );
  ctx.textAlign = 'left';
  button(engine, 'restart', 'RUN AGAIN', VIEW_W / 2, 622, 300, 58);
}

// The one entry point the engine calls every animation frame.
export function drawFrame(engine) {
  const ctx = engine.ctx;
  engine.uiButtons = [];
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (engine.state === 'title') {
    drawTitle(engine);
    return;
  }

  drawWorldScene(engine);

  if (engine.state === 'playing') {
    drawHud(engine);
    drawStageBanner(engine);
  } else if (engine.state === 'paused') {
    drawHud(engine);
    drawPause(engine);
  } else if (engine.state === 'caught') {
    drawEnd(engine, false);
  } else if (engine.state === 'escaped') {
    drawEnd(engine, true);
  }
}
