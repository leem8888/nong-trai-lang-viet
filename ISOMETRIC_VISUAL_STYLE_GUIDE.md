# Isometric visual style guide

- **Art direction:** original Vietnamese countryside cartoon, warm terracotta roofs, bamboo/wood details, jade UI and parchment panels. Do not use copyrighted Zing Farm art.
- **World grid:** authoritative Cartesian farm 1440×1024, market 1200×800, placement cell 48 world units. Projection coefficients are 0.78 horizontally and 0.39 vertically; the original soil footprint remains 70×42 world units with 82×55 spacing.
- **Sprite anchors:** ground contact at the bottom center of each transparent sprite. Camera and hit areas use world coordinates, never the PNG's transparent bounds. Production buildings use their server footprint for placement and bottom edge for sorting.
- **Scale:** farmhouse 485×323 screen-independent projected units, pond 290×193, coop 245×164, player 78×86, NPC 72×92. Scale is multiplied by camera zoom. These are visual sizes, not collision footprints.
- **UI:** `public/ui-theme.css` is the shared design layer for auth, farm creation, HUD, compact dock, contextual menu, panels, controls, notifications and responsive breakpoints. HUD shows current land level and five main quest progress rather than invented XP. Auth introduces a default character visually without adding persisted character data.
- **Animation:** player walk sheet 4 directions × 4 frames at 135 ms per frame; successful soil actions show authored poses for 750 ms. Fish/chicken use subtle position motion and stop when reduced effects are enabled. Weather and time overlays remain driven by server world state.
- **Assets:** local WebP/SVG files and roles are listed in `public/assets/manifest.json`; output is original for this project under applicable OpenAI output terms. WebP alpha is preserved. No hotlinks.

Visual review should check silhouette at 360, 390, 768, 1366 and 1920 CSS pixels, zoom 125%, name legibility, panel overflow, clipping behind HUD, crop stage recognition and overlap of player/NPC with objects. A virtual mobile viewport is browser emulation, not a physical device test.
