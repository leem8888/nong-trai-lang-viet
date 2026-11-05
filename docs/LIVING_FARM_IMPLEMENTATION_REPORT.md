# Living Farm implementation report — 2026-11-05

**Latest verification:** The 10-minute Edge benchmark finished with 60 samples and no page errors; details are in `LIVING_FARM_VISUAL_QA.md`. The broad browser suite passed 14/14, contextual 16/16 and Phase 7 multiplayer 4/4 after the QA test closed its clients before restarting the server. Direct VAC actions remain on the map without a modal. The layout-fallback and visual gates below still keep this report INCOMPLETE.

**Status: INCOMPLETE.** The work is shared on `main` for review at the user's request. No deploy, schema migration or player database reset occurred. The preceding Terrain/Land/Fence/Gate work also remains INCOMPLETE because real 125% browser zoom was not verified.

## Implemented

- Enlarged original-style pond sprite with no painted fish. Server VAC rows now determine which fish appear; their size follows `progress`. An empty pond has no fish.
- Empty coop and combined low-fence yard art with gate, feed trough and water trough. Server coop rows determine which chickens and egg indicators appear. Chickens walk, pause/peck and move near the coop locally.
- `livingLayout()` chooses pond/yard footprints around existing placements, reuses the old pond if the larger footprint is occupied and does not move or delete saved objects. Shared geometry feeds client collision, server movement and Phase 5 placement validation.
- Contextual pond/coop hit testing now starts auto-approach, then opens the small menu. Server-validated successful VAC actions trigger local feed/harvest visual feedback; replayed receipts do not retrigger it.
- Farm snapshots recover a saved player standing in newly blocked terrain to a nearby valid point. No wallet, inventory or animal records are altered by that recovery.

## Remaining gates

- Browser QA captured direct feed/harvest screenshots after successful server actions, but has not yet recorded time-separated frame sequences for each action, failed-request visual rollback, or two clients viewing the same animal state. The 10-minute benchmark has completed; its shared-host conditions are recorded in the visual QA report.
- A farm whose existing placements occupy both yard candidates currently falls back to the empty coop without a yard. This preserves saved buildings, but does not meet the yard visual DoD for that layout. A compatible alternate yard design is needed.
- The sprite visual footprints and navigation rectangles are intentionally separate; further visual QA is needed for every placement fallback and mobile hit target. The Phase 7 test's restart hang was fixed by disconnecting the browser clients before closing Socket.IO; the rerun passed 4/4. The broad browser suite's first crop-menu failure did not reproduce on rerun (14/14).
- Terrain real browser zoom 125% remains unverified. The CSS zoom test is not equivalent.

The project must remain **INCOMPLETE** until these gates pass. A review commit is not evidence that the Definition of Done has been met.
