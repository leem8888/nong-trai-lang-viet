# Farm 2.0 implementation report

**Verdict: GO WITH FIXES.** Baseline HEAD: `029dd86d1cc61b82ba7a40cdcd1da187ff7ee560`. The owner separately authorized committing and pushing this reviewed state despite the remaining COMPLETE evidence gaps.

## Changes

- CP0: Mapped render, gameplay and collision dependencies in [BASELINE.md](BASELINE.md); captured a pre-edit Farm image.
- CP1–CP2: Retained the existing grass atlas and authored buildings. Warmed and textured the cached internal dirt paths in `FarmTerrain.build`; their geometry and all collision coordinates remain unchanged. External road art is unchanged.
- CP3: Removed per-tile grass cards and the permanent trench/grid across locked plots. Following user feedback, unpurchased plots are now raised light banana-green beds, while owned untilled plots are brown raised beds. Their artwork is cached separately; existing tilled/planted beds, hover, purchase sign and server ownership remain.
- CP4: Inspected fence, house, pond and coop layers; no asset repositioning or new scenery was justified by the browser images.
- CP5: Reused existing authoritative VAC rendering. Confirmed fish feeding now pulls visible fish toward a point inside the pond, with food particles at that point. Chicken routing and feeding remain; ready eggs and the collection animation were moved to the nesting shelf inside the coop.
- CP6: Kept the existing pathfinding and interaction anchors. Browser collision VAC QA exercised automatic approach to the pond and yard, feeding, fish harvest and egg collection.
- CP7: Updated plot assertions to the new visual rule, added a pond-bounded feeding test and fixed the browser plot QA's outdated camera world and menu assertion.
- Follow-up: Limited canvas resolution to roughly 2.5 million pixels on large high-DPR screens and added a browser movement probe. At 1366×768 and DPR 2 it recorded 2,501,274 backing pixels, movement p95 16.8 ms and zero server corrections during a three-second open-ground walk. This improves render headroom but does not prove the reported stutter is resolved on the user's device.
- Follow-up: Water is now offered only after planting and before maturity. Ripe crops appear watered in the UI even when never manually watered, with no retroactive growth bonus or database mutation. Removed the dots/gleam that marked watered soil. Existing prewatered legacy rows remain readable and plantable. Ready eggs now draw over the coop nesting shelf and collection animation starts there.

## Checks run

| Check | Result |
| --- | --- |
| `npm test` | 89/89 pass |
| `node --experimental-websocket tests/browser-plot-visual.mjs after` | Pass: hover, click, purchase, SQLite count, screenshots |
| `node tests/browser-animal-motion-qa.mjs` | Pass: 50 chicken samples, three fish frames with movement, direct feeding, desktop/mobile |
| `node tests/browser-collision-vac-qa.mjs` | Pass: automatic approach, fish feed/harvest, chicken feed, egg collection |
| `node tests/browser-crop-info-qa.mjs` | Pass: growing crop needs water; ripe crop shows watered and has no watering action |
| `node --experimental-websocket tests/browser-terrain-visual.mjs` | Pass: 1920×1080 p50 16.6 ms/p95 20 ms; 1366×768 p50 16.6 ms/p95 20.4 ms; 390×844 p50 16.7 ms/p95 18 ms; no reported browser errors |
| `node tests/browser-vac-qa.mjs` | Fails: legacy selectors for stock fish, add chicken and market sale; later scenarios did not execute |

## Open fixes for COMPLETE

1. Capture matched close before/after views for road/gate, soil, pond and coop from the baseline build, plus action frame sequences or video for feeding and harvesting.
2. Update and rerun the older `browser-vac-qa.mjs` UI journey. Its selectors no longer match the contextual controls, so it currently does not prove the full VAC regression path.
3. Run the full long-duration performance scenario with many entities; the current browser sample covers three viewport sizes but not sustained load.

## Publication

Remote: `origin`, branch: `main`. The resulting commit hash is available with `git log -1 --format=%H` and is reported in the delivery message. No merge or deploy was requested.
