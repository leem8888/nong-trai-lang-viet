# Phase 6 report: precheck, handoff, QA

---

## Phase 6 precheck — 2026-11-03

- Baseline: `main` commit `86b185948a1599ea7158e7a01ed311f200cbb3f0`; working tree chỉ có `Phase6.md` do người dùng cung cấp. Nhánh triển khai: `feature/phase-6-living-village`.
- Gate 0: `npm test` **29/29 PASS** trên Node 20.19.6. Trước migration đã chạy `npm run backup`, tạo `data/backups/farm-2026-11-03T09-45-42-594Z.sqlite` bằng SQLite backup API (bao gồm WAL).
- Kiến trúc thật: `server/index.js` xác thực cookie/CSRF và Socket.IO farm room; `server/db.js` migration v1–v5; `server/crops.js` transaction harvest; `server/economy.js` dùng wallet/ledger; `server/vac.js` và `server/phase5.js` có offline progress/receipt riêng. `public/js/main.js` điều khiển Canvas, camera, scene farm/market, HUD và input. Chợ hiện có quầy Cô Lan, chưa có nhân vật NPC có hội thoại; chưa có world clock/weather/season/quest.
- Tích hợp: thêm migration v6 append-only cho quest/receipt; một service world deterministic không cần DB write mỗi frame; một service NPC/quest dùng farm owner, scene và vị trí server; hook harvest **sau xác thực trong cùng transaction**. Client vẽ NPC và hiệu ứng qua Canvas cũ, không thay tốc độ cây/VAC/crafting/giá.
- Rủi ro chính: migration trên dữ liệu có WAL, retry claim song song, quest bị kẹt nếu nông sản đã bán, waypoint NPC trùng vật thể Phase 5, HUD mobile. Kiểm bằng bản sao database, test service/API và Edge browser trên SQLite tạm.
- Quyết định: giữ nhánh riêng để dễ review; world day 24 phút thực, weather slot 8 phút thực, mùa 7 ngày thực; tất cả chỉ visual/narrative. Side quest reset theo ngày UTC. Không sửa `PROJECT_MASTER_CONTEXT.md` vì đây là baseline thiết kế cố định theo yêu cầu người dùng; trạng thái thực tế ghi ở progress/handoff.

---

## Handoff Phase 6 — 2026-11-03

Trạng thái: hoàn tất ở môi trường phát triển. Branch `feature/phase-6-living-village`; commit triển khai `5858797` (SHA đầy đủ xem `git show 5858797`). Baseline Phase 5: `86b185948a1599ea7158e7a01ed311f200cbb3f0`.

### Đã triển khai

- `server/livingWorld.js`: đồng hồ thế giới 24 phút/ngày, thời tiết theo slot 8 phút và seed, bốn mùa 7 ngày thực/mùa; tính từ thời gian server, không ghi DB liên tục.
- `server/npcs.js`, `public/js/shared/npcs.js`: bốn NPC, lịch waypoint theo sáng/trưa/chiều/tối, fallback khi bị công trình chiếm, hội thoại theo trạng thái nhiệm vụ và mùa.
- `server/quests.js`, `public/js/shared/quests.js`: năm main quest tuần tự, hai side quest reset UTC, server ghi progress từ sự kiện gameplay đã xác thực; giao nông sản trừ kho, claim cộng ví và ghi audit trong một SQLite transaction. Request ID và hash payload ngăn nhận trùng.
- `server/db.js`: migration v6 append-only tạo `player_quests`, `quest_request_receipts`, `quest_reward_events`. `server/index.js` thêm `GET /api/village`, `POST /api/village/interact`, `POST /api/village/quest` với auth/CSRF/quyền/rate limit; `server/crops.js` hook harvest trong transaction cũ.
- `public/js/village.js`, `public/js/main.js`, `public/index.html`, `public/style.css`: HUD, sổ nhiệm vụ, NPC Canvas, palette mùa, ngày/đêm, mây/mưa, chế độ giảm hiệu ứng. Không sửa tốc độ cây/VAC/crafting/giá.

### Chạy, kiểm thử, rollback

`npm install`, `npm start`; `npm test`. Browser QA: đặt `PLAYWRIGHT_MODULE` tới Playwright cài sẵn, rồi chạy `npm run qa:phase6`, `npm run qa:browser`, `npm run qa:vac`, `npm run qa:phase5`. Xem `PHASE6_REPORT.md` cho số liệu thực tế.

Trước migration có backup `data/backups/farm-2026-11-03T09-45-42-594Z.sqlite` (schema v5, chứa cả WAL). Nếu cần quay về Phase 5, dừng server, lưu bản sao DB hiện tại, checkout commit Phase 5 và phục hồi backup bằng SQLite backup API; không chạy code Phase 5 trên DB schema v6.

Giới hạn: visual dùng hình Canvas tạm; chưa thử thiết bị cảm ứng thật hoặc tải dài hạn. Side quest được reset UTC; phần thưởng đã hoàn tất nhưng chưa claim trước nửa đêm UTC không thể claim ở ngày sau. Đây là quy tắc hiện tại cần cân nhắc playtest. `PROJECT_MASTER_CONTEXT.md` giữ cố định theo chỉ đạo dự án, tình trạng thật cập nhật ở progress/handoff. Không có chức năng Phase 7.

---

## Báo cáo kiểm thử Phase 6 — 2026-11-03

Môi trường: Windows, Node.js 20.19.6, Microsoft Edge headless qua Playwright có sẵn trong npm cache. Browser QA dùng SQLite tạm và đồng hồ server tiêm vào test; không thay đổi database người chơi.

| Nhóm | Kết quả | Bằng chứng |
|---|---|---|
| Baseline trước Phase 6 | PASS | `npm test`: 29/29 |
| Unit/integration sau triển khai | PASS | `npm test`: 34/34, gồm world boundaries, NPC, quests, quyền và claim đồng thời |
| Browser Phase 6 | PASS | `npm run qa:phase6`: 12/12 trên Edge; HUD, 2 client, 4 thời kỳ, 3 thời tiết, 4 mùa, 4 NPC, 5 main + 2 side quests, CSRF/replay, restart/mobile/console |
| Regression Phase 1–3 | PASS | `npm run qa:browser`: 14/14 |
| Regression VAC | PASS | `npm run qa:vac`: 5/5 |
| Regression Phase 5 | PASS | `npm run qa:phase5`: 13/13, FPS 60 với 100 decoration |
| Migration dữ liệu v5→v6 | PASS | `node scripts/phase6-migration-check.mjs data/backups/farm-2026-11-03T09-45-42-594Z.sqlite`: 1 user, 1 farm, 15 soil, 16 crop, 7 inventory, 1 wallet; mọi dòng giữ nguyên, integrity/FK OK, reopen idempotent |

Lệnh browser cần biến `PLAYWRIGHT_MODULE=file:///C:/Users/tuanbna.EDS/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/playwright/index.mjs` trên máy QA này. Ảnh chụp ở `.qa/phase6-*.png` (artifact cục bộ). Test kiểm tra không có JavaScript `pageerror`, mobile 390 px, reduced effects và tương tác chuột/bàn phím. Kiểm thử trực tiếp trên thiết bị cảm ứng vật lý và tải dài hạn chưa thực hiện; cần làm trước phát hành rộng.

Backup trước migration: `data/backups/farm-2026-11-03T09-45-42-594Z.sqlite`, tạo bằng SQLite backup API để gồm WAL. Không commit database người chơi hay backup.
