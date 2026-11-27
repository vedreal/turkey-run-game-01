// The world of Tilly's Great Thanksgiving Escape: the scrolling farm,
// the hazards it throws at her, the food she grabs on the way, and the
// three stages that carry her from the farmyard to the forest gate.
// Everything lives in world coordinates; the screen shows a 1280px window
// of it, with Tilly pinned near the left edge.

import {
  GROUND_Y,
  RUN,
  STAGES,
  ESCAPE_METRE,
  HAZARDS,
  VIEW_W,
} from './config.js';
import { makeRng, range, pick, chance } from './random.js';

export function stageForMetre(metre) {
  for (const stage of STAGES) {
    if (metre < stage.toMetre) return stage;
  }
  return STAGES[STAGES.length - 1];
}

export function speedForMetre(metre) {
  return Math.min(RUN.maxSpeed, RUN.startSpeed + metre * RUN.speedPerMetre);
}

export function createWorld(seed) {
  return {
    rng: makeRng(seed),
    scrollX: 0, // world pixels scrolled past the left edge
    distance: 0, // metres Tilly has run
    speed: RUN.startSpeed,
    stage: STAGES[0],
    obstacles: [], // {kind, x, y, vy, state, warnT, angle}
    pickups: [], // {kind, x, y, taken}
    nets: [], // farmer-thrown nets flying at Tilly
    nextSpawnX: 900, // world x of the next hazard group
    gateX: ESCAPE_METRE * RUN.pxPerMetre, // world x of the forest gate
    gateReached: false,
    time: 0,
  };
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed);
  Object.assign(world, fresh);
}

// ---- spawning ---------------------------------------------------------------

function spawnHazard(world, kind, x) {
  const h = HAZARDS[kind];
  const obstacle = { kind, x, y: GROUND_Y, vy: 0, state: 'live', warnT: 0, angle: 0, w: h.w, h: h.h };
  if (kind === 'knife') {
    // A knife first hangs in the air with a warning shadow, then drops.
    obstacle.y = GROUND_Y - 320;
    obstacle.state = 'warn';
    obstacle.warnT = 0.55;
    obstacle.vy = 0;
  }
  if (kind === 'rollingpin') {
    obstacle.vy = 0;
    obstacle.angle = 0;
  }
  world.obstacles.push(obstacle);
  return obstacle;
}

function spawnPickup(world, kind, x, y = GROUND_Y) {
  world.pickups.push({ kind, x, y, taken: false });
}

function spawnGroup(world) {
  const rng = world.rng;
  const stage = world.stage;
  const x = world.nextSpawnX;
  const kind = pick(rng, stage.hazards);

  if (kind === 'knife') {
    // A knife falls just ahead of Tilly; a corn tempts her to run under it.
    spawnHazard(world, 'knife', x + range(rng, 60, 160));
    if (chance(rng, 0.6)) spawnPickup(world, 'corn', x + 120);
  } else if (kind === 'oven') {
    spawnHazard(world, 'oven', x);
    if (chance(rng, 0.5)) spawnPickup(world, 'pie', x + 170, GROUND_Y - 150);
  } else if (kind === 'rollingpin') {
    spawnHazard(world, 'rollingpin', x + 200);
    spawnHazard(world, 'fence', x);
  } else {
    spawnHazard(world, kind, x);
    // A little arc of corn over a fence or a bale rewards a good jump.
    if ((kind === 'fence' || kind === 'haybale') && chance(rng, 0.55)) {
      spawnPickup(world, 'corn', x - 30, GROUND_Y - 130);
      spawnPickup(world, 'corn', x + 10, GROUND_Y - 160);
      spawnPickup(world, 'corn', x + 50, GROUND_Y - 130);
    }
    if (kind === 'branch' && chance(rng, 0.4)) {
      spawnPickup(world, 'corn', x + 10, GROUND_Y - 40);
    }
  }

  // A lone pickup drifts by between hazard groups.
  if (chance(rng, 0.45)) {
    const pk = pick(rng, stage.pickups);
    const px = x + range(rng, 260, 420);
    if (pk === 'haystack') spawnPickup(world, 'haystack', px);
    else if (pk === 'feather') spawnPickup(world, 'feather', px, GROUND_Y - 170);
    else spawnPickup(world, pk, px, pk === 'pie' ? GROUND_Y - 150 : GROUND_Y);
  }

  const [minGap, maxGap] = stage.spawnGap;
  world.nextSpawnX = x + range(rng, minGap, maxGap);
}

// ---- per-frame update --------------------------------------------------------

export function updateWorld(world, dt, turkey) {
  world.time += dt;
  world.speed = speedForMetre(world.distance);
  world.scrollX += world.speed * dt;
  world.distance = world.scrollX / RUN.pxPerMetre;
  world.stage = stageForMetre(world.distance);

  // Spawn hazard groups just off the right edge.
  while (world.nextSpawnX < world.scrollX + VIEW_W + 260) {
    spawnGroup(world);
  }

  // Falling knives: warn, then drop fast, then stick in the ground.
  for (const ob of world.obstacles) {
    if (ob.kind === 'knife') {
      if (ob.state === 'warn') {
        ob.warnT -= dt;
        if (ob.warnT <= 0) {
          ob.state = 'fall';
          ob.vy = 60;
        }
      } else if (ob.state === 'fall') {
        ob.vy += 4200 * dt;
        ob.y += ob.vy * dt;
        ob.angle += dt * 3;
        if (ob.y >= GROUND_Y - 40) {
          ob.y = GROUND_Y - 40;
          ob.state = 'stuck';
          ob.angle = 0.12;
        }
      }
    }
    if (ob.kind === 'rollingpin') {
      // A rolling pin rolls towards Tilly faster than the world scrolls.
      ob.x -= world.speed * 0.55 * dt;
      ob.angle += dt * 9;
    }
  }

  // Nets fly from the farmer towards Tilly.
  for (const net of world.nets) {
    net.x += net.vx * dt;
    net.y += Math.sin(world.time * 6 + net.phase) * 20 * dt;
  }
  world.nets = world.nets.filter((n) => n.x < world.scrollX + VIEW_W + 200);

  // Cull whatever has scrolled off the left edge.
  const leftEdge = world.scrollX - 220;
  world.obstacles = world.obstacles.filter((o) => o.x > leftEdge);
  world.pickups = world.pickups.filter((p) => p.x > leftEdge && !p.taken);

  // The forest gate: once Tilly runs past it, she has escaped.
  if (!world.gateReached && world.scrollX + 260 >= world.gateX) {
    world.gateReached = true;
  }
}

// The farmer hurls a net at Tilly when she lets him get close.
export function throwNet(world, fromScreenX) {
  world.nets.push({
    x: world.scrollX + fromScreenX,
    y: GROUND_Y - 40,
    vx: world.speed + 320,
    phase: world.rng() * 6,
  });
}

// Screen position of a world x.
export function toScreenX(world, worldX) {
  return worldX - world.scrollX;
}
