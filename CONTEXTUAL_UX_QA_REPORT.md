# Contextual interaction UX QA — 2026-11-04

**Status: implemented and browser-tested, but the combined isometric remake remains INCOMPLETE.** Branch `feature/contextual-interaction-ux`; no local commit/push/merge yet.

The permanent large farming toolbar was removed from the map. The compact bottom dock opens inventory, quests, build and friends; its utility menu retains the old seed refill, crafting, decoration and expansion controls. Clicking soil opens only actions valid for its current server state. Choosing an action allows one-tile click or continuous desktop drag; touch uses a 380 ms hold before dragging. The preview deduplicates cells, caps a gesture at 25, and shows progress. Submissions are sequential and resynchronize state after a server error. Escape, outside tap, scene change and a second touch cancel or close as appropriate.

Pond, coop, buildings, decorations and market NPCs have contextual entries. Visitors cannot edit a farm. A noninteractive prompt no longer blocks clicks on the ao/chuồng underneath it. Modal panels close when the player starts keyboard movement or taps outside.

## Evidence

- `npm test`: 40/40 PASS, including contextual validity, interpolation and isometric coordinate round trips.
- `node tests/browser-contextual-qa.mjs`: 13/13 PASS, including desktop five-tile drag, mobile long press/two-finger cancellation, VAC/building/market NPC, popup dismissal, responsive bounds and owner isolation.
- `npm run qa:browser`: 14/14 PASS; `npm run qa:vac`: 5/5; `npm run qa:phase5`: 13/13; `npm run qa:phase6`: 12/12; `npm run qa:phase7`: 4/4 with two accounts.
- `node tests/browser-phase8-panels.mjs`: 17 panels × 5 viewports PASS. `node tests/browser-phase8-network.mjs`: 1.2 s API delay, offline and reconnect checks PASS.
- Two-account journey in `tests/browser-isometric-journey.mjs`: 1,200 seconds, farming/VAC/market/crafting/building/visit/reload PASS; growth/production timestamps were accelerated in QA to reach long-cycle actions.
- Before screenshots: `.qa/context-before-desktop.png`, `.qa/context-before-mobile.png`. After screenshots: `.qa/context-after-desktop.png`, `.qa/context-after-mobile.png`, `.qa/isometric-planted-rice.png`, `.qa/ui-*-*.png`. `.qa` is ignored by Git.
- Short viewport FPS: near 60 in headless Edge; long benchmark and its limitations are tracked in `ISOMETRIC_REMAKE_QA_REPORT.md`.

## Open limits

Real Edge browser zoom at 125% could not be applied by automated keyboard shortcut in headed or headless mode. CSS zoom overflow passed, and DPR2 visual checks passed, but neither is a substitute for a true browser zoom test. The combined remake also still needs an occlusion/art pass over all decorations. See `ISOMETRIC_REMAKE_PROGRESS.md` before marking the full requested work COMPLETE.
