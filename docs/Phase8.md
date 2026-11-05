# PHASE 8 — PLAYER EXPERIENCE & GAMEPLAY POLISH

**Project:** Nông Trại Làng Việt  
**Baseline reference:** `origin/main` at commit `c867fa6` (Phase 7 handoff)  
**Status:** APPROVED IMPLEMENTATION PLAN — not a claim that Phase 8 is complete  
**Primary objective:** Make the existing game understandable, enjoyable, visually coherent, responsive and playable end-to-end by a first-time player.  
**Explicitly OUT OF SCOPE:** VPS, domain, DNS, Docker deployment, production HTTPS/WSS, CI/CD deployment, cloud monitoring, infrastructure scaling, payment monetization, major new gameplay, engine rewrite.

> This file is an executable instruction to an AI coding agent. Read the actual repository before making changes. Do not invent APIs, files, game mechanics or test results. Implement the complete phase in one work session, but use internal checkpoints and verify each before proceeding. The user has not yet personally played the game; optimize for a convincing first playthrough rather than production readiness.

## 0. Operating principles and acceptance contract

1. Preserve the architecture: Canvas 2D, vanilla JS ES modules, Node/Express, Socket.IO and SQLite as actually found in the repository. Do not introduce React, Phaser, Unity or an alternative engine.
2. Preserve all Phase 1–7 gameplay, progression, inventory, economy, ownership, permissions, quests, NPCs, weather, day/night, crafting, VAC and social visiting. No silent changes to gameplay formulas or economic balance.
3. All server-authoritative actions remain server-authoritative. UI polish must not move validation to the client or expose private farm data to visitors.
4. Prefer incremental improvements to existing renderers, styles and interaction handlers over duplicate systems. Avoid large rewrites.
5. Treat accessibility and reduced motion as first-class requirements. No mandatory animation delays; no audio autoplay before user gesture.
6. Keep old saves/accounts working. Prefer no DB schema changes; if unavoidable, provide additive migration, upgrade tests and rollback notes. Never reset production-like data.
7. Use coherent Vietnamese text and terminology: Đồng Làng, nông trại, gieo hạt, thu hoạch, v.v. Proofread accents and avoid untranslated debug strings.
8. **No fabricated QA:** automated tests and browser screenshots must actually be run. If tools/browser are unavailable, state BLOCKED and give reproducible manual steps.
9. Do not automatically push/merge; commit locally only when tests pass, and report commit SHA. Follow any stronger repository instructions.
10. The goal is polished usability, not more feature count. If a requested improvement conflicts with existing functionality, preserve functionality and explain the tradeoff.

## GATE 0 — Audit and baseline (mandatory before editing)

- Confirm `git status`, active branch and exact HEAD. Confirm the expected Phase 7 baseline exists in history; if main has advanced, use current HEAD and document differences.
- Read `README.md`, `GDD.md`, `PROJECT_MASTER_CONTEXT.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, `QA_CHECKLIST.md`, the Phase 7 plan/handoff if present, `package.json` and actual client/server modules.
- Inventory all scenes and existing interactions: registration/login, first spawn, farm movement/camera, soil/crops, inventory, market/orders, fish/chickens, crafting/building/decorating/expansion, NPC quests, day/night/weather/seasons and farm visiting.
- Identify the current rendering stack, sprites/Canvas shapes, audio, input handlers, UI overlays, mobile breakpoints, save/load and error handling. Record precise file paths and any missing features; do not assume prior plans were implemented verbatim.
- Run existing tests and record counts, failures and environment. Launch locally and capture **baseline** screenshots of key screens (desktop and mobile emulation), with viewport sizes and timestamps.
- Create a short `PHASE8_REPORT.md` (or section in handoff) describing UX problems, priority, reproducible steps and baseline screenshots. Screenshots should be stored in a sensible repo QA directory only if small and useful; do not commit giant recordings.
- Create a safe copy of local test SQLite DB before QA. Use separate test accounts and fixtures; never overwrite actual player data.
- **Gate decision:** proceed only if the baseline game can be started and main interactions inspected. Otherwise fix boot/blocking regression first and report.

## P8.1 — First-time player journey / onboarding

### Goal
A person who has never seen the game can create an account, enter the farm and complete their first meaningful gameplay loop without needing the developer to explain the controls.

### Requirements
- Improve account creation/login presentation: clear fields, validation, loading/disabled states, readable errors, success state and keyboard navigation. Do not alter authentication security model.
- First spawn: readable player name, clear spawn location, camera framing, unobstructed starting area and an obvious next action.
- Add a **lightweight, skippable and replayable** contextual onboarding layer using existing mechanics; do not introduce new economic rewards or quest systems. Prefer: move → interact with soil → plant → water (if required by current rules) → harvest → locate market or inventory. Adapt steps to actual initial inventory/seed rules; do not force an impossible sequence.
- Contextual controls: show action prompt near interactable target and concise tooltip for keyboard/mouse/touch. Explain controls only when relevant; avoid modal spam.
- Allow skip, close and later re-open via Help. Store tutorial completion in existing client preference storage if appropriate; if cross-device persistence requires DB migration, justify and test it.
- Never block veteran accounts with a mandatory tutorial. No tutorial prompts visible to other players as world objects.
- Clear empty states: no seeds, no harvest-ready crops, empty inventory, locked recipe, insufficient Đồng Làng; each state says what to do next without falsely promising an available action.
- Show progress feedback for server requests; prevent accidental repeated clicks, but server remains responsible for idempotency.

### Acceptance
- New account can finish the initial farming loop from an empty browser profile.
- Returning player is not forced through onboarding.
- All tutorial steps are possible with current game data and mechanics; no softlock on reload/reconnect.

## P8.2 — Core gameplay interaction UX (Phase 1–7)

### Movement and camera
- Smooth, predictable keyboard movement; avoid diagonal speed advantage if present. Camera follows without jitter and respects map boundaries.
- Visible interaction affordances, clear selected tile/object and valid/invalid action feedback.
- Avoid camera jumps after entering another farm, changing scene, reconnecting or resizing viewport.

### Farming and VAC
- Soil states are distinguishable: untouched, tilled, planted, watered, growing, ready and blocked (adapt to actual model). Do not rely solely on color; use shapes/icons/text cues where useful.
- Crop growth and remaining time displayed understandably; respect server UTC timing and offline progress. Never invent a timer that changes server results.
- Plant/water/harvest actions show brief non-blocking visual feedback and server-confirmed outcome.
- Pond/chicken coop controls clearly show feeding status, production readiness, stock limits and what resources are required.

### Economy, crafting, building
- Market/shop/order panels clearly show price, quantity, total, available balance, inventory capacity and confirmation/error state where applicable.
- Crafting shows input/output, remaining duration, building requirement and claim readiness; use actual server values.
- Placement/move/rotate/expand actions display a clear preview, collision/invalid placement indicators and cancel/confirm controls. Prevent accidental purchases and ambiguous destructive actions.
- Visitor mode visually communicates **view-only permissions**; hide or disable owner-only interactions and ensure server authorization remains intact.

### Acceptance
- Each core loop is usable without reading source/docs; success and failure have actionable Vietnamese messages.
- Repeated click, slow response, disconnect and insufficient resources never show fake success or create duplicates.

## P8.3 — Visual coherence and art polish

### Visual direction
- Consistent **cozy Vietnamese countryside** aesthetic: rice fields, bamboo, red-tile roofs, village paths, trees, ponds and market. Favor calm warm palette and clear silhouettes.
- Audit sprite sizes, outlines, line weight, shadow direction, tile/object scale and character-to-building proportions. Create a small `VISUAL_STYLE_GUIDE.md` documenting palette, pixel density, typography, shadow, outline, animation timing and icon conventions.
- Improve readability before decoration: paths, soil tiles, harvestable crops, interactable buildings and collision boundaries must be identifiable at normal zoom.
- Upgrade existing Canvas drawing / existing sprites rather than importing inconsistent stock imagery or changing engine. Do not mix crisp pixel art with blurry scaled textures; use integer scaling/pixelated rendering where appropriate.
- Add restrained environmental detail: subtle water ripple, leaf movement, crop sway, soft shadows and day/night color grading using current systems. Avoid excessive particles or distracting flashing.
- Make seasons and weather visually distinguishable without hiding gameplay objects; provide contrast-safe overlays and reduced-effects setting.
- Ensure NPCs, buildings and decorations maintain proper depth sorting and do not clip unnaturally into the player.

### Acceptance
- Capture before/after screenshots of the same farm positions, day/night and weather conditions at consistent viewport/zoom.
- No critical interactable becomes harder to see; no major texture tearing, flicker, z-order errors or stretched sprites.

## P8.4 — Character and animation polish

- Inspect existing player/NPC animation system before editing. Improve idle, walk in supported directions, facing, transitions and action-specific animations where existing mechanics already exist.
- Animation must correspond to real gameplay: tilling, planting, watering, harvesting, feeding, fishing/collecting, crafting interaction, building placement and social emotes as applicable. Prioritize a smaller set of convincing actions over dozens of poor effects.
- Provide grounded, short anticipation/action/recovery feedback without delaying server authority. If server rejects an action, do not leave the player in a false completed state.
- Correct anchor points, foot placement, held tools and sprite layering. Remote players must show correct facing, action and emote without creating duplicate avatars.
- Smooth remote movement within reasonable interpolation limits; never override server-authoritative position or permit client teleport exploits.
- Respect reduced-motion preferences; no rapid flashes or excessive camera shake.

### Acceptance
- Test local and remote avatar animations, idle, walk, action, emote, scene transition and reconnect; no stuck animation or phantom avatar.

## P8.5 — HUD, menus and responsive UI

- Define consistent typography, spacing, button states, icons, panels and dialogs. Use one UI visual language across farm, inventory, market, orders, VAC, crafting, building, NPC/quest and social screens.
- Keep the gameplay canvas visible; prioritize essential HUD information. Use collapsible/secondary panels instead of showing everything at once.
- Provide clear close/back controls, Escape handling on desktop, focus management for dialogs, keyboard-friendly navigation and accessible labels.
- Touch targets should be comfortably sized (aim >= 44 CSS px where practical), prevent accidental page scroll/zoom during canvas gestures and support portrait/landscape within realistic game constraints.
- Test at least desktop 1366×768 and 1920×1080, mobile 390×844 and 360×800, tablet 768×1024. Check browser zoom 125% and long Vietnamese labels.
- Ensure inventory/order/quest panels scroll independently, avoid clipping offscreen and never cover a mandatory action without a way to dismiss them.
- Toast notifications are brief, non-overlapping and meaningful. Provide a persistent place to review important results if existing UI supports it; do not add a new complex notification backend.

### Acceptance
- No unreadable text, overlapping critical controls, unreachable buttons, invisible dialogs or permanent scroll lock across target viewports.

## P8.6 — Game feel, audio and feedback

- Polish existing audio system with subtle cues for planting, watering, harvesting, coin transactions, crafting completion, NPC interaction and environmental ambience as appropriate. Use original/generated sounds or appropriately licensed assets; document provenance. Do not embed copyrighted music.
- Audio starts only after user interaction, supports mute and adjustable volume, remembers preference locally and does not play overlapping effects excessively.
- Use micro-feedback: gentle UI transitions, confirmation pulse, progress indicators, crop harvest particles and appropriate sound. Keep most nonessential animations short and cancelable.
- Tune perceived latency: immediate pending indicator, then authoritative success/failure; no client-side fake inventory/balance changes.
- Avoid coercive daily-login streaks, excessive popups, or reward spam. Maintain relaxing game pacing.

### Acceptance
- Every frequent action has clear visual feedback; audio can be muted completely; no autoplay or noisy repetition.

## P8.7 — Performance, stability and accessibility

- Instrument FPS/frame time and draw/update cost in development mode; do not expose intrusive debug overlay by default.
- Measure baseline and after using the same device/browser/scene/number of actors. Report median FPS and 95th percentile frame time, plus memory trend when feasible. Do not invent results.
- Optimize obvious Canvas bottlenecks: offscreen caching for static layers, image reuse, particle caps, culling, allocation reduction, event listener cleanup and device-pixel-ratio caps as supported by current architecture. Optimize only when profiling justifies it.
- Support reduced effects/low graphics quality setting for weaker devices. Never degrade interaction readability.
- Check visibility/background tab behavior, resize, reconnect, repeated scene entry, repeated popup open/close and prolonged play for leaks or duplicated listeners.
- Maintain readable contrast, text alternatives for color-only states, keyboard focus visibility, sensible semantic HTML for UI overlays and `prefers-reduced-motion` behavior.
- Target smooth interaction on desktop and usable mobile emulation; define performance thresholds from measured baseline and device capability, not unsupported universal FPS promises.

### Acceptance
- No reproducible severe frame drops, runaway memory, stuck input, broken reconnect or listener multiplication in supported QA environments.

## P8.8 — Real player journey testing (most important gate)

**Use a fresh account and play as an actual beginner, not just call endpoints.** Run end-to-end browser QA with screenshots or video evidence if browser automation is available.

### Scenario A — First 10 minutes
1. Open landing page, register/login, enter world.
2. Understand movement, identify a useful target, perform first farm action.
3. Plant and water as required; inspect progress and inventory.
4. Visit market/NPC; understand price, resources and next goal.
5. Open/close help, inventory and quest panel; reload and confirm state persists.

### Scenario B — Existing account / longer play
1. Return after simulated offline time with controlled test timestamps or existing supported test helpers.
2. Harvest and sell; verify wallet/inventory.
3. Feed/collect VAC, craft/claim, build/decorate, expand when fixtures permit.
4. Talk to NPC, inspect quest, observe weather/day-night/season visuals.
5. Confirm error/empty states: insufficient funds, full capacity, blocked placement, action denied.

### Scenario C — Multiplayer
1. Log in as two separate accounts/browsers.
2. Request/invite/approve visit under each privacy mode; enter another farm.
3. Verify movement/emotes, visitor-only UI, private data isolation and rejected owner-only operations.
4. Test kick, disconnect/reconnect, browser refresh and multiple tabs.
5. Confirm no ghost player, duplicated event, cross-account inventory leak or stale room membership.

### Scenario D — Responsive and accessibility
1. Repeat critical first-play path at desktop, tablet and mobile viewport sizes.
2. Test mouse, keyboard and touch emulation; check text wrapping and focus behavior.
3. Test mute, reduced motion, low graphics mode, browser zoom and poor network throttling when tools permit.

### QA evidence
- Record test environment, exact commit, commands, test accounts (no passwords), screenshots and observed vs expected outcomes.
- Create `PHASE8_REPORT.md` with scenario-by-scenario PASS/FAIL/BLOCKED, severity, reproduction steps and evidence paths.
- For real phone testing not possible in agent environment, explicitly mark **NOT TESTED ON PHYSICAL DEVICE** and provide a concise manual checklist. Do not conflate emulation with real-device QA.

## P8.9 — Automated regression and data integrity

- Run all existing automated tests unchanged first, then add targeted tests for new onboarding, UI state helpers, error handling and any new client logic that can be tested reliably.
- Re-run Phase 1–7 regression for economy, inventory, crafting, VAC, quests, world state, permissions and Socket.IO social visits.
- Verify repeated requests cannot duplicate items, money, rewards or build placements. Never rely on disabled buttons as a security control.
- Verify reload, reconnect, multiple tabs, offline progression, account migration and visitor data privacy.
- If schema changed, test upgrade from actual v7 fixture/copy, SQLite foreign keys/integrity and data preservation; document backup/restore. Otherwise state **NO DB MIGRATION**.
- Fix regressions before declaring complete. A high test count does not compensate for broken first-play UX.

## Implementation sequence — one AI run, internal checkpoints

1. **Checkpoint 0:** Gate 0 audit, baseline test run and screenshots.
2. **Checkpoint 1:** P8.1 onboarding and P8.2 core gameplay UX; verify new-player loop.
3. **Checkpoint 2:** P8.3 art direction and P8.4 character animation; capture visual comparison.
4. **Checkpoint 3:** P8.5 UI/responsive and P8.6 game feel/audio; desktop + mobile QA.
5. **Checkpoint 4:** P8.7 performance/accessibility; benchmark before/after.
6. **Checkpoint 5:** P8.8 end-to-end player journeys and P8.9 full regression; fix blockers.
7. **Checkpoint 6:** Update docs, prepare handoff, commit locally and report exact status. Do not push unless authorized.

At each checkpoint: run relevant tests, inspect browser console/server logs, fix regressions and record what changed. Do not merely claim a checkpoint is done because code compiles.

## Definition of Done — all mandatory

- [ ] Baseline audit and evidence documented; actual HEAD and architecture confirmed.
- [ ] A first-time player can register, move, plant, water/harvest as rules permit and understand the next action without external guidance.
- [ ] Returning player has an unobstructed experience; onboarding is skippable and replayable.
- [ ] Farming, market, VAC, crafting, building, NPC quests and social visiting have clear actionable UI feedback.
- [ ] Art style and visual scale are consistent; screenshots demonstrate meaningful improvements without loss of clarity.
- [ ] Local and remote player animations work without stuck states, jitter or duplicated sprites.
- [ ] HUD/dialogs are usable at specified desktop/tablet/mobile viewports.
- [ ] Audio is optional, controllable and not autoplayed.
- [ ] Performance measured before/after with real values and test conditions; major regressions resolved.
- [ ] End-to-end Scenario A/B/C/D results recorded, including failures or blocked items honestly.
- [ ] All existing automated tests and critical Phase 1–7 regression checks pass.
- [ ] Existing accounts and SQLite data preserved; migration documented if necessary.
- [ ] `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, `QA_CHECKLIST.md` and `PHASE8_REPORT.md` updated with evidence.
- [ ] No production deployment work, new major gameplay or unapproved engine rewrite added.
- [ ] Local commit created only after gates pass; final response includes SHA, files changed, tests, screenshots, unresolved risks.

## Severity and release gate

**BLOCKER / NO-GO:** Cannot enter game; new player softlocked; loss/corruption of saves; broken inventory/wallet; unauthorized visitor changes; major mobile UI impossible to use; multiplayer identity/privacy leak; repeated crash; existing tests failing without justified fix.

**MAJOR / FIX BEFORE COMPLETE:** Frequent animation freeze, unreadable UI in core loop, major FPS regression, broken keyboard/touch action, repeated sound spam, unclosable dialog, tutorial impossible to skip.

**MINOR / DOCUMENT:** Small decorative mismatch, noncritical particle issue, rare cosmetic transition flaw with workaround. Track as follow-up with reproduction steps.

**Decision labels:** `COMPLETE` only if all mandatory DoD pass; `COMPLETE WITH DOCUMENTED MINOR ISSUES` only if no blocker/major and user can play end-to-end; otherwise `INCOMPLETE` with exact failing gates.

## Required final handoff format

1. **Baseline and scope:** branch, baseline SHA, final SHA, files/modules audited.
2. **What changed:** P8.1–P8.9, concrete files and visible behavior.
3. **Visual proof:** before/after screenshot paths and viewport details.
4. **Tests:** exact commands, counts, pass/fail, browser scenarios, 2-account multiplayer.
5. **Performance:** measured FPS/frame times, device/browser, before/after, low-quality mode.
6. **Data/security:** DB migration yes/no, existing save compatibility, server authority retained.
7. **Outstanding issues:** severity, steps to reproduce, physical-device limitations.
8. **Verdict:** COMPLETE / COMPLETE WITH DOCUMENTED MINOR ISSUES / INCOMPLETE.
9. **User playtest instructions:** how to start locally and a 10-minute Vietnamese checklist for the owner to play the game personally.

## Copy-paste command for AI coding agent

> Đọc toàn bộ `Phase8.md` trong thư mục gốc repository Nông Trại Làng Việt. Tôi phê duyệt triển khai **toàn bộ Phase 8 — Player Experience & Gameplay Polish** trong một lượt. Trước tiên thực hiện Gate 0, xác minh HEAD và baseline Phase 7 `c867fa6`, chạy test hiện tại và chụp ảnh trước khi sửa. Sau đó tự triển khai tuần tự P8.1–P8.9 theo checkpoints, viết code thực tế, chạy browser QA, chơi thử bằng tài khoản mới và tài khoản cũ, kiểm thử hai tài khoản multiplayer, đo FPS trước/sau và sửa mọi regression. **Tôi chưa từng trực tiếp chơi game, nên ưu tiên tuyệt đối trải nghiệm lần đầu, đồ họa, animation, UI, thao tác và cảm giác chơi; KHÔNG làm deploy/VPS/Docker/domain/HTTPS production, KHÔNG thêm gameplay lớn.** Giữ nguyên Phase 1–7, không mất dữ liệu, không tự push/merge. Cuối cùng cập nhật handoff/QA, tạo local commit khi đạt DoD và báo cáo trung thực các test chưa chạy được. Không dừng lại ở việc lập kế hoạch.
