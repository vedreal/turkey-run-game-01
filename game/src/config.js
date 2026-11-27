// Tilly's Great Thanksgiving Escape — tuning and stage table.
// One place for every number the game balances on: speeds, gravity,
// hazards, pickups, the farmer's chase and the three stages of the run
// (farmyard -> cornfield -> farmhouse kitchen -> the forest gate).

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const TURKEY_X = 260;

export const PHYSICS = {
  gravity: 2600, // px / s^2, pulls Tilly back to the ground
  jumpVelocity: -980, // first jump, strong enough to clear a fence
  flapVelocity: -820, // second jump in the air (the wing flap)
  maxFall: 1500,
  slideTime: 0.55, // seconds Tilly stays low when sliding
};

export const RUN = {
  startSpeed: 380, // px / s of world scroll at the start line
  maxSpeed: 760,
  speedPerMetre: 0.55, // world gets faster the further Tilly runs
  pxPerMetre: 9, // 9 scrolled pixels earn one metre of distance
  scorePerMetre: 10,
  startHearts: 3,
  maxHearts: 3,
  farmerGapStart: 70, // 0..100, 0 means the farmer has caught Tilly
  farmerGapStumble: 24, // gap lost on every hit
  farmerGapRegen: 3.2, // gap regained per clean second
  farmerGapHaystack: 30, // gap regained by hiding in a haystack
};

export const PICKUP_SCORE = {
  corn: 25,
  pie: 50,
  feather: 0, // a golden feather restores a heart instead of points
  haystack: 0, // a haystack hides Tilly and pushes the farmer back
};

// The three stages of the escape. Each one re-skins the world, raises the
// speed and mixes in new hazards. Reach the end of the kitchen and the
// forest gate opens: Tilly is free.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'THE FARMYARD',
    fromMetre: 0,
    toMetre: 600,
    skyTop: '#ffd9a0',
    skyBottom: '#fff3d6',
    sun: '#ffcf5c',
    hillFar: '#c98f4e',
    hillNear: '#a9713a',
    ground: '#8a5a2b',
    grass: '#7fae4c',
    accent: '#b03a2e',
    spawnGap: [420, 700], // px between hazard groups, shrinks as speed rises
    hazards: ['fence', 'haybale', 'branch'],
    pickups: ['corn', 'corn', 'pie', 'haystack'],
  },
  {
    id: 'cornfield',
    name: 'THE CORNFIELD',
    fromMetre: 600,
    toMetre: 1200,
    skyTop: '#f7b267',
    skyBottom: '#ffe9b8',
    sun: '#ff9e3d',
    hillFar: '#b5763a',
    hillNear: '#8f5a28',
    ground: '#7c4f22',
    grass: '#c9a227',
    accent: '#b03a2e',
    spawnGap: [380, 620],
    hazards: ['fence', 'haybale', 'branch', 'knife'],
    pickups: ['corn', 'pie', 'corn', 'feather'],
  },
  {
    id: 'kitchen',
    name: 'THE FARMHOUSE KITCHEN',
    fromMetre: 1200,
    toMetre: 1800,
    skyTop: '#e8b48a',
    skyBottom: '#f6ddba',
    sun: '#ffb347',
    hillFar: '#7a4a30',
    hillNear: '#5f3823',
    ground: '#6b4a2f',
    grass: '#8a6a44',
    accent: '#c0392b',
    spawnGap: [340, 560],
    hazards: ['fence', 'knife', 'oven', 'rollingpin', 'branch'],
    pickups: ['corn', 'pie', 'feather', 'haystack'],
  },
];

export const ESCAPE_METRE = 1800; // the forest gate stands at 1800 m

// Hazard shapes: width, height, what clears them, and the points of pain.
export const HAZARDS = {
  fence: { w: 46, h: 92, clear: 'jump', label: 'Fence' },
  haybale: { w: 84, h: 74, clear: 'jump', label: 'Hay bale' },
  branch: { w: 90, h: 58, clear: 'slide', label: 'Low branch' },
  knife: { w: 34, h: 96, clear: 'dodge', label: 'Carving knife' },
  oven: { w: 110, h: 84, clear: 'jump', label: 'Oven vent' },
  rollingpin: { w: 78, h: 40, clear: 'jump', label: 'Rolling pin' },
  net: { w: 92, h: 64, clear: 'slide', label: 'Farmer net' },
};

export const STAGE_NAMES = STAGES.map((s) => s.name);
