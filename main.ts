// Leonida Legend — GTA VI trophy guide & tracker (gta6-trophy-guide-01 entry).
//
// The guide itself is the static web app in app/ beside this file: plain HTML,
// CSS and ES modules with no build step, designed to run in a browser with the
// network off. Its data — the official 55 PlayStation 5 trophies, each with a
// cited guide written for this entry, a roadmap stage and a missable flag —
// lives in app/data/trophies.json.
//
// This program is the hand-in step. It copies app/ and screenshots/ into the
// output directory and writes dossier.json there with the vendored make.fun
// frontend library, byte for byte the way the scorer rebuilds it, so
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Preview:    node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsOut = join(outputDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
const shotsIn = join(repoDir, 'screenshots');
if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });

// The limits below are the scorer's own caps for this bounty: the dossier
// text is capped at 160 KiB, screenshots at 4 files of at most 256 KiB each,
// and the app at 993 files / 48 MiB. buildDossier refuses anything past
// those caps, which is what we want — a refusal here beats a refusal at
// grading time.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
