# Handoff

## Phase và trạng thái

Phase 3 — **partial**. Ví, chợ NPC, đơn hàng và giao dịch đã triển khai; test tự động đạt 15/15. Phase 1–2 vẫn **partial** vì chưa có QA trình duyệt thật.

## Đã triển khai

- Auth, cookie session, CSRF, farm ownership, API: `server/auth.js`, `server/farms.js`, `server/index.js`.
- Migration SQLite và backup: `server/db.js`, `server/backup.js`.
- Database khởi đầu được version hóa: `data/starter.sqlite`; lần chạy đầu sao chép thành `data/farm.sqlite`.
- Server time UTC: `server/time.js`.
- Canvas map, player, camera, di chuyển, va chạm và ba tương tác: `public/js/main.js`, các module trong `public/js`.
- Socket room owner-only, snapshot, vị trí và trạng thái đèn: `server/index.js`.
- Migration v2 cho đất, cây, túi đồ và gói hạt: `server/db.js`.
- Sáu cây và thời gian thử nghiệm: `public/js/shared/crops.js`.
- Giao dịch cuốc/gieo/tưới/thu hoạch và tính thời gian server: `server/crops.js`; API trong `server/index.js`.
- Toolbar, hình cây bốn giai đoạn, tiến trình và túi đồ: `public/js/farming.js`, `public/js/main.js`, `public/index.html`, `public/style.css`.
- Ví, giá, mua/bán, đơn hàng, biên nhận retry và lịch sử: `server/economy.js`, `server/marketConfig.js`.
- Scene chợ, cổng chuyển cảnh và giao diện quầy/đơn: `public/js/shared/marketMap.js`, `public/js/market.js`, `public/js/main.js`.
- Báo cáo lợi nhuận thử nghiệm: `scripts/economy-report.mjs`.

## Schema

Migration v1 tạo tài khoản/farm/session. Migration v2 thêm đất, cây, túi đồ và gói hạt. Migration v3 thêm `wallets`, `economy_transactions`, `economy_request_receipts`, `player_orders` và `player_states.scene`. Tài khoản cũ nhận ví 200 Đồng Làng một lần. Các giao dịch tiền/hàng/đơn/receipt cùng một transaction; migration là append-only.

Trước migration v3 đã chạy `npm run backup`. `data/starter.sqlite` hiện là v3, không chứa user/session/farm/wallet; `data/farm.sqlite` sau migration vẫn có 1 user, 1 farm, 6 loại hạt, 1 ví và integrity `ok`. Database chơi cục bộ, không đưa lên Git.

## Kiểm thử

- `npm test`: **15 pass, 0 fail**, Node.js v20.19.6, gồm Phase 1–3; test Phase 3 xác minh ví, mua/bán, retry, rollback, đơn hàng, lịch UTC, migration, restart, CSRF và chuyển cảnh socket.
- Kiểm tra khởi động bằng `createApp()` và listen cổng ngẫu nhiên: thành công.
- Chưa kiểm tra trực quan bằng trình duyệt: công cụ browser hiện trả về danh sách trống. Chưa xác nhận hai browser context độc lập.
- Kiểm tra cú pháp tất cả file `.js/.mjs`, HTTP health endpoint, static asset và `npm run backup`: thành công. Server Phase 3 chạy cổng 3002, `/`, `/js/market.js`, `/js/shared/marketMap.js` trả 200.
- `npm run economy:report`: 6 cây có lợi nhuận dương theo giá thử nghiệm; lúa dẫn lợi nhuận/vụ, đậu nành dẫn lợi nhuận/giờ.
- `npm ci` trong thư mục tạm sạch: 124 package, 0 vulnerability, thành công. `npm ci` trong thư mục chính gặp `EPERM` do Windows giữ file native SQLite; module được khôi phục và test chạy lại pass.

## Vấn đề cần xử lý trước khi xác nhận DoD

1. Chạy `QA_CHECKLIST.md` trên trình duyệt thật cho Phase 1–3, đặc biệt di chuyển farm ↔ chợ, NPC, mua/bán, đơn hàng, layout và hai tài khoản.
2. Rà soát bảo mật trước public deployment: proxy HTTPS, origin cho Socket.IO, giới hạn đăng ký và xử lý phiên hết hạn khi client đang mở.
3. Thời gian cây, giá và phần thưởng đơn là giá trị thử nghiệm; cần playtest để cân bằng.
4. Asset Canvas hiện là hình tạm; cần art gốc khi tiến tới polish.

## Ngoài phạm vi

P2P, chuyển tiền giữa người chơi, ao, chuồng, crafting, social multiplayer, thanh toán và NPC story nâng cao chưa triển khai.

## Bước tiếp

Chạy `QA_CHECKLIST.md`, sửa lỗi quan sát được, cập nhật progress/handoff và chỉ đánh dấu Phase 1–3 hoàn thành khi có đủ bằng chứng. Chưa đủ điều kiện sang Phase 4. Prompt tiếp theo: “Đọc PROJECT_MASTER_CONTEXT.md, GDD.md, IMPLEMENTATION_PROGRESS.md, HANDOFF.md, QA_CHECKLIST.md; hoàn tất browser QA Phase 1–3 và sửa lỗi.”
