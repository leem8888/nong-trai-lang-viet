# Living Farm visual QA — 2026-11-05

**Long benchmark result:** `living-bench-metrics.json` contains 60 ten-second samples spanning 600.01 seconds on desktop Edge with 3 fish and 2 chickens. Mean sample p95 frame was 18.84 ms, worst sample p95 26.6 ms. JS heap was 6.79 MB at the first sample, 10.10 MB at the final sample, peak 10.24 MB. At 200 ms latency and 50 KB/s download throttle, `/api/vac` returned HTTP 200 in 240 ms with 3 fish. Other browser regression suites were running during part of this benchmark, so this is a stressed shared-host observation rather than an isolated device benchmark. No page errors were observed.

**Status: INCOMPLETE.** Captures use disposable SQLite and Edge/Playwright. They are stored outside the repository at `D:\farm-terrain-qa\living` so no player data is included in Git.

| Viewport | Empty pond/coop | Stocked pond/coop | Page errors | Short p50/p95 frame |
|---|---|---|---:|---|
| 1920×1080 | `living-before-wide-*`, `living-after-wide-*` | same naming | 0 | 16.7/17.1 ms after |
| 1366×768 | `living-before-desktop-*`, `living-after-desktop-*` | same naming | 0 | 16.7/18.7 ms after, animated |
| 390×844 | `living-before-mobile-*`, `living-after-mobile-*` | same naming | 0 | 16.7/18.5 ms after |

For each viewport, `*` includes `pond-empty`, `pond-stocked`, `coop-empty` and `coop-stocked`. The original pond/coop baseline has fish/chickens painted into the sprite even when VAC is empty; the after art removes them. `living-fish-frame-{0,1,2}.png` and `living-chickens-frame-{0,1,2}.png` capture 0.9-second intervals with motion enabled. Visual inspection confirmed fish changed positions in water and chickens moved near the trough. Feeding and harvest effects have not yet received an equivalent frame sequence.

Automated checks so far: `npm test` 55/55; browser baseline 14/14; contextual 16/16 including direct stocking, feeding and harvesting; VAC browser 5/5; Phase 5 browser 13/13; Phase 6 browser 12/12; Phase 7 multiplayer 4/4. The 10-minute FPS/heap and throttled-network results are reported above. Direct-action screenshots are `.qa/living-direct-{stock-fish,add-chicken,feed-fish,harvest-fish,feed-chicken,collect-eggs}.png` in the game repository.
