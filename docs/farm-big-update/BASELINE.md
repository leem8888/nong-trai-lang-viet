# Farm 2.0 baseline

- Branch: `main`; HEAD before changes: `029dd86d1cc61b82ba7a40cdcd1da187ff7ee560`.
- Existing untracked file: `docs/BIG_UPDATE_FARM_2_0_IMPLEMENTATION_PLAN.md`. It was not edited.
- Baseline browser image: [Farm wide](evidence/before-farm-wide.png), captured by `tests/browser-plot-visual.mjs` at 1000×700 before code edits.

## Render and dependency map

| Surface | Current source | Risk when changing |
| --- | --- | --- |
| Grass outside Farm | `FarmTerrain.drawSurroundings` in `public/js/terrain.js`, terrain atlas pattern | Seam, camera zoom, canvas work |
| External road | `farm-surroundings-roads-v2.svg` via `drawIsometricFarm` in `public/js/main.js` | Gate alignment |
| Internal paths | `FarmTerrain.build` in `public/js/terrain.js`, cached Canvas strokes | Appearance versus collision geometry |
| Soil and ownership | `FarmingUI.draw` in `public/js/farming.js`; state from `server/crops.js` | Tile picking, purchase, crop states |
| House, pond, coop, fence | Image layers in `drawIsometricFarm`, `LivingFarmVisual.pondLayer`, `farmFence.js` | Occlusion, collision, interaction anchors |
| Fish and chickens | `livingVisual.js`, `animalMotion.js`; VAC snapshot from `server/vac.js` | False entities or reward feedback |
| Player movement | `Pathfinding.js`, `CollisionSystem.js`, `main.js` approach handling | Trapped player or invalid action range |

The baseline image shows a permanent trench/grid across unpurchased plots and flat internal paths. Existing fish, chicken, collision, purchase, ownership and multiplayer systems were retained as the implementation base.
