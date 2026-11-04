# Isometric remake architecture

## Coordinate contract

The server and SQLite keep the existing Cartesian world coordinates, tile IDs, collision rectangles, movement speed and scene names. The client projects them only for drawing and pointer hit testing. No migration is required.

`IsoProjection.js` maps a world point `(x, y)` to `(0.78 × (x − y + worldHeight), 0.39 × (x + y))`. Its inverse maps pointer positions back to world coordinates before `tileAt`, object hit testing, placement and movement. `Camera.toScreen` and `Camera.toWorld` share that projection. Farm and market use the same projection; each scene keeps its own world dimensions. CSS pixels are the camera input, while Canvas pixels scale with DPR (capped at 2).

## Render order and assets

The farm paints terrain and paths, then soil state and crop sprites, then depth-sorted world sprites by world Y. The static house, pond, coop, trees, production buildings, NPCs, remote visitors and player use transparent PNG assets. `upright()` applies the inverse of the isometric Canvas matrix around an object's ground anchor so a building or person remains upright. The market uses the same ground projection, stall sprites and NPC sprites.

The four-direction player sheet has four walk frames per direction. The player action sheet selects a hoe, sow, water or harvest pose after a successful server action. VAC fish and chicken motion is cosmetic and respects reduced effects. `public/assets/manifest.json` records each generated asset's role, origin and use terms. The original generated PNGs were packaged as local WebP files (quality 0.88, alpha retained), reducing the runtime pack from 26.4 MB to 5.3 MB. The game does not fetch third-party images. `scripts/optimize-isometric-assets.mjs` documents the packaging step for named regenerated PNG sources supplied through `ISO_ASSET_SOURCE_DIR`.

## Interaction and authority

`InputManager` converts a pointer to server-world coordinates via the camera, then delegates to `ContextualInteraction`. Contextual actions use existing Phase 1–8 APIs. Dragging interpolates grid cells, deduplicates them, caps a batch at 25 and sends each action sequentially; the server remains authoritative. Multi-touch cancels a gesture. Visitors cannot mutate soil, VAC or placed objects. `Phase5UI` still owns placement validation and a projected preview.

## Current limits

The original decoration catalogue still uses simple Canvas art. The isometric scene uses a depth sort for primary sprites, while decoration previews and some effects are drawn separately; exact occlusion at every overlap has not been proved. Crop/animal sprite motions are limited to the authored frames and gentle movement. Camera zoom and DPR testing is still being expanded, so this document describes the current implementation rather than a completed acceptance gate.
