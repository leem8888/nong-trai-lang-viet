# Báo cáo kiểm thử Phase 6 — 2026-11-03

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
