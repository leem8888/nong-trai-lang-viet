# Handoff Phase 6 — 2026-11-03

Trạng thái: hoàn tất ở môi trường phát triển. Branch `feature/phase-6-living-village`; commit triển khai `5858797` (SHA đầy đủ xem `git show 5858797`). Baseline Phase 5: `86b185948a1599ea7158e7a01ed311f200cbb3f0`.

## Đã triển khai

- `server/livingWorld.js`: đồng hồ thế giới 24 phút/ngày, thời tiết theo slot 8 phút và seed, bốn mùa 7 ngày thực/mùa; tính từ thời gian server, không ghi DB liên tục.
- `server/npcs.js`, `public/js/shared/npcs.js`: bốn NPC, lịch waypoint theo sáng/trưa/chiều/tối, fallback khi bị công trình chiếm, hội thoại theo trạng thái nhiệm vụ và mùa.
- `server/quests.js`, `public/js/shared/quests.js`: năm main quest tuần tự, hai side quest reset UTC, server ghi progress từ sự kiện gameplay đã xác thực; giao nông sản trừ kho, claim cộng ví và ghi audit trong một SQLite transaction. Request ID và hash payload ngăn nhận trùng.
- `server/db.js`: migration v6 append-only tạo `player_quests`, `quest_request_receipts`, `quest_reward_events`. `server/index.js` thêm `GET /api/village`, `POST /api/village/interact`, `POST /api/village/quest` với auth/CSRF/quyền/rate limit; `server/crops.js` hook harvest trong transaction cũ.
- `public/js/village.js`, `public/js/main.js`, `public/index.html`, `public/style.css`: HUD, sổ nhiệm vụ, NPC Canvas, palette mùa, ngày/đêm, mây/mưa, chế độ giảm hiệu ứng. Không sửa tốc độ cây/VAC/crafting/giá.

## Chạy, kiểm thử, rollback

`npm install`, `npm start`; `npm test`. Browser QA: đặt `PLAYWRIGHT_MODULE` tới Playwright cài sẵn, rồi chạy `npm run qa:phase6`, `npm run qa:browser`, `npm run qa:vac`, `npm run qa:phase5`. Xem `PHASE6_TEST_REPORT.md` cho số liệu thực tế.

Trước migration có backup `data/backups/farm-2026-11-03T09-45-42-594Z.sqlite` (schema v5, chứa cả WAL). Nếu cần quay về Phase 5, dừng server, lưu bản sao DB hiện tại, checkout commit Phase 5 và phục hồi backup bằng SQLite backup API; không chạy code Phase 5 trên DB schema v6.

Giới hạn: visual dùng hình Canvas tạm; chưa thử thiết bị cảm ứng thật hoặc tải dài hạn. Side quest được reset UTC; phần thưởng đã hoàn tất nhưng chưa claim trước nửa đêm UTC không thể claim ở ngày sau. Đây là quy tắc hiện tại cần cân nhắc playtest. `PROJECT_MASTER_CONTEXT.md` giữ cố định theo chỉ đạo dự án, tình trạng thật cập nhật ở progress/handoff. Không có chức năng Phase 7.
