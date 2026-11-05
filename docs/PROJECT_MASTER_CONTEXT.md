# NÔNG TRẠI LÀNG VIỆT — PROJECT MASTER CONTEXT

## Trạng thái bổ sung — 06/11/2026

Đã cập nhật nhà v4, va chạm/điểm cửa, đường sân và cổng, bảng tên nhỏ, HUD responsive, xoài non xanh/chín vàng không nhãn nổi, cá trưởng thành sáng hơn và thẻ thông tin cây trồng có ảnh/tên/đếm ngược tự cập nhật. Schema vẫn v11, không reset dữ liệu. Node suite gần nhất 85/85 đạt; browser từng luồng và giới hạn kiểm thử ở [báo cáo cập nhật hiện tại](UI_GAMEPLAY_UPDATES_2026-11-06.md). Nội dung cũ phía dưới giữ theo giai đoạn; dùng báo cáo mới khi có mô tả khác nhau.

> **Version:** 1.1  
> **Date:** 2026-11-03  
> **Status:** Approved product direction; implementation status **unknown until repository inspection**.  
> **Purpose:** Single entry-point context for AI coding agents working on this project phase by phase.  
> **Language:** Vietnamese for game/UI/product documentation; English technical identifiers are acceptable.

---

## 0. MANDATORY INSTRUCTIONS FOR EVERY AI CODING SESSION

1. Read this file **completely** before planning or modifying code.
2. Inspect the actual repository and read `README.md`, `GDD.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md`, and relevant source files **if they exist**. This document specifies intent, **not evidence of completed implementation**.
3. Identify the **requested phase** and implement **only that phase**, plus strictly necessary fixes to existing foundations. Never silently implement later phases.
4. Preserve the decisions marked **LOCKED**. If a requirement conflicts with these decisions, explain the conflict and ask before changing it.
5. Propose a short execution plan, then implement working code, run available tests, inspect actual behavior, and document what was and was not verified.
6. Do not claim tests passed, a browser was checked, or a feature is complete without evidence.
7. Before finishing, update `IMPLEMENTATION_PROGRESS.md` and `HANDOFF.md` with completed tasks, remaining issues, test commands/results, migrations, and next-phase prerequisites.
8. Never modify the separate **SÂN MÂY** project. Reuse code only if source is available, compatible, and permitted.
9. Treat user data, ownership, money, inventory, crops and multiplayer mutations as **server-authoritative**.
10. If the user has not specified a phase, **ask which phase to work on**. Do not begin implementation based only on this context file.

### Suggested opening response from the coding agent

> Đã đọc PROJECT_MASTER_CONTEXT.md. Tôi sẽ kiểm tra repository và tài liệu hiện có, xác định trạng thái thực tế, sau đó thực hiện đúng Phase [N] theo yêu cầu. Tôi sẽ không tự ý triển khai các phase tiếp theo.

---

## 1. PROJECT IDENTITY — LOCKED

| Field | Decision |
|---|---|
| Working title | **Nông Trại Làng Việt** |
| Product | Commercial indie farming / life simulation game |
| Signature | Vietnamese countryside; interconnected **Vườn – Ao – Chuồng (VAC)** economy |
| Visual perspective | **2D top-down**, pixel-art-inspired |
| Platform first | **Web**, desktop browser first; responsive where practical |
| Ownership | **One independently owned farm per player account** initially |
| Social world | Shared village + visiting other players' farms |
| Crop growth | **Real elapsed time, including while offline** |
| Trading in initial release | **NPC-only**; no player-to-player trade |
| Business model | Prefer **one-time paid access** with a free demo; no payments in Phase 1 |
| Technical stack | **Canvas 2D + vanilla JavaScript ES Modules + Node.js + Express + Socket.IO + SQLite / better-sqlite3** |
| Relationship to SÂN MÂY | Independent new project; may reuse appropriate engineering concepts/modules |

**Non-goals for MVP:** MMO-scale shared world, player trading, microtransactions, gacha, pay-to-win, dozens of crops/animals, all seasons and festivals, complex irrigation simulation.

---

## 2. PRODUCT VISION AND DESIGN PILLARS

### Vision

Create a cozy, distinctively Vietnamese farming experience where each player inherits and develops a small countryside farm. Grow rice and vegetables, raise animals, manage a fish pond, process agricultural goods, fulfill orders at the village market, decorate a personal farm, get to know villagers, and visit friends.

### Design pillars

1. **VAC is meaningful gameplay:** Garden, pond and livestock interact through resources, byproducts and production decisions.
2. **Vietnamese identity is functional:** Rice paddies, tiled-roof houses, bamboo fences, brick yards, village markets, local foods and NPC stories influence gameplay, not merely visuals.
3. **Personal ownership:** Each player has an independent, persistent farm and controls access.
4. **Solo-first completeness:** The core game remains playable without friends; social features enrich it.
5. **Progress without punishment:** Offline crops grow; prolonged absence does not automatically destroy mature crops in MVP.
6. **Small polished loops before breadth:** Build enjoyable actions, satisfying feedback and reliable persistence before adding content volume.

### Primary gameplay loop

Plan production → prepare soil / plant / care → wait or do other activities → harvest → sell or process → complete NPC orders → reinvest in seeds, tools, structures and decoration → repeat with new choices.

### Target session (design hypothesis)

20–30 minutes of varied play; the player can leave at any time. This is a **design target to validate**, not a proven retention metric.

---

## 3. WORLD STRUCTURE

### 3.1 Personal farm

Each account has a unique `farmId` and owner. Starter farm includes a small tiled-roof house, brick courtyard, dirt paths, empty plots, bamboo fences, banana/bamboo trees, an area reserved for pond, and an area reserved for livestock. Over time the owner unlocks land and arranges buildings and decoration.

### 3.2 Shared village

Contains NPC market, seed store, carpenter/workshop, homes and social space. Supports player presence later; it is **not** an MMO commitment.

### 3.3 Optional exploration (post-MVP)

Bamboo grove, riverside, lotus marsh, distant fields, narrative discoveries. Do not build in Phase 1.

### 3.4 Farm access permissions

- **Private:** only owner unless specifically invited.
- **Friends:** friends can visit if enabled.
- **Public:** visiting allowed if enabled.
- **Assist:** explicit granular permissions (e.g., watering) granted by owner.

Owner alone can manage structures, inventory, sales and permissions in MVP. Visitors cannot harvest, sell, transfer items or move buildings by default. Authorization must be enforced server-side for each action.

---

## 4. CORE GAME SYSTEMS — TARGET DESIGN

### 4.1 Crop and rice cultivation

- Starter MVP target: **six crop types**, including rice and vegetables.
- Crop lifecycle: prepare plot → sow → grow → mature → harvest.
- Rice is a signature crop: prepare field, plant seedlings, maintain conditions, harvest; rice can be milled into grain plus byproducts.
- Growth parameters: server timestamp, crop definition, duration, care modifiers, maturity state and harvest eligibility.
- Plant visuals should show distinct growth stages and satisfying harvest feedback.
- In MVP, a mature crop remains harvestable while its owner is away; do not introduce punitive offline decay.

### 4.2 VAC

- **Vườn:** rice, vegetables and later fruit trees.
- **Ao:** fish production and a simplified relationship with water/garden systems.
- **Chuồng:** chickens first, eggs and useful byproducts; other livestock later.
- Resource loops: crops/byproducts support animals, animal products or organic inputs support production, fish and crops support market orders.
- Avoid overly realistic simulation in MVP.

### 4.3 NPC market and economy

- One in-game currency (working name **Đồng Làng**; name not final).
- Income from selling produce, fish, eggs, processed goods and fulfilling NPC orders.
- Costs include seeds, feed, buildings, upgrades and decorations.
- NPC-only market in MVP: base sale prices and a small set of special orders.
- **No P2P transfers, auction house or real-money currency** in initial release.
- Server validates all balances, quantities and trades transactionally; keep an audit trail for economic mutations.

### 4.4 Processing

- MVP: rice mill and at least one working production chain (rice → milled rice + byproduct).
- Later: tofu, fruit preserves, foods and more workshops.
- Processing should create a meaningful decision between selling raw material and investing time/resources to process it.
- All sample recipes, prices and durations are provisional and subject to balancing.

### 4.5 Construction and decoration

- Grid/tile-based placement, preview, collision and persistence.
- Vietnam-inspired assets: tiled roof, brick courtyard, bamboo fence, water jars, banana trees, trellis, lotus pond, village lanterns.
- MVP target: approximately **10–15** structures/decorations, subject to playtest and production capacity.
- Farm owner alone may place, move or remove objects unless a future explicitly authorized role is added.

### 4.6 Time, weather and seasons

**LOCKED:** Crop growth is based on real server elapsed time, including offline.

**Separate concept:** In-game visual day/night and season cycles need not be tied one-to-one to real-world time. Do not assume a 20-minute in-game day means crops grow 20 minutes of real time.

- MVP: visual day/night, one playable season, sunshine and rain.
- Later: four seasons, mist, storms and seasonal content.
- Farm seasons may progress independently; village event scheduling is a separate system.
- Exact season/calendar durations and weather modifiers are **not locked**; propose and validate before implementation.

### 4.7 NPC lives and stories

- MVP target: **three NPCs** with dialogue, useful roles and one short story arc.
- Suggested characters (working concepts): **Bác Tư** (rice/VAC mentor), **Cô Lan** (market trader), **Chú Bình** (carpenter).
- Later: schedules, relationship flags, branching stories and visible world changes.
- No requirement for AI chatbot NPCs.

### 4.8 Multiplayer

- Personal farm rooms and shared village room via Socket.IO.
- Phase 1 prepares authenticated room infrastructure only.
- MVP later supports visiting, presence and limited help such as watering.
- Multiplayer should not be required to finish core economic progression.
- Validate ownership, permission, position, interaction range, payloads and rates on server.

---

## 5. REAL-TIME OFFLINE PROGRESSION — ARCHITECTURAL CONTRACT

This is a core locked decision and must not be replaced by game-time-only growth.

1. Persist **UTC server-generated timestamps** (e.g., `plantedAt`) and deterministic growth parameters.
2. Determine elapsed time from authoritative server time when loading/interacting; do **not** create one live timer per offline crop.
3. Do not trust the client clock, submitted timestamps, or client-computed maturity.
4. A mature crop remains harvestable until a valid server-side harvest in MVP.
5. Harvest is idempotent/transactional: repeated or concurrent requests must not duplicate items.
6. For weather/care modifiers, store sufficient events or accumulated progress so offline results are deterministic. Do not depend on RAM-only weather state.
7. Handle server restart, reconnect, timestamp anomalies, invalid duration and concurrency.
8. Use a shared `TimeService` foundation in Phase 1; actual crop growth belongs to Phase 2.
9. Example only: planted 08:00, duration two hours, player logs in at 10:30 → mature. These durations are **illustrative**, not final balance.

---

## 6. TECHNICAL ARCHITECTURE — LOCKED STACK

### Client

HTML/CSS/vanilla JS modules; Canvas 2D renderer; game loop (`requestAnimationFrame`, delta time), camera, tilemap/layers, sprite animation, player controller, collision, interaction, HUD, network client, asset loader, responsive handling.

### Server

Node.js + Express for auth/bootstrap/API; Socket.IO for authenticated realtime rooms; modular services for farm, crop, inventory, economy, time, NPC and multiplayer. Server is authoritative for persistent state and permissions.

### Persistence

SQLite via better-sqlite3; migrations, foreign keys, indexes, prepared statements, transactions, WAL where appropriate, backup strategy. Never expose database or secrets in public assets. Do not write player position every render frame.

### Suggested module boundaries (names illustrative)

`FarmManager`, `CropSystem`, `AnimalSystem`, `PondSystem`, `SeasonSystem`, `InventorySystem`, `EconomyService`, `MarketService`, `CraftingSystem`, `BuildingSystem`, `NPCStoryEngine`, `MultiplayerService`, `TimeService`.

Use domain events where helpful (`crop.harvested`, `item.crafted`, `order.completed`, `building.placed`); avoid a single giant server/game file.

### Auth and security

- Account login appropriate for paid ownership; secure password hashing if password auth is used.
- Secure session cookies (`HttpOnly`, `Secure` on HTTPS, appropriate `SameSite`), CSRF defenses for cookie-authenticated mutations, session expiry and logout.
- Rate limit auth and Socket.IO actions; validate all payloads.
- Never trust user/farm IDs from client without authenticated authorization.
- Account recovery must be real, not a fake email workflow. If no mail service exists, document the limitation and define an integration interface.
- Add operational backup, error handling, and logging without secrets.

### Deployment assumptions

Web first. Production needs a durable Node.js hosting environment, HTTPS, database backups, observability, and capacity/cost testing. Cloudflare Quick Tunnel is for development demonstrations, **not** the production architecture.

---

## 7. MVP CONTENT BOUNDARY

The first playable MVP, across multiple phases, aims for:

| System | MVP target |
|---|---|
| Farm | One personal starter farm per account |
| Crops | Six types including rice |
| VAC | Fish pond + chicken coop |
| Processing | One rice milling chain |
| Market | NPC sales + approximately 5–8 orders |
| Building | Approximately 10–15 structures/decorations |
| NPCs | Three NPCs, one short story |
| Time/weather | Day/night, one season, sunny/rainy |
| Multiplayer | Farm visiting, presence, permissioned watering |
| Persistence | Reliable saves, reload, restart recovery |

These are **scope targets**, not evidence of implemented features or finalized numeric balance.

---

## 8. PHASE ROADMAP AND STRICT BOUNDARIES

### Phase 1 — Foundation, ownership, 2D engine

**Goal:** Browser game with account → personal farm → movement/collision → interactions → persistence → reconnect.

Deliver: project structure, auth/session, one-farm-per-user ownership, Canvas top-down renderer, camera, movement, starter map, three functional interactions, SQLite migrations, authenticated Socket.IO farm room foundation, UI and tests.

**Explicit exclusions:** Real planting/harvesting, full inventory, money, market, pond, livestock, crafting, four seasons, payments, social multiplayer gameplay.

### Phase 2 — Crops and offline growth

Prepare soil, sow, water, grow via UTC timestamps while offline, harvest, basic inventory, six crops, server-validated idempotent harvest and tests for offline progression.

### Phase 3 — NPC market and economy

In-game currency, seed shop, selling produce, NPC orders, transactional economic ledger, price balancing and basic NPC interactions.

### Phase 4 — VAC

Rice-field-specific flow, fish pond, chicken coop, eggs/fish and at least one connected VAC resource chain.

### Phase 5 — Processing and construction

Rice mill, recipe/job queue, placement/edit mode, structures, decorations, land expansion and persistence.

### Phase 6 — NPC, time and weather

Three NPCs, dialogue/story, schedules as appropriate, visual day/night, sunny/rainy weather, one playable season and compatible offline-growth rules.

### Phase 7 — Social multiplayer

Shared village, visits, invitations, farm visibility, authenticated room transitions, presence, permissioned assistance, reconnect/concurrency tests.

### Phase 8 — Polish and release validation

Art consistency, animation, audio, tutorial/onboarding, accessibility, performance, security, backups, economy balancing, playtests, demo and commercialization readiness. Payments may require a separate explicitly approved release task.

**Phase order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Changes require an explicit reason and user approval.

---

## 9. PHASE 1 DETAILED ACCEPTANCE CONTRACT

### Work packages

- **P1.1 Setup:** Independent repo, scripts, Express, Socket.IO, SQLite, migrations, health endpoint, environment and logs.
- **P1.2 Auth + ownership:** Account creation/login/logout, secure sessions, one farm per user, authorization and isolation.
- **P1.3 Engine:** Canvas loop, top-down player, camera, WASD/arrows, animation, collision, DPR/resize.
- **P1.4 Starter map:** Tiled-roof house, brick courtyard, dirt paths, empty plots, bamboo fence, trees, future pond/coop areas, info board.
- **P1.5 Interactions:** Distance-gated `E`/click, farm info board, house door/interior or panel, persisted gate/lamp toggle.
- **P1.6 Persistence + network:** Save/reload, server restart recovery, authenticated farm room, snapshots, reconnect and access checks.
- **P1.7 UI + QA:** Start/login/create-farm screens, HUD, loading/error states, docs, automated tests and two independent browser sessions if possible.

### Minimum tables (subject to sound schema design)

`users`, `auth_sessions`, `farms`, `farm_objects`, `player_states`, `farm_permissions`, `schema_migrations`.

### Definition of Done — all must be evidenced

- [ ] Server starts and health endpoint works.
- [ ] Two distinct accounts have distinct farms.
- [ ] Unauthorized access to private farm data is denied.
- [ ] Player movement, camera bounds and collision work.
- [ ] Starter map is navigable and visually recognizable as Vietnamese countryside.
- [ ] Three actual interactions work, including one persisted object-state change.
- [ ] Reload restores correct state.
- [ ] Server restart restores persisted state.
- [ ] Authenticated Socket.IO join/leave/reconnect and snapshot work.
- [ ] Malformed/unauthorized Socket.IO requests are rejected.
- [ ] Automated tests pass; browser test status is truthfully reported.
- [ ] `README.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md` are updated.

### Do not implement in Phase 1

Full crops, harvesting, inventory economy, NPC market, fish/chickens, crafting, four seasons, payments, P2P trade or complete social multiplayer.

---

## 10. GAME BALANCE AND CONTENT — NOT YET LOCKED

The following must be treated as hypotheses requiring playtest:

- Exact crop growth durations, harvest yields, watering bonuses and crop prices.
- Exact day/night cycle and season duration.
- Farm map dimensions and tile resolution.
- Number of concurrent players per farm/village room.
- Exact item/recipe catalogs and economy tuning.
- Full NPC dialogue/story content.
- Commercial price and release channels.

Do not invent finalized values and label them approved. Propose sensible configurable defaults and record assumptions.

---

## 11. MONETIZATION AND RELEASE

- **Preferred model:** one-time paid access to full game; free demo.
- **Web first:** validate browser experience, payment/access model and hosting economics before considering desktop packaging.
- **No pay-to-win, gacha or mandatory daily check-ins.**
- Payments, entitlement verification, refunds, taxes, privacy/terms and support processes require separate release planning.
- Candidate price points previously discussed (49,000 / 99,000 / 149,000 VND) were **illustrative survey options**, not an approved price or forecast.
- First commercial validation: playtest with people outside the development circle, measure whether they understand the game, complete the core loop, want to return and express willingness to pay.

---

## 12. QUALITY, TESTING AND ENGINEERING RULES

### Automated tests

Test auth, farm ownership, database migrations, save/load, interactions, collision, room authorization, reconnect, and later idempotent harvest/economic transactions. Include concurrency/duplicate-event cases.

### Browser validation

Use real browser sessions when available. For multiplayer, test two independent users/browser contexts. If tools are unavailable, report unverified behavior rather than claiming it works.

### UX

Vietnamese-language interface, readable font, consistent warm rural aesthetic, clear interaction feedback, loading/error states, keyboard support and future touch extensibility. Do not display fake inventory/currency UI before systems exist.

### Asset policy

Use original, licensed or clearly identified placeholder assets. Do not silently copy copyrighted game assets. Maintain consistent tile scale and sprite direction; no single flattened image as the entire interactive map.

### Performance

Avoid per-frame database writes, redundant Socket.IO broadcasts, excessive draw calls and expensive whole-map processing. Measure before premature optimization.

### Security and correctness

Use server-authoritative mutation, validation, access checks, transaction boundaries, idempotency where needed, session protections and secret-safe logs.

---

## 13. DOCUMENTATION AND CONTINUITY CONTRACT

Maintain these files at the project root:

| File | Purpose |
|---|---|
| `PROJECT_MASTER_CONTEXT.md` | Approved product context and AI operating rules (this file) |
| `GDD.md` | Detailed evolving game design, versioned |
| `README.md` | Setup, scripts, environment, running and testing |
| `IMPLEMENTATION_PROGRESS.md` | Phase/task status with evidence, not guesses |
| `HANDOFF.md` | Current state, changes, known bugs, next steps |
| `DECISIONS.md` (recommended) | Architecture/product decisions and rationale |

### Required end-of-phase handoff format

1. **Phase and status:** complete / partial / blocked.
2. **Implemented features:** concrete behaviors and file locations.
3. **Schema changes:** migrations and compatibility implications.
4. **Tests run:** exact commands, pass/fail counts and environment.
5. **Manual checks:** browser/device/account scenarios actually performed.
6. **Known issues:** severity and reproduction steps.
7. **Out-of-scope work deferred:** explicit list.
8. **Next phase readiness:** prerequisites and recommended next prompt.

Do not overwrite the approved product decisions without user consent. If the implementation differs, document the discrepancy and ask for resolution.

---

## 14. HOW TO USE THIS FILE WITH AI CODING

### First session / Phase 1

> Hãy đọc toàn bộ `PROJECT_MASTER_CONTEXT.md` và kiểm tra repository hiện tại. Sau đó triển khai **Phase 1** theo Master Prompt Phase 1 tôi cung cấp riêng. Tuân thủ ranh giới Phase 1, chạy tests, cập nhật `IMPLEMENTATION_PROGRESS.md` và `HANDOFF.md`. Không tự ý làm Phase 2.

### Subsequent phase

> Hãy đọc `PROJECT_MASTER_CONTEXT.md`, `GDD.md`, `IMPLEMENTATION_PROGRESS.md`, `HANDOFF.md` và kiểm tra source hiện có. Chỉ triển khai **Phase [N]** theo prompt chi tiết tôi cung cấp. Bảo toàn các chức năng phase trước, bổ sung tests và cập nhật tài liệu bàn giao. Không tự ý làm phase sau.

### Audit after each phase

> Hãy audit Phase [N] dựa trên `PROJECT_MASTER_CONTEXT.md`, acceptance criteria và source/test thực tế. Phân loại: hoàn thành có bằng chứng, thiếu, lỗi, chưa kiểm chứng. Ưu tiên sửa các lỗi blocking trước khi chuyển phase.

---

## 15. CHANGE CONTROL

This document is the **v1.1 baseline**. When the user changes product direction:

1. Record the request and reason in `DECISIONS.md`.
2. Identify impacted phases, schema, gameplay and tests.
3. Update the GDD and this master context with a new version.
4. Do not silently reinterpret a locked decision.

**Current truth:** This document records what the user wants to build. It does not prove that any phase is implemented. Only repository inspection and test evidence establish actual completion.
