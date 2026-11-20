# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tpmtling/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tpmtling/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend is a complete, offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. It covers all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden) with a guide written for this entry beside each one and its sources named: the official PlayStation list as cross-checked on Exophase and PSNProfiles, and the PowerPyx trophy guide and roadmap. A 3-stage roadmap walks the platinum in about 200 hours at an estimated 4/10 difficulty — story first (60–80 hours), then the 100% completion checklist (about 100 hours), then Strangers & Freaks and clean-up (about 10 hours) — and the one potentially missable trophy, Positive Mental Attitude and its Chapter 1 meditation, is flagged in red everywhere it appears. The tracker ticks trophies off in the browser (localStorage), filters by kind (story, side questlines, activities, collectibles, crime, secrets, money, character, completion — and online, of which there are none), grade and state, searches, sorts, exports and imports progress, and offers a spoiler shield that hides story trophies until they are earned. The app is plain static files under `app/` with no build step and no network use; `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes the `dossier.json` hand-in.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or serve app/ with any static file server.
# To build the hand-in instead: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=s0etxp1t&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
