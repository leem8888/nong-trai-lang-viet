# Handoff — nghiệm thu Phase 1–3

Cập nhật 2026-11-03. Phase 1, 2, 3: **complete ở môi trường phát triển**, đạt Definition of Done tương ứng. Có thể bắt đầu Phase 4 sau khi đọc `PROJECT_MASTER_CONTEXT.md`, `GDD.md`, `IMPLEMENTATION_PROGRESS.md` và tài liệu này. Không sửa `PROJECT_MASTER_CONTEXT.md`; đó là thiết kế cố định.

## Tình trạng code

- Phase 1: auth/session/CSRF, farm riêng, Canvas 2D, di chuyển/va chạm/camera, bảng/cửa/đèn, Socket.IO, SQLite v1.
- Phase 2: 15 ô đất, 6 cây, tưới, 4 giai đoạn, thời gian server UTC kể cả offline, inventory, thu hoạch atomic, SQLite v2.
- Phase 3: ví Đồng Làng, chợ Canvas, quầy hạt/thu mua, 6 đơn hàng một lần/farm, giá featured theo ngày UTC, transaction ledger, idempotency receipt, SQLite v3.
- Source chính: `server/index.js`, `server/db.js`, `server/crops.js`, `server/economy.js`, `public/js/main.js`, `public/js/farming.js`, `public/js/market.js`.
- `data/starter.sqlite` version 3, không chứa user/farm/session/wallet. `data/farm.sqlite` là dữ liệu chơi cục bộ và bị Git bỏ qua. Đã backup trước migration v3 ở đợt trước.

## Bằng chứng nghiệm thu

- `npm test` trên Node.js 20.19.6: **16 pass, 0 fail**. Bao gồm migration/restart, offline growth, sáu cây, atomic/rollback, kho/ví giới hạn, hai socket, CSRF/ownership, idempotency, sáu mẫu đơn, và biên nhận giao dịch sau khi rời chợ.
- `npm run qa:browser` với Playwright và Edge 156 headless: **14 nhóm PASS, 0 FAIL**. Hai tài khoản/farm, đăng nhập lại, WASD, collision nhà, ba tương tác E, chuột cuốc/gieo/tưới/gặt, túi đồ, farm↔chợ, mua/bán, giao đơn, hai tab mua cùng ID chỉ trừ một lần, lịch sử, thiếu tiền, CSRF/ownership, console và mobile layout.
- Browser QA dùng SQLite tạm; ảnh chợ desktop và farm 390 px đã được xem. Không có `pageerror`; viewport 390 px có `scrollWidth=390`. Chi tiết từng nhóm và giới hạn ở `QA_CHECKLIST.md`.
- Trên máy nghiệm thu, Playwright không thuộc dependency nhưng có bản trong npm cache. Đặt `PLAYWRIGHT_MODULE` tới module đó rồi chạy `npm run qa:browser`; hoặc cài Playwright tạm bằng `npm install --no-save playwright`. Edge path mặc định có thể đổi qua `EDGE_PATH`.
- Browser QA tăng tốc thời gian chờ cây bằng cách lùi `planted_at` trong database thử, sau đó reload; các bài test tự động xác nhận mốc UTC và cây chín sau nhiều ngày. Test restart/reopen dùng database tạm, không dừng server chơi của người dùng.

## Lỗi đã sửa trong đợt nghiệm thu

- `farm:interact` trước đây chỉ đọc tọa độ, nên người chơi ở scene chợ có thể gửi socket event bật đèn farm nếu tọa độ gần đèn. Server giờ đọc cả `scene` và dùng `inRange` theo scene. Test regression ở `tests/phase3.test.js`.
- Bổ sung test giới hạn sáu đơn, replay receipt sau khi rời chợ, và kịch bản browser có thể chạy lại ở `tests/browser-qa.mjs`.

## Giới hạn và bước tiếp

- Chưa chạy trên thiết bị cảm ứng vật lý, mạng chập chờn kéo dài hoặc môi trường production HTTPS. Cần kiểm tra riêng trước phát hành public; không chặn bắt đầu Phase 4.
- Giá và thời gian cây là giả thuyết playtest; art Canvas còn tạm. Không coi các số liệu này là cân bằng cuối cùng.
- Phase 4 chỉ nên bắt đầu sau khi đọc master context và xác định đúng phạm vi VAC; không mở rộng sang processing/construction hoặc social của phase sau.
