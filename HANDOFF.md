# Handoff

## Phase và trạng thái

Phase 2 — **partial**. Logic trồng trọt, inventory và tăng trưởng offline đã triển khai; test tự động đạt 9/9. Phase 1 vẫn **partial** vì chưa có QA trình duyệt thật.

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

## Schema

Migration v1 tạo `users`, `auth_sessions`, `farms`, `farm_objects`, `player_states`, `farm_permissions`, `schema_migrations`. Migration v2 thêm `farm_soil_tiles`, `farm_crops`, `inventory_items`, `farm_seed_claims`. Cây lưu timestamp, thời lượng, bonus và sản lượng riêng; chỉ một cây chưa thu hoạch mỗi ô. Migration là append-only.

Trước migration đã chạy `npm run backup`. `data/starter.sqlite` hiện là v2, không chứa user/session/farm; `data/farm.sqlite` sau migration vẫn có 1 user, 1 farm, 6 loại hạt và integrity `ok`. Database chơi cục bộ, không đưa lên Git. Khi tạo migration mới, cần cập nhật starter DB và kiểm tra migration từ database cũ.

## Kiểm thử

- `npm test`: 9 pass, 0 fail, Node.js v20.19.6, gồm Phase 1 và 2; test Phase 2 xác minh broadcast tới hai socket cùng farm.
- Kiểm tra khởi động bằng `createApp()` và listen cổng ngẫu nhiên: thành công.
- Chưa kiểm tra trực quan bằng trình duyệt: công cụ browser hiện trả về danh sách trống. Chưa xác nhận hai browser context độc lập.
- Kiểm tra cú pháp tất cả file `.js/.mjs`, HTTP health endpoint, static asset và `npm run backup`: thành công. Server chạy cổng 3001; cổng 3000 đang được dùng.
- `npm ci` trong thư mục tạm sạch: 124 package, 0 vulnerability, thành công. `npm ci` trong thư mục chính gặp `EPERM` do Windows giữ file native SQLite; module được khôi phục và test chạy lại pass.

## Vấn đề cần xử lý trước khi xác nhận DoD

1. Chạy `QA_CHECKLIST.md` trên trình duyệt thật: Phase 1 và Phase 2, đặc biệt click ô ruộng, HUD, reconnect, hai tài khoản và tải lại sau thời gian thực.
2. Rà soát bảo mật trước public deployment: proxy HTTPS, origin cho Socket.IO, giới hạn đăng ký và xử lý phiên hết hạn khi client đang mở.
3. Thời gian/sản lượng cây chỉ là giá trị thử nghiệm; cần playtest để cân bằng.
4. Asset Canvas hiện là hình tạm; cần art gốc khi tiến tới polish.

## Ngoài phạm vi

Tiền, chợ, ao, chuồng, crafting, social multiplayer và thanh toán đều để phase sau.

## Bước tiếp

Chạy `QA_CHECKLIST.md`, sửa lỗi quan sát được, cập nhật progress/handoff và chỉ đánh dấu Phase 1/2 hoàn thành khi có đủ bằng chứng. Chưa đủ điều kiện sang Phase 3. Prompt tiếp theo: “Đọc PROJECT_MASTER_CONTEXT.md, GDD.md, IMPLEMENTATION_PROGRESS.md, HANDOFF.md, QA_CHECKLIST.md; hoàn tất browser QA Phase 1–2 và sửa lỗi.”
