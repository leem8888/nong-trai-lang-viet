# Farm 2.0 visual evidence

The two wide images use the same `tests/browser-plot-visual.mjs` fixture, viewport (1000×700), player position and camera. The initial browser run stopped at a stale menu assertion after taking its first two images; its idle image is valid baseline evidence.

| Before | After |
| --- | --- |
| [Farm wide](evidence/before-farm-wide.png) | [Farm wide](evidence/after-farm-wide.png) |

After user feedback, both unpurchased and owned untilled plots are visible as raised beds. Unpurchased beds are light banana green across the whole face, owned untilled beds are brown, and tilled/planted beds retain their existing art. The purchase sign remains available. [Field close](evidence/after-field-close.png), [hover](evidence/after-plot-hover.png) and [purchased plot](evidence/after-plot-bought.png) were captured during a browser purchase that also verified the SQLite unlocked count.

Animal frame sequences from real browser QA: [fish 0](evidence/fish-0.png), [fish 1](evidence/fish-1.png), [fish 2](evidence/fish-2.png); [chicken 0](evidence/frame-0.png), [chicken 10](evidence/frame-10.png), [chicken 25](evidence/frame-25.png). The QA sampled fish positions and checked that they changed across the three frames; it sampled all four chickens 50 times and checked each against the yard boundary. [Mobile frame](evidence/mobile.png).

Follow-up browser evidence: [ready eggs on the coop nest](evidence/eggs-in-nest.png), [growing crop needing water](evidence/crop-needs-water.png), and [ripe crop shown as watered](evidence/crop-ripe-auto-watered.png).

Close before/after pairs for the gate, pond and coop at identical camera positions were not captured before edits. Feeding and harvest action videos were not captured. These missing artifacts prevent a COMPLETE verdict.
