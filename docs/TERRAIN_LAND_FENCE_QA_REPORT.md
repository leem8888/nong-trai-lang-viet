# Terrain, land, fence and gate QA — 2026-11-05

**Latest QA correction:** A fixed-world-time rerun now gives matching 00:00, sunny, spring before/after images, including field closeups. The latest after 120-frame p50 is 16.7 ms on all three viewports; p95 is 18.5/18.4/18.2 ms and JS heap is 6.88/6.61/6.51 MB (wide/desktop/mobile). The real Edge browser zoom 125% gate remains unverified, so the status remains **INCOMPLETE**. Earlier live-clock figures and the parity gap below describe the preliminary run.

**Status: INCOMPLETE.** Baseline `702193372e551d8f7ed4619702b8391d18568219` on `main`; this implementation is shared for review at the user's request. No player database was reset or migrated. Browser fixtures use disposable SQLite databases.

## Implemented

- Original generated grass/path/soil atlas, dry/wet raised-bed sprites and transparent bamboo fence/gate sheet. The asset manifest records origins and use terms.
- Cached textured farm and surrounding ground, earth approaches following the existing house/field/pond/gate coordinates, and a transparent road overlay. The old diamond parcel pattern is no longer drawn on the farm scene.
- Owned crop plots use a meadow patch and a small modular sprite boundary. Locked plots retain natural ground; the next purchasable plot has a small `+` marker. The boundary is derived from authoritative `farming.state.tiles` on each render, so successful purchases, reloads and visitor snapshots update it. Crop stage and soil state remain server owned.
- Raised dry/wet furrow beds, existing seedling/growing/mature crop sprites, a cached perimeter bamboo fence and a gate joined to its two southern segments. The farm gate's existing navigation target remains `(720,855)`; the visual threshold is at the perimeter `(720,905)`.
- The contextual purchase option appears only for the next server-valid plot and remains unavailable to visitors.

The fixed perimeter marks the established farm property. Phase 5 expansion unlocks *building placement* within that property, whereas crop plot purchases change the small field boundary. Neither action changes the farm world rectangle. The new fences are visual; existing movement and placed decoration collision rules remain authoritative.

## Evidence

Images and metrics are at `D:\farm-terrain-qa` (they were moved off C after the disk filled). Comparable baseline and after images include `terrain-{before,after}-{wide,desktop,mobile}-{farm,field,market}.png`. Additional after closeups: `terrain-after-{wide,desktop,mobile}-field-closeup.png`. Baseline and after use the same viewport and fixture layout, but world clock and weather were live, so they are **not exact same-time comparisons**. The closeup adds a growing corn fixture and moves the player near the field.

After the final texture/boundary changes, the 120-frame Edge sample gave:

| Viewport | p50 frame | p95 frame | JS heap | Page errors |
|---|---:|---:|---:|---:|
| 1920×1080 | 16.7 ms | 18.1 ms | 9.90 MB | 0 |
| 1366×768 | 16.7 ms | 18.6 ms | 7.14 MB | 0 |
| 390×844 | 16.8 ms | 18.8 ms | 6.34 MB | 0 |

Baseline p50/p95 were 16.7/17.1 ms at all three viewports; baseline heaps were 5.44/5.04/4.73 MB. These are short active-scene samples, not long-term memory or low-end device measurements. The three after market screenshots show no scene rendering breakage. Manual image inspection found readable raised furrows and connected gate/fence; the surrounding grass remains visibly patterned on close inspection.

## Tests run

- `npm test`: 53/53 PASS.
- `node tests/browser-terrain-visual.mjs after`: three viewports, no page errors; screenshots and FPS/heap metrics above.
- `node --experimental-websocket tests/browser-plots-shop.mjs qa`: 7 browser checks, including real plot purchase, exact wallet charge, growth/reload and mobile shop. The first run without the Node 20 flag failed because `WebSocket` is not defined; rerun passed.
- `node tests/browser-contextual-qa.mjs`: 14 browser checks, including four-tile drag, mobile touch, visitor isolation and popup dismissal.
- `npm run qa:browser`: 14/14, including two accounts, farm/market travel, crop cycle, economy and collision.
- `npm run qa:vac`: 5/5.
- `npm run qa:phase5`: 13/13, including expansion/restart and 100-decoration FPS sample at 60.
- `npm run qa:phase6`: 12/12, including seasons, weather and two-client shared world state.
- `npm run qa:phase7`: 4/4, including visit, presence, movement, read-only UI and mobile; visitor FPS sample 56.

## Remaining Definition of Done gaps

1. **Real Edge browser zoom 125%** was not verified. `PHASE8_HEADED=1 node tests/browser-phase8-zoom.mjs` still reported `innerWidth=1366`, `devicePixelRatio=1` before and after two `Control+Equal` key presses, then failed. The contextual suite passed CSS zoom 125%, which is a different test.
2. **Resolved:** Before/after captures now use fixed world time, matching weather, season and camera, including field closeups. Night and rain are still covered by Phase 6 browser regression rather than paired terrain screenshots.
3. The field fence is visual only. The current game does not collide with the old property fence, and adding a collider would change established travel rules. A separate navigation/collision design decision and test would be needed before claiming a physically blocking fence.

Mandatory visual QA remains incomplete; sharing the code for review does not mark this work COMPLETE.
