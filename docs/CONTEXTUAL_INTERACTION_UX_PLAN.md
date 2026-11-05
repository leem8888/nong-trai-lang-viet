# NÔNG TRẠI LÀNG VIỆT — CONTEXTUAL INTERACTION & DRAG-TO-ACT UX

**Status:** APPROVED FOR IMPLEMENTATION (plan only)  
**Scope:** UX refactor after Phase 8; no new gameplay systems  
**Baseline:** Inspect current `main` HEAD before changing code. Do not assume a particular file layout or API.  
**Execution:** One AI coding run, sequential checkpoints, automated and real-browser QA.

## 0. Goal and non-goals

Replace the large persistent farming action toolbar (Cuốc, Gieo, seed selector, Tưới, Gặt and related controls) that obscures the farm with **contextual actions directly on world objects**. A player clicks/taps a soil tile, pond, chicken coop or production building and sees only actions valid for that object and current state. For soil, after selecting an action, the player can **press-and-drag across multiple tiles** to apply it in a batch.

**Do not** add new farming, VAC, economy, crafting or social mechanics; change balance, growth durations, inventory rules or farm ownership; redesign the game engine; or introduce deployment work. Preserve all existing server-authoritative validations, idempotency, save data, socket behavior and Phase 1–8 features.

## 1. Mandatory Gate 0 — audit and baseline

1. Read `README.md`, `GDD.md`, `HANDOFF.md`, `IMPLEMENTATION_PROGRESS.md`, relevant QA files, and the existing Phase 8 plan. Inspect the actual source for UI/HUD, Canvas pointer events, camera transforms, soil interaction, seed selection, VAC, buildings, Socket.IO, auth, inventory, server command handlers and tests.
2. Record current `git rev-parse HEAD`, clean/dirty status and working branch; do not overwrite user changes. Create a feature branch such as `feature/contextual-interaction-ux` if appropriate.
3. Run current automated tests and record exact commands/results. Capture desktop and mobile **before** screenshots showing toolbar occlusion; note the affected screen dimensions.
4. Document the current authoritative client/server action contracts, grid coordinate mapping, valid action/state transitions and how errors/receipts are handled. **Reuse existing commands** wherever possible.
5. If current implementation conflicts with this plan, adapt implementation to the actual architecture, document deviations and keep behavior intact. Do not pretend unexecuted QA passed.

## 2. UX principles and layout

- **World-first:** Remove the large permanent action toolbar from gameplay view. Do not merely hide it behind an equally large overlay.
- **Context-first:** Click/tap a target to open a compact, anchored contextual action menu near it. Show actions based on actual tile/object state, player permissions, resource availability and in-flight state. Disabled actions should explain why.
- **Unobstructed:** Position menu within safe viewport bounds; flip above/below target if necessary; avoid blocking the target, critical HUD, or mobile virtual controls. Close on outside click, Escape, changing scene, or successful action as appropriate.
- **Discoverable:** First-time micro-hint: “Chạm ô đất để thao tác. Chọn công cụ rồi giữ và kéo để làm nhiều ô.” Provide accessible tooltip/help entry; no repeated intrusive tutorial.
- **Compact utility navigation:** Keep Inventory, Crafting, Building, Decoration and Expansion reachable through compact responsive buttons/menu, not permanently expanded. Do not remove any capability.
- **Responsive:** Desktop mouse/keyboard and mobile touch; pointer target at least ~44 CSS px for touch; proper focus indicators, readable labels, safe-area handling.

## 3. Soil contextual action matrix

The table is a **behavioral intent**, not a substitute for the real state machine. Map it to existing server rules, including soil/crop states, watered state, inventory and cooldowns.

| Target state | Contextual action(s) | Notes |
|---|---|---|
| Valid untilled/empty soil | **Cuốc đất** | Only if existing till rules allow |
| Tilled, unplanted | **Gieo hạt** | Opens compact seed picker, displays owned quantity; remember selected seed during active gesture |
| Growing crop, unwatered | **Tưới**; **Xem cây** | Do not permit repeated watering if server disallows |
| Growing crop, watered | **Xem cây**; disabled **Đã tưới** if helpful | No redundant mutation |
| Harvest-ready crop | **Thu hoạch**; **Xem cây** | Harvest only when server says ready |
| Blocked/foreign/invalid tile | No mutating actions | Explain non-interactable reason; never send invalid bulk commands blindly |

If the existing code has additional valid states/actions, preserve them and document them. For **Gieo**, use existing inventory and seed type logic. If multiple seeds exist, choose before entering drag mode; show seed name and remaining quantity.

## 4. Pointer interaction state machine — REQUIRED

Define explicit UI states, e.g. `idle`, `contextMenuOpen`, `actionArmed`, `dragging`, `submitting`, `completed/cancelled`. Distinguish click/tap selection from drag-to-act. Use Pointer Events where supported, with `pointerId`, capture/release, cancellation, pointer-up outside canvas, and cleanup on unmount/scene change.

**Recommended desktop flow:**
1. Click soil tile -> compact action menu.
2. Click an action -> arm that action and visibly mark its icon/cursor.
3. Press on an eligible tile, hold and drag across adjacent or nonadjacent tiles -> preview selected tiles; release -> submit operations. Provide a quick single-tile execution path without requiring a drag.
4. Escape/right click/cancel button -> exit action mode. Show clear instruction while armed: “Kéo qua các ô để [hành động] · Esc để hủy”.

**Recommended mobile flow:**
1. Tap tile -> contextual menu; tap action -> arm.
2. **Long-press on tile** (e.g. ~300–450 ms, configurable) -> enter drag mode; moving finger paints a path; release -> submit. A quick tap while armed performs one tile action.
3. Panning remains possible when no action is armed. In armed mode, provide obvious **Hủy/Xong** controls; handle scroll/pan gesture conflict with deliberate thresholds and `touch-action` only on the game surface where needed.
4. No accidental mutation when user pans, pinch-zooms, opens a menu, or starts a gesture over UI. Two-finger gesture must not plant/harvest.

The precise press/drag thresholds must be verified in real-browser QA; do not assume `click` events alone can implement this reliably. If pointer begins on an invalid tile, do not unexpectedly mutate neighbors.

## 5. Batch operation rules and visual feedback

- Build a unique ordered set of grid tile coordinates from pointer path. Use grid interpolation (e.g. Bresenham/supercover) so quick movement does not skip tiles; deduplicate revisits.
- Restrict to the player's own farm and valid bounds. Never allow dragging across UI or into unrelated world objects to trigger soil mutations.
- Preview tile states with **valid**, **invalid**, **pending**, **success** and **failed** styling; keep visuals legible for color-blind users (icon/shape/text, not color alone).
- Show concise progress: `Đã chọn 8 ô · 6 hợp lệ`, then `Đã cuốc 6/8 ô` and reasons for skipped/failed tiles.
- Respect available seed quantities, resource limits, inventory capacity, rate limits and action prerequisites. If insufficient resources, execute only operations permitted by existing rules and report accurately.
- **Never implement client-only balance/inventory updates as truth.** Reuse authoritative server commands. If a new bulk endpoint is warranted, implement server-side validation per tile, bounds/ownership checks, a max batch size, idempotency key, atomicity semantics (all-or-partial explicitly chosen), bounded work, clear per-tile receipts, and tests. Prefer existing single-tile commands with a bounded queue when safer.
- Disable duplicate submission while request is pending; prevent double rewards/harvest after retry, reconnect or multi-tab. On partial failure, refresh authoritative tile/inventory state.
- Apply a reasonable max batch size (e.g. 25 tiles per gesture initially; tune after testing) and bounded network concurrency. Never issue hundreds of simultaneous socket requests.
- On disconnect, cancel active gesture, show retry/reconciliation message, and refresh from server; do not silently replay mutations without idempotency guarantees.

## 6. Other world objects — same contextual interaction pattern

### 6.1 Fish pond
- Tap/click pond -> compact menu with existing **Xem cá**, **Cho ăn**, **Thu hoạch cá** where valid; show fish counts, readiness and feed stock if already available.
- Reuse Phase 4 server rules. No accidental pond mutation when dragging soil. No invented bulk VAC action unless current game supports multiple independent ponds and it is safe.

### 6.2 Chicken coop
- Tap/click coop -> **Xem gà**, **Cho ăn**, **Thu trứng** as allowed; show ready egg count and available feed.
- Respect offline production, limits and existing authoritative state.

### 6.3 Production buildings, decoration and expansion
- Click building -> existing status, start/collect crafting or relevant interactions, with context-specific panels.
- Decoration move/rotate remains behind explicit edit mode so tapping decorative scenery does not accidentally move it.
- Expansion remains accessible via compact utility menu or relevant boundary interaction. Preserve existing costs and confirmation dialogs.

### 6.4 Multiplayer visiting
- Visiting another player's farm must be read-only for all mutating contextual actions, including forged requests, drag gestures, keyboard shortcuts and stale UI. Display a polite explanation.
- Test public/private/request/invite behavior and reconnection; never leak private farm state.

## 7. UI/visual details

- Prefer small radial, horizontal or popover action groups with icons **and Vietnamese labels**; use existing design tokens and Canvas/DOM layering appropriately.
- Anchor to world target via world-to-screen camera transform, updating on pan/zoom; clamp within viewport and mobile safe areas. Menu must not jump or drift.
- Context menu z-index must be above Canvas but below critical modal dialogs. All buttons must have visible active/disabled/loading states.
- Provide hover/focus/pressed feedback, subtle tile highlights and optional light sound; avoid excessive particles or animations.
- Ensure seed picker, inventory and utility controls remain usable at 320, 375/390, 768 and 1366 CSS px widths; verify browser zoom 125%.
- Keep frame budget: no DOM element per farm tile; use Canvas overlay for tile preview, invalidate efficiently, avoid heavy work on each pointermove.

## 8. Implementation checkpoints (single AI run)

**Checkpoint A — baseline & architecture:** Gate 0; UX state machine design; tests baseline; before screenshots.

**Checkpoint B — HUD simplification:** Remove obstructive toolbar; add compact utility access; ensure all old commands still reachable; smoke-test desktop/mobile.

**Checkpoint C — single-tile contextual interaction:** Hit-testing, anchored menu, soil state matrix, seed picker, validation, accessibility; integration tests.

**Checkpoint D — drag-to-act:** Pointer state machine, grid interpolation, dedupe, previews, cancellation, authoritative queue/bulk implementation, partial failure and reconnect handling; tests.

**Checkpoint E — VAC/buildings/social:** Pond, coop, production, decoration and visitor read-only integration; tests.

**Checkpoint F — visual polish & QA:** Screenshots after, browser playthrough, performance measurements, regression, documentation. Fix failures before advancing.

AI must execute all checkpoints in one assignment but report each checkpoint's result. If a blocker is encountered, record it and do not mark COMPLETE.

## 9. Mandatory automated test matrix

At minimum cover:

1. Context actions match tile state; invalid actions hidden/disabled.
2. Seed selection and inventory decrement; insufficient seed behavior.
3. Tap/click single tile executes once; double click cannot duplicate rewards.
4. Drag across 1, 5, 25 tiles; rapid pointer movement does not skip cells; revisit deduplicated.
5. Drag across invalid, blocked, out-of-bounds and mixed-state tiles; per-tile results accurate.
6. Mouse up outside canvas, pointercancel, Escape, route/scene change and modal opening safely cancel.
7. Touch long-press, swipe to pan, multi-touch and pinch do not accidentally execute actions.
8. Reconnect, request timeout, retry, multi-tab and concurrent mutations cannot dupe inventory/currency/harvest.
9. Pond feed/harvest and coop feed/egg collection honor existing rules.
10. Building and crafting still work; decoration edit mode does not collide with farm gestures.
11. Visiting another farm cannot mutate any owner data even with forged socket/API payloads.
12. Existing automated suites and database migration/integrity checks remain green. Do not add migration unless genuinely required.

## 10. Mandatory browser QA / user journey

Use a real browser automation tool when available. If not available, state the limitation and provide exact manual steps. Never claim a browser test was run when it was not.

- **Desktop** 1366×768: verify unobstructed farm, menus anchored, single-tile hoe/plant/water/harvest, 5-tile drag, rapid 25-tile drag, keyboard cancel, inventory/crafting/building access.
- **Mobile emulation** 390×844 and 375×667: tap actions, long-press drag, pan without action, pinch without accidental mutations, menus within screen, no hidden controls.
- **Other viewports** 320×568, 768×1024, zoom 125%; check scrolling and safe areas.
- **VAC** feed fish, collect fish, feed chickens, collect eggs; confirm numbers and persistence after reload.
- **Two-account** owner/visitor: visitor sees farm but cannot act on soil/pond/coop/buildings; owner actions still work, social features unchanged.
- **Error paths** empty seed stock, not-yet-ready crop, invalid tile, slow network, offline/reconnect, quick repeated gestures.
- **10–15 minute real gameplay journey** from login through farming, VAC, crafting and visit. Record blockers and UX confusion.
- Capture **before/after screenshots** at matched camera position/viewport. Record FPS and pointer interaction latency if measurable; report measured figures only.

## 11. Definition of Done (all required)

- [ ] Large permanent farming toolbar is removed from gameplay, and no capability is lost.
- [ ] Clicking/tapping soil shows only context-appropriate actions; seed picker works.
- [ ] Desktop press-and-drag and mobile long-press-and-drag support multi-tile hoe/plant/water/harvest as permitted by existing rules.
- [ ] Preview, cancellation, progress, per-tile result and error handling are understandable.
- [ ] Pond, coop and production buildings have compact contextual actions; decoration and expansion remain accessible.
- [ ] Visitor permissions and all server-authoritative protections remain intact; no duplication exploits.
- [ ] Desktop/mobile browser QA and multiplayer QA completed with evidence.
- [ ] Existing Phase 1–8 regression suites pass; no unintended data loss or gameplay changes.
- [ ] Documentation updated, screenshots captured, remaining limitations clearly listed.
- [ ] Final report includes actual git commit, modified files, exact test commands/results, browser evidence and unresolved issues.

## 12. Deliverables and Git policy

- Implementation in existing client/server modules; tests for new interaction and security cases.
- `CONTEXTUAL_UX_REPORT.md`: screenshots, reproducible scenarios, pass/fail, performance notes and known issues.
- Update `README.md` controls, `HANDOFF.md`, `IMPLEMENTATION_PROGRESS.md` and relevant QA checklist.
- Commit locally when all required checks pass. **Do not push or merge without user authorization.**
- If tests or browser tools are unavailable, say so; do not fabricate screenshots, measurements or completion status.

## 13. Ready-to-paste AI coding instruction

> Read `CONTEXTUAL_INTERACTION_UX_PLAN.md` fully. Implement the entire approved UX refactor in one working session, following Gate 0 and Checkpoints A–F. Replace the obstructive farming toolbar with contextual world-object actions and robust desktop/mobile drag-to-act for soil. Apply the same contextual pattern to pond, coop and buildings, preserving server authority, inventory, multiplayer permissions and Phase 1–8 behavior. Run automated tests and real-browser QA, fix issues, document evidence and commit locally only. Do not push/merge or claim COMPLETE if Definition of Done is unmet.
