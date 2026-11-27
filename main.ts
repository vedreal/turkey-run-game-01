// Tilly's Great Thanksgiving Escape — the entry program (Node 22, standard
// library only). The grader runs this file twice in a sandbox with no
// network, a read-only copy of this repository and a writable /output.
// The program hands the game in: it copies the playable static game and
// the screenshots beside this file into /output, then writes
// /output/dossier.json — the summary the judge reads — with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output, so a local check is:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for this bounty, from the kit's rules: at most 4
// screenshots of 256 KiB each, game/ at most 993 entries and 48 MiB, and
// the dossier text at most 160 KiB. The library enforces them when it
// builds the dossier; the numbers below are the same ones the gate uses.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(gameDir)) fail('game/ is missing from the repository');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing from the repository');

// The gate caps game/index.html at 1 MiB and game/ at 993 entries / 48 MiB;
// refuse early with a clear message instead of handing in a bad entry.
const indexBytes = statSync(join(gameDir, 'index.html')).size;
if (indexBytes > 1048576) fail(`game/index.html is ${indexBytes} bytes, over the 1 MiB cap`);
let gameEntries = 0;
let gameBytes = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    gameEntries += 1;
    if (statSync(path).isDirectory()) walk(path);
    else gameBytes += statSync(path).size;
  }
})(gameDir);
if (gameEntries > DOSSIER_LIMITS.game_max_files) fail(`game/ has ${gameEntries} entries, over the 993 cap`);
if (gameBytes > DOSSIER_LIMITS.game_max_bytes) fail(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);

const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}
for (const name of shotFiles) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > DOSSIER_LIMITS.screenshots.max_bytes) {
    fail(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
  }
}

mkdirSync(outputDir, { recursive: true });
copyTree(gameDir, join(outputDir, 'game'));
copyTree(shotsDir, join(outputDir, 'screenshots'));

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));

console.log(
  `main.ts: game/ has ${gameEntries} entries (${gameBytes} bytes); wrote ${shotFiles.length} screenshots and the dossier to ${outputDir}`,
);
