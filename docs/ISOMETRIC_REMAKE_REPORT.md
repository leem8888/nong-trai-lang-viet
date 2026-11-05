# Isometric remake report: architecture, visual style, progress, QA

---

## Isometric remake architecture

### Coordinate contract

The server and SQLite keep the existing Cartesian world coordinates, tile IDs, collision rectangles, movement speed and scene names. The client projects them only for drawing and pointer hit testing. No migration is required.

`IsoProjection.js` maps a world point `(x, y)` to `(0.78 × (x − y + worldHeight), 0.39 × (x + y))`. Its inverse maps pointer positions back to world coordinates before `tileAt`, object hit testing, placement and movement. `Camera.toScreen` and `Camera.toWorld` share that projection. Farm and market use the same projection; each scene keeps its own world dimensions. CSS pixels are the camera input, while Canvas pixels scale with DPR (capped at 2).

### Render order and assets

The farm paints terrain and paths, then soil state and crop sprites, then depth-sorted world sprites by world Y. The static house, pond, coop, trees, production buildings, NPCs, remote visitors and player use transparent PNG assets. `upright()` applies the inverse of the isometric Canvas matrix around an object's ground anchor so a building or person remains upright. The market uses the same ground projection, stall sprites and NPC sprites.

The four-direction player sheet has four walk frames per direction. The player action sheet selects a hoe, sow, water or harvest pose after a successful server action. VAC fish and chicken motion is cosmetic and respects reduced effects. `public/assets/manifest.json` records each generated asset's role, origin and use terms. The original generated PNGs were packaged as local WebP files (quality 0.88, alpha retained), reducing the runtime pack from 26.4 MB to 5.3 MB. The game does not fetch third-party images. `scripts/optimize-isometric-assets.mjs` documents the packaging step for named regenerated PNG sources supplied through `ISO_ASSET_SOURCE_DIR`.

### Interaction and authority

`InputManager` converts a pointer to server-world coordinates via the camera, then delegates to `ContextualInteraction`. Contextual actions use existing Phase 1–8 APIs. Dragging interpolates grid cells, deduplicates them, caps a batch at 25 and sends each action sequentially; the server remains authoritative. Multi-touch cancels a gesture. Visitors cannot mutate soil, VAC or placed objects. `Phase5UI` still owns placement validation and a projected preview.

### Current limits

The original decoration catalogue still uses simple Canvas art. The isometric scene uses a depth sort for primary sprites, while decoration previews and some effects are drawn separately; exact occlusion at every overlap has not been proved. Crop/animal sprite motions are limited to the authored frames and gentle movement. Camera zoom and DPR testing is still being expanded, so this document describes the current implementation rather than a completed acceptance gate.

---

## Isometric visual style guide

- **Art direction:** original Vietnamese countryside cartoon, warm terracotta roofs, bamboo/wood details, jade UI and parchment panels. Do not use copyrighted Zing Farm art.
- **World grid:** authoritative Cartesian farm 1440×1024, market 1200×800, placement cell 48 world units. Projection coefficients are 0.78 horizontally and 0.39 vertically; the original soil footprint remains 70×42 world units with 82×55 spacing.
- **Sprite anchors:** ground contact at the bottom center of each transparent sprite. Camera and hit areas use world coordinates, never the PNG's transparent bounds. Production buildings use their server footprint for placement and bottom edge for sorting.
- **Scale:** farmhouse 485×323 screen-independent projected units, pond 290×193, coop 245×164, player 78×86, NPC 72×92. Scale is multiplied by camera zoom. These are visual sizes, not collision footprints.
- **UI:** `public/ui-theme.css` is the shared design layer for auth, farm creation, HUD, compact dock, contextual menu, panels, controls, notifications and responsive breakpoints. HUD shows current land level and five main quest progress rather than invented XP. Auth introduces a default character visually without adding persisted character data.
- **Animation:** player walk sheet 4 directions × 4 frames at 135 ms per frame; successful soil actions show authored poses for 750 ms. Fish/chicken use subtle position motion and stop when reduced effects are enabled. Weather and time overlays remain driven by server world state.
- **Assets:** local WebP/SVG files and roles are listed in `public/assets/manifest.json`; output is original for this project under applicable OpenAI output terms. WebP alpha is preserved. No hotlinks.

Visual review should check silhouette at 360, 390, 768, 1366 and 1920 CSS pixels, zoom 125%, name legibility, panel overflow, clipping behind HUD, crop stage recognition and overlap of player/NPC with objects. A virtual mobile viewport is browser emulation, not a physical device test.

---

## Isometric remake progress — 2026-11-04

**Status: INCOMPLETE.** Branch `feature/contextual-interaction-ux`; local changes are not committed, pushed or merged. This checklist follows `ZING_FARM_COMPLETE_REMAKE_PLAN.md` and its Definition of Done.

| Gate | Current result | Remaining work |
|---|---|---|
| CP0 audit/baseline | Source, server coordinate flow and baseline tests audited; before screenshots in `.qa/context-before-*` | Baseline video and exact-state comparison for six scenes |
| CP1 isometric prototype | Farm/market projection, inverse pointer mapping, camera and browser soil/VAC/placement flows work; 100-point camera matrix × 5 viewports × 4 zoom factors passes | True browser zoom and full occlusion audit |
| CP2 assets/environment | Original house, pond, coop, trees, crops, market stall, NPC and production sprites integrated; manifest present | Replace primitive decoration catalogue; review all seasons and object scale |
| CP3 characters/animals/VFX | 4×4 player walk sheet, four action poses, distinct NPCs, VAC animal motion, Y-sorted primary sprites | NPC walk/action frames, occlusion around all decorations/buildings, VFX review |
| CP4 HUD/context | Compact dock, unified panels, soil/VAC/building/NPC context and desktop/touch drag implemented | Complete visual review of every popup and menu under real browser zoom |
| CP5 QA/performance | Final regression passed: 40 automated tests, Phase 1–7 browser suites, 17 panels × 5 viewports, 20-minute two-account journey, QA video, network tests, and 10-minute DPR2/100-decoration benchmark | True browser zoom, full video/occlusion review, 100 real browser hit targets, and matched before/after scene evidence |

Do not mark this remake COMPLETE or create a local commit until all Definition of Done gates are met. The Phase 1–8 server and SQLite data model have not been changed in this branch.

---

## Isometric remake QA — work in progress, 2026-11-04

**Decision: GO WITH FIXES for further development; not COMPLETE.** Branch `feature/contextual-interaction-ux`, no local commit yet. This report records real execution and open acceptance gates from `ZING_FARM_COMPLETE_REMAKE_PLAN.md`.

### Executed checks

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

### Limits and defects under review

- Edge headless and headed `Control+Equal` did not change actual browser zoom metrics. CSS zoom and viewport bounds were tested, but actual browser zoom 125% is **not verified**. The computer-use kernel also failed to initialize (`failed to write kernel assets: The system cannot find the path specified`), so the direct-UI fallback is unavailable in this environment.
- The 100-point matrix proves projection round trips, not 100 real browser clicks. The browser DPR1/2 visual matrix passed; exact occlusion at all decoration/building overlaps is not yet proved.
- The decoration catalogue still uses simple Canvas art. NPCs have distinct static sprites; player has walk/action frames; NPC walk cycles and full animal action frames are not yet authored.
- Growth and production timestamps were advanced in the controlled 20-minute QA scenario to cover harvesting, VAC and crafting within one browser run. This is documented test setup, not natural-time progression evidence. The 20-minute journey's old `window.__farmFrameStats` hook was absent, so its report records memory/resources but not FPS; FPS was measured separately in the 10-minute rAF benchmark.
- A single headless Edge workstation and virtual mobile viewports cannot establish physical-device performance.

No server schema, account data, economy constants or deploy configuration was changed in this branch. Do not mark Definition of Done COMPLETE until the open gates are resolved and final regression is repeated.
