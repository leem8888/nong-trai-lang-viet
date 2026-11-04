# Báo cáo kiểm thử Phase 7 — 2026-11-04

Môi trường: Windows, Node.js 20.19.6, Microsoft Edge headless qua Playwright cache có sẵn. Test browser tạo SQLite tạm và ba tài khoản riêng; không dùng DB chơi. Biến chạy browser: `PLAYWRIGHT_MODULE=file:///C:/Users/tuanbna.EDS/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/playwright/index.mjs`.

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Baseline trước sửa | PASS | `npm test` 34/34; Edge `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13 |
| Unit/integration sau sửa | PASS | `npm test` 36/36; hai test Phase 7 bao gồm private/search/CSRF, request/approve/replay, invitation, room và snapshot không lộ kho/ví, move/seq/collision, emote cooldown, kick/revoke, multi-tab, reconnect, session hết hạn, 8 khách và giải phóng chỗ khi disconnect |
| Browser Phase 1–6 sau sửa | PASS | `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13; không có `pageerror` trong luồng cũ |
| Browser Phase 7 | PASS | `npm run qa:phase7` 4/4: ba tài khoản, tìm farm private, request/duyệt, ghé thăm, thấy khách, di chuyển, biểu cảm chủ/khách, kick, về farm mình, đổi private, restart, viewport 390×844, không `pageerror` hoặc tràn ngang |
| Migration v6→v7 | PASS | `node scripts/phase7-migration-check.mjs data/backups/farm-2026-11-03T15-25-11-123Z.sqlite`: 1 user, 1 farm; dữ liệu Phase 1–6 giữ nguyên; `integrity_check=ok`, 0 lỗi FK, mở lại idempotent |
| Starter DB | PASS | schema v7, 0 users/farms/sessions, integrity/FK OK |
| FPS khách thăm | PASS trong máy QA | Edge headless 1280×800, hai client, đo `requestAnimationFrame` 1,2 giây: 59–60 FPS qua hai lượt. Baseline Phase 6 cùng máy từng đo 60 FPS ở scene khác; đây là kiểm tra khói, chưa chứng minh tương đương frame-time p95 |

Ảnh: `.qa/phase7-visit.png` (desktop khi thăm), `.qa/phase7-mobile.png` (viewport 390×844). Ảnh dùng tài khoản thử và bị Git bỏ qua. Đã xem cả hai ảnh.

**NOT RUN:** thiết bị cảm ứng vật lý, nhiều trình duyệt/thiết bị thật, HTTPS production, tải kéo dài và đo CPU/RAM/latency ở tải sản xuất. Giới hạn 8 khách đã được kiểm thử bằng 10 socket cùng lúc; chưa phải chứng nhận capacity cho production. Kick cooldown ở RAM nên bị xóa khi restart; quyền riêng tư và lời mời vẫn được kiểm tra lại từ SQLite.
