# Isometric remake QA — work in progress, 2026-11-04

**Decision: GO WITH FIXES for further development; not COMPLETE.** Branch `feature/contextual-interaction-ux`, no local commit yet. This report records real execution and open acceptance gates from `ZING_FARM_COMPLETE_REMAKE_PLAN.md`.

## Executed checks

| Check | Result |
|---|---|
| `npm test` | 40/40 PASS after isometric renderer and sprite integration; includes 100-point × 5-viewport × 4-zoom projection matrix |
| `node tests/browser-contextual-qa.mjs` | 13/13 PASS: soil single/drag, touch long press and two-finger cancel, VAC, building, market NPC, popup dismissal, ownership, responsive bounds |
| `npm run qa:browser` | 14/14 PASS: account, movement, crop, market, security |
| `npm run qa:vac` | 5/5 PASS |
| `npm run qa:phase5` | 13/13 PASS, including crafting, building, decor, offline state and 100-decor FPS |
| `npm run qa:phase6` | 12/12 PASS: world/season/NPC/quests |
| `npm run qa:phase7` | 4/4 PASS: two-account visit, movement, wave, kick, privacy; visit sample 61 FPS |
| `node tests/browser-phase8-panels.mjs` | 17 panels × 5 browser viewports PASS; screenshots `.qa/ui-*-*.png` |
| `node tests/browser-phase8-visual.mjs iso` | 5 viewports; median ≈59.88 FPS, p95 frame time 17–17.8 ms in headless Edge on this workstation |
| `node tests/browser-phase8-network.mjs` | 1.2 s latency and offline/reconnect checks PASS |
| `node tests/browser-isometric-video.mjs` | Browser video recorded to `.qa/isometric-qa.webm`; first FFmpeg-dependent attempt failed, helper was installed, then recording passed |
| `node tests/browser-isometric-journey.mjs` | Full gameplay path through second-account visit and returning login; 1,200-second session PASS, 24 memory/resource samples in `.qa/isometric-journey-report.json` |
| `node tests/browser-isometric-performance.mjs` | 600-second Edge benchmark completed: 1366×768, DPR2, 100 decorations, 12 samples, no page errors; `.qa/isometric-performance-report.json` |

Baseline screenshots of the old UI/map are in `.qa/context-before-desktop.png` and `.qa/context-before-mobile.png`. New farm/auth screenshots are in `.qa/phase8-iso-*-farm.png` and `.qa/phase8-iso-*-login.png`; planted crop and building screenshots are `.qa/isometric-planted-rice.png` and `.qa/phase5-farm.png`. Video and `.qa` screenshots are local ignored QA artifacts, not Git-tracked deliverables.

WebP conversion reduced the 14 runtime images from 26,382,056 to 5,289,092 bytes (about 80% smaller). The runtime PNG copies were removed after desktop/mobile visual verification. Six viewport visual runs (including 1280×720) at DPR1 and five at DPR2 were recorded; median frame time was near 16.7 ms and p95 generally 17–19.7 ms in short 120-frame windows.

Final regression after scene-based WebP loading: `npm test` 40/40, contextual browser 13/13, browser baseline 14/14, VAC 5/5, Phase 5 13/13, Phase 6 12/12, Phase 7 4/4, all 17 panels on five viewports, network latency/offline checks, and QA video recording passed. The first `npm test` invocation ran under the workspace sandbox and could not open `data/starter.sqlite` for SQLite's read-write mode; the authorized repo execution passed all 40 tests. Phase 5's initial browser run found an outdated assertion expecting the old large build button to be visible; the assertion now verifies access through the compact utility menu, and the entire suite passed on rerun.

The 10-minute benchmark's frame median was 16.6–16.7 ms in 11 of 12 samples (about 59.9–60.2 FPS). One sample at second 205 measured 20.1 ms median / 42.9 ms p95 (49.8 FPS) while other browser QA ran concurrently. Later samples recovered to about 59.9 FPS. Heap readings began at 3.98 MB, ranged 2.89–4.30 MB, and ended at 3.03 MB; this run did not show sustained heap growth. Network resource entries increased with normal polling and are not a memory-leak measure.

## Limits and defects under review

- Edge headless and headed `Control+Equal` did not change actual browser zoom metrics. CSS zoom and viewport bounds were tested, but actual browser zoom 125% is **not verified**. The computer-use kernel also failed to initialize (`failed to write kernel assets: The system cannot find the path specified`), so the direct-UI fallback is unavailable in this environment.
- The 100-point matrix proves projection round trips, not 100 real browser clicks. The browser DPR1/2 visual matrix passed; exact occlusion at all decoration/building overlaps is not yet proved.
- The decoration catalogue still uses simple Canvas art. NPCs have distinct static sprites; player has walk/action frames; NPC walk cycles and full animal action frames are not yet authored.
- Growth and production timestamps were advanced in the controlled 20-minute QA scenario to cover harvesting, VAC and crafting within one browser run. This is documented test setup, not natural-time progression evidence. The 20-minute journey's old `window.__farmFrameStats` hook was absent, so its report records memory/resources but not FPS; FPS was measured separately in the 10-minute rAF benchmark.
- A single headless Edge workstation and virtual mobile viewports cannot establish physical-device performance.

No server schema, account data, economy constants or deploy configuration was changed in this branch. Do not mark Definition of Done COMPLETE until the open gates are resolved and final regression is repeated.
