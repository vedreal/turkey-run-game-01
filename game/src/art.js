// Every picture in Tilly's Great Thanksgiving Escape is drawn in code on
// the canvas — no image files ship with the game. The turkey, the farmer,
// the oven, the knives and the farm itself are all paths, arcs and
// polygons in a warm autumn palette, so the game reads at a glance even
// when a screenshot is shrunk to a contact sheet.

import { GROUND_Y, VIEW_W, VIEW_H } from './config.js';

const BROWN = '#7a4a21';
const BROWN_DARK = '#5d3413';
const BROWN_LIGHT = '#a9713a';
const CREAM = '#f7f1e3';
const NAVY = '#1e2a44';
const RED = '#b03a2e';
const ORANGE = '#e07b39';
const GOLD = '#f2b705';

// ---- helpers ---------------------------------------------------------------

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

// ---- the turkey ------------------------------------------------------------
// Drawn standing on (x, y) — y is where her feet touch the ground.
// phase drives the running legs; sliding squashes her low; flap stretches
// her wings wide for the double jump.

export function drawTurkey(ctx, x, y, phase, opts = {}) {
  const sliding = !!opts.sliding;
  const flapping = !!opts.flapping;
  const hidden = !!opts.hidden;
  const hurt = !!opts.hurt;
  ctx.save();
  ctx.translate(x, y);
  if (sliding) ctx.scale(1.25, 0.62);
  if (hurt) ctx.globalAlpha = 0.55 + 0.35 * Math.sin(phase * 30);
  if (hidden) ctx.globalAlpha = 0.45;

  const legSwing = Math.sin(phase * 14) * 10;
  const bob = Math.abs(Math.sin(phase * 14)) * 3;

  // Fanned tail feathers behind the body.
  for (let i = -2; i <= 2; i++) {
    const ang = (-90 + i * 22) * (Math.PI / 180);
    const tx = Math.cos(ang) * 34 - 26;
    const ty = Math.sin(ang) * 34 - 18 - bob;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ang + Math.PI / 2);
    ellipse(ctx, 0, 0, 9, 22, i % 2 === 0 ? BROWN : BROWN_LIGHT);
    ellipse(ctx, 0, -12, 5, 9, i % 2 === 0 ? GOLD : ORANGE);
    ctx.restore();
  }

  // Legs (two orange sticks, running).
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -14 - bob);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -14 - bob);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Body: a plump brown oval.
  ellipse(ctx, 0, -34 - bob, 30, 26, BROWN);
  ellipse(ctx, -6, -28 - bob, 20, 16, BROWN_LIGHT);

  // Wing — lifts high while flapping.
  ctx.save();
  ctx.translate(-4, -36 - bob);
  ctx.rotate(flapping ? -1.1 : -0.25 + Math.sin(phase * 14) * 0.08);
  ellipse(ctx, -12, 0, 20, 10, BROWN_DARK);
  ctx.restore();

  // Head, beak and wattle.
  circle(ctx, 22, -62 - bob, 13, BROWN);
  poly(ctx, [[33, -66 - bob], [48, -61 - bob], [33, -57 - bob]], '#e8a13a');
  ellipse(ctx, 30, -54 - bob, 4, 8, RED); // the wattle
  circle(ctx, 26, -66 - bob, 2.5, NAVY); // bright, worried eye
  // A little red head-feather tuft.
  poly(ctx, [[18, -74 - bob], [22, -84 - bob], [26, -74 - bob]], RED);

  ctx.restore();
}

// ---- the farmer ------------------------------------------------------------
// Farmer Gus, in overalls and a straw hat, pitchfork in hand, forever a few
// steps behind Tilly. gap01 (0..1) sets how close he looms: 1 means he has
// her by the tail feathers.

export function drawFarmer(ctx, x, y, phase, gap01) {
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(phase * 12) * 12;
  const bob = Math.abs(Math.sin(phase * 12)) * 3;
  const lean = 0.12 + gap01 * 0.25; // he leans in harder the closer he gets

  // Legs in blue overalls.
  ctx.strokeStyle = '#2e4a6b';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -58 - bob);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -58 - bob);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Torso: red shirt under denim overalls.
  ctx.save();
  ctx.rotate(lean);
  poly(ctx, [[-18, -58 - bob], [18, -58 - bob], [14, -96 - bob], [-14, -96 - bob]], '#a83226');
  poly(ctx, [[-14, -58 - bob], [14, -58 - bob], [12, -80 - bob], [-12, -80 - bob]], '#2e4a6b');
  // Arm reaching forward with the pitchfork.
  ctx.strokeStyle = '#e8b48a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(8, -88 - bob);
  ctx.lineTo(34, -72 - bob);
  ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a8f98';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(34, -72 - bob);
  ctx.lineTo(52, -104 - bob);
  ctx.moveTo(46, -76 - bob);
  ctx.lineTo(62, -106 - bob);
  ctx.moveTo(40, -74 - bob);
  ctx.lineTo(57, -105 - bob);
  ctx.stroke();
  // Head with straw hat and angry moustache.
  circle(ctx, 0, -108 - bob, 14, '#e8b48a');
  ellipse(ctx, 0, -118 - bob, 24, 7, '#e8c95a'); // hat brim
  ellipse(ctx, 0, -122 - bob, 12, 8, '#d9b23c'); // hat dome
  poly(ctx, [[-8, -104 - bob], [8, -104 - bob], [0, -97 - bob]], '#6b4a2f'); // moustache
  circle(ctx, -5, -110 - bob, 2, NAVY);
  circle(ctx, 6, -110 - bob, 2, NAVY);
  ctx.restore();
  ctx.restore();
}

// ---- hazards ---------------------------------------------------------------

export function drawFence(ctx, x, y) {
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(x - 23, y - 92, 10, 92);
  ctx.fillRect(x + 13, y - 92, 10, 92);
  ctx.fillStyle = '#a9713a';
  ctx.fillRect(x - 26, y - 78, 52, 10);
  ctx.fillRect(x - 26, y - 48, 52, 10);
}

export function drawHaybale(ctx, x, y) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(x, y - 34, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b57f1f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 34, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 34, 16, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawBranch(ctx, x, y) {
  // A low branch Tilly must slide under, with autumn leaves.
  ctx.fillStyle = '#5d3413';
  ctx.fillRect(x - 45, y - 128, 90, 14);
  for (let i = 0; i < 5; i++) {
    const lx = x - 38 + i * 18;
    ellipse(ctx, lx, y - 134, 9, 6, i % 2 ? '#c96a1e' : '#d9a441');
  }
  ctx.fillStyle = '#5d3413';
  ctx.fillRect(x - 45, y - 128, 8, 128);
  ctx.fillRect(x + 37, y - 128, 8, 128);
}

export function drawKnife(ctx, x, y, angle) {
  // A carving knife, falling point-first, glinting as it spins.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#c8ccd4';
  poly(ctx, [[-7, -48], [7, -48], [4, 10], [-4, 10]], '#c8ccd4');
  poly(ctx, [[-4, 10], [4, 10], [0, 34]], '#dfe3ea');
  ctx.fillStyle = '#5d3413';
  ctx.fillRect(-5, -62, 10, 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -44);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawOven(ctx, x, y, flamePhase) {
  // The farmhouse oven: a black iron box with a glowing door and a vent of
  // flame Tilly must jump. The flame flickers with flamePhase.
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 55, y - 84, 110, 84);
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(x - 45, y - 74, 90, 56);
  const flick = 0.6 + 0.4 * Math.sin(flamePhase * 9);
  ctx.fillStyle = `rgba(255, ${Math.floor(120 + 60 * flick)}, 30, ${0.75 + 0.25 * flick})`;
  ctx.fillRect(x - 38, y - 66, 76, 40);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x - 38, y - 66, 76, 8);
  // Chimney with a puff of smoke.
  ctx.fillStyle = '#555555';
  ctx.fillRect(x + 28, y - 118, 20, 36);
  circle(ctx, x + 38, y - 128 - (flamePhase % 1) * 10, 8 + (flamePhase % 1) * 6, 'rgba(220,220,220,0.5)');
  // The vent flame on top.
  poly(
    ctx,
    [
      [x - 18, y - 84],
      [x - 6, y - 84 - 26 * flick],
      [x + 4, y - 84],
      [x + 14, y - 84 - 18 * flick],
      [x + 22, y - 84],
    ],
    `rgba(255, 140, 30, ${0.85})`,
  );
}

export function drawRollingPin(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y - 20);
  ctx.rotate(angle);
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 39, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6a44';
  ctx.fillRect(-50, -5, 12, 10);
  ctx.fillRect(38, -5, 12, 10);
  ctx.restore();
}

export function drawNet(ctx, x, y) {
  // The farmer's thrown net: a wide rope lattice, best slid under.
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(x + i * 18, y - 64);
    ctx.lineTo(x + i * 18, y);
  }
  for (let j = 0; j <= 3; j++) {
    ctx.moveTo(x - 46, y - 64 + j * 21);
    ctx.lineTo(x + 46, y - 64 + j * 21);
  }
  ctx.stroke();
  ellipse(ctx, x, y - 32, 48, 34, 'rgba(232, 220, 192, 0.18)');
}

// ---- pickups ----------------------------------------------------------------

export function drawCorn(ctx, x, y, bobPhase) {
  const bob = Math.sin(bobPhase * 4) * 4;
  ctx.save();
  ctx.translate(x, y - 30 + bob);
  ellipse(ctx, 0, 0, 12, 20, '#f2b705');
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -18);
    ctx.lineTo(i * 6, 18);
    ctx.stroke();
  }
  poly(ctx, [[-12, 8], [-20, 26], [-4, 18]], '#7fae4c');
  poly(ctx, [[12, 8], [20, 26], [4, 18]], '#5d8a3a');
  ctx.restore();
}

export function drawPie(ctx, x, y, bobPhase) {
  const bob = Math.sin(bobPhase * 4) * 4;
  ctx.save();
  ctx.translate(x, y - 26 + bob);
  poly(ctx, [[-20, 0], [20, 0], [14, 16], [-14, 16]], '#c96a1e');
  ellipse(ctx, 0, 0, 20, 7, '#e8a13a');
  circle(ctx, 0, -4, 5, '#b03a2e');
  ctx.restore();
}

export function drawFeather(ctx, x, y, bobPhase) {
  const bob = Math.sin(bobPhase * 4) * 5;
  ctx.save();
  ctx.translate(x, y - 34 + bob);
  ctx.rotate(-0.4);
  ellipse(ctx, 0, 0, 8, 22, GOLD);
  ellipse(ctx, 0, -14, 4, 10, '#fff3d6');
  ctx.strokeStyle = '#b57f1f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(0, -22);
  ctx.stroke();
  ctx.restore();
}

export function drawHaystackPickup(ctx, x, y) {
  // A haystack Tilly can duck into: it hides her and the farmer loses her.
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(x - 46, y);
  ctx.quadraticCurveTo(x - 40, y - 78, x, y - 86);
  ctx.quadraticCurveTo(x + 40, y - 78, x + 46, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b57f1f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 10);
  ctx.quadraticCurveTo(x - 14, y - 50, x, y - 60);
  ctx.moveTo(x + 20, y - 10);
  ctx.quadraticCurveTo(x + 14, y - 50, x, y - 60);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIDE!', x, y - 96);
}

// ---- scenery ----------------------------------------------------------------

export function drawBackground(ctx, stage, scrollX, time, isKitchen) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(0.62, stage.skyBottom);
  sky.addColorStop(0.62, stage.hillFar);
  sky.addColorStop(1, stage.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun.
  circle(ctx, 1060, 110, 46, stage.sun);
  circle(ctx, 1060, 110, 60, 'rgba(255, 220, 120, 0.35)');

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.9)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 340 - scrollX * 0.08 + time * 12) % (VIEW_W + 400)) - 200;
    const cy = 70 + i * 42;
    ellipse(ctx, cx, cy, 52, 18, 'rgba(255, 250, 235, 0.9)');
    ellipse(ctx, cx + 34, cy + 6, 38, 14, 'rgba(255, 250, 235, 0.9)');
  }

  if (isKitchen) {
    drawKitchenWall(ctx, stage, scrollX);
  } else {
    drawFarmHills(ctx, stage, scrollX);
  }

  // Ground band and grass fringe.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  for (let x = 0; x < VIEW_W; x += 26) {
    const sway = Math.sin(time * 2 + x * 0.05) * 3;
    poly(ctx, [[x, GROUND_Y + 10], [x + 6 + sway, GROUND_Y - 8], [x + 12, GROUND_Y + 10]], stage.grass);
  }
}

function drawFarmHills(ctx, stage, scrollX) {
  // Two parallax hill ridges, a barn, and a fence line scrolling by.
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const wx = x + scrollX * 0.15;
    ctx.lineTo(x, 440 + Math.sin(wx * 0.008) * 34);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = stage.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const wx = x + scrollX * 0.3;
    ctx.lineTo(x, 500 + Math.sin(wx * 0.011 + 2) * 26);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // The red barn, far away on the ridge.
  const barnX = 180 - ((scrollX * 0.3) % 1400);
  ctx.fillStyle = '#a83226';
  ctx.fillRect(barnX, 420, 120, 84);
  poly(ctx, [[barnX - 10, 420], [barnX + 60, 372], [barnX + 130, 420]], '#7c241a');
  ctx.fillStyle = '#f7f1e3';
  ctx.fillRect(barnX + 44, 452, 32, 52);
  ctx.strokeStyle = '#f7f1e3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(barnX + 44, 452);
  ctx.lineTo(barnX + 76, 504);
  ctx.moveTo(barnX + 76, 452);
  ctx.lineTo(barnX + 44, 504);
  ctx.stroke();

  // Scarecrow in the cornfield stage, fence posts everywhere else.
  for (let x = -((scrollX * 0.6) % 160); x < VIEW_W; x += 160) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x, GROUND_Y - 44, 8, 44);
    ctx.fillRect(x + 8, GROUND_Y - 34, 152, 6);
  }
}

function drawKitchenWall(ctx, stage, scrollX) {
  // Inside the farmhouse: a warm wall, a window with the yard outside,
  // hanging pots and a dresser scrolling past.
  ctx.fillStyle = '#e8c9a0';
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.fillStyle = '#d9b98a';
  for (let y = 60; y < GROUND_Y; y += 90) ctx.fillRect(0, y, VIEW_W, 4);

  // Window onto the yard.
  const winX = 900 - ((scrollX * 0.25) % 1500);
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(winX, 90, 190, 150);
  ctx.fillStyle = '#bfe3f0';
  ctx.fillRect(winX + 10, 100, 170, 130);
  circle(ctx, winX + 140, 130, 22, '#ffcf5c');
  ctx.fillStyle = '#7fae4c';
  ctx.fillRect(winX + 10, 190, 170, 40);
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(winX + 90, 100, 8, 130);
  ctx.fillRect(winX + 10, 160, 170, 8);

  // Hanging copper pots.
  for (let i = 0; i < 3; i++) {
    const px = 240 + i * 260 - ((scrollX * 0.2) % 780);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, 60);
    ctx.stroke();
    ctx.fillStyle = '#b5763a';
    ctx.beginPath();
    ctx.arc(px, 92, 30, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(px - 30, 88, 60, 8);
  }
}

export function drawForestGate(ctx, x, y, time) {
  // The gate at the end of the kitchen: two pine trees and a wooden arch
  // with a hand-painted "FREE" sign. Run through it and Tilly is safe.
  ctx.fillStyle = '#2e5d33';
  for (const tx of [x - 90, x + 90]) {
    poly(ctx, [[tx - 46, y], [tx, y - 150], [tx + 46, y]], '#2e5d33');
    poly(ctx, [[tx - 36, y - 60], [tx, y - 190], [tx + 36, y - 60]], '#3a7040');
    ctx.fillStyle = '#5d3413';
    ctx.fillRect(tx - 8, y - 10, 16, 12);
    ctx.fillStyle = '#2e5d33';
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(x - 70, y - 150, 14, 150);
  ctx.fillRect(x + 56, y - 150, 14, 150);
  ctx.fillRect(x - 84, y - 150, 168, 16);
  const glow = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(255, 220, 120, ${0.25 + 0.3 * glow})`;
  ctx.fillRect(x - 70, y - 134, 140, 134);
  ctx.fillStyle = CREAM;
  ctx.fillRect(x - 78, y - 138, 156, 34);
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TO THE WOODS', x, y - 114);
}
