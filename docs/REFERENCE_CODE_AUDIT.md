# Sân Mây reference code audit

Status: read-only reference. The requested `C:\Users\tuanbna.EDS\Documents\Code\san-may` path was unavailable after the drive cleanup; the same local repository was available at `D:\Documents\Code\san-may`. No GitHub clone or modification was made. Sân Mây HEAD `e05d67fa6dfafc8618339625f4f504afbcd0369f`, clean working tree. Farm HEAD before this work `702193372e551d8f7ed4619702b8391d18568219`, with uncommitted Terrain/Land/Fence/Gate changes already in progress.

| Sân Mây source | Farm destination | Decision and reason | Verification |
|---|---|---|---|
| `public/js/systems/Pathfinder.js` A* and safe-segment checks | `public/js/systems/Pathfinding.js`, `public/js/main.js` | Adapt the approach pattern; retain farm isometric projection and existing A* rather than copying top-down coordinates. | Eight starts for pond and coop in `tests/livingPathfinding.test.js` |
| `public/js/systems/CollisionSystem.js`, `server/services/worldActions.js` | `public/js/shared/livingLayout.js`, `server/world.js` | Rewrite with farm pond, yard and placement geometry; the server remains authoritative. | 55/55 Node tests, Phase 5 browser 13/13 |
| `public/js/core/Game.js`, `public/js/core/InputManager.js`, `public/js/systems/InteractionSystem.js` | `public/js/contextual.js`, `public/js/main.js` | Adapt tap → navigate → interact; keep farm's drag-to-act and visitor rights. | VAC browser 5/5; contextual regression pending final rerun |
| `public/js/rendering/ParticleSystem.js`, `public/js/multiplayer/Interpolation.js` | `public/js/livingVisual.js` | Learn local time-based motion and bounded feedback. Rewrite in the farm style; no animal coordinates sent per frame. | Three-frame fish and chicken sequences in `D:\farm-terrain-qa\living` |

No Sân Mây art, code module, audio or map was copied into the farm. The farm sprites were generated specifically for this project and are listed in `public/assets/manifest.json`. No license in the reference repository was assumed to grant reuse.
