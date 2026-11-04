# Isometric remake progress — 2026-11-04

**Status: INCOMPLETE.** Branch `feature/contextual-interaction-ux`; local changes are not committed, pushed or merged. This checklist follows `ZING_FARM_COMPLETE_REMAKE_PLAN.md` and its Definition of Done.

| Gate | Current result | Remaining work |
|---|---|---|
| CP0 audit/baseline | Source, server coordinate flow and baseline tests audited; before screenshots in `.qa/context-before-*` | Baseline video and exact-state comparison for six scenes |
| CP1 isometric prototype | Farm/market projection, inverse pointer mapping, camera and browser soil/VAC/placement flows work; 100-point camera matrix × 5 viewports × 4 zoom factors passes | True browser zoom and full occlusion audit |
| CP2 assets/environment | Original house, pond, coop, trees, crops, market stall, NPC and production sprites integrated; manifest present | Replace primitive decoration catalogue; review all seasons and object scale |
| CP3 characters/animals/VFX | 4×4 player walk sheet, four action poses, distinct NPCs, VAC animal motion, Y-sorted primary sprites | NPC walk/action frames, occlusion around all decorations/buildings, VFX review |
| CP4 HUD/context | Compact dock, unified panels, soil/VAC/building/NPC context and desktop/touch drag implemented | Complete visual review of every popup and menu under real browser zoom |
| CP5 QA/performance | Final regression passed: 40 automated tests, Phase 1–7 browser suites, 17 panels × 5 viewports, 20-minute two-account journey, QA video, network tests, and 10-minute DPR2/100-decoration benchmark | True browser zoom, full video/occlusion review, 100 real browser hit targets, and matched before/after scene evidence |

Do not mark this remake COMPLETE or create a local commit until all Definition of Done gates are met. The Phase 1–8 server and SQLite data model have not been changed in this branch.
