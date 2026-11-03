# Handoff

## Phase và trạng thái

Phase 1 — **partial**. Bản game và backend đã có thể khởi động; test tự động hiện pass. Chưa có bằng chứng kiểm tra trình duyệt thật.

## Đã triển khai

- Auth, cookie session, CSRF, farm ownership, API: `server/auth.js`, `server/farms.js`, `server/index.js`.
- Migration SQLite và backup: `server/db.js`, `server/backup.js`.
- Database khởi đầu được version hóa: `data/starter.sqlite`; lần chạy đầu sao chép thành `data/farm.sqlite`.
- Server time UTC: `server/time.js`.
- Canvas map, player, camera, di chuyển, va chạm và ba tương tác: `public/js/main.js`, các module trong `public/js`.
- Socket room owner-only, snapshot, vị trí và trạng thái đèn: `server/index.js`.

## Schema

Migration v1 tạo `users`, `auth_sessions`, `farms`, `farm_objects`, `player_states`, `farm_permissions`, `schema_migrations`. Migration là append-only; khi sửa schema hãy thêm version mới.

`data/starter.sqlite` không chứa user/session/farm; `data/farm.sqlite` là dữ liệu chơi cục bộ, không đưa lên Git. Khi tạo migration mới, cần cập nhật starter DB và kiểm tra migration từ database cũ.

## Kiểm thử

- `npm test`: 4 pass, 0 fail, Node.js v20.19.6.
- Kiểm tra khởi động bằng `createApp()` và listen cổng ngẫu nhiên: thành công.
- Chưa kiểm tra trực quan bằng trình duyệt: công cụ browser hiện trả về danh sách trống. Chưa xác nhận hai browser context độc lập.
- Kiểm tra cú pháp tất cả file `.js`, HTTP health endpoint và `npm run backup`: thành công.
- Lần `npm install --offline` đầu thất bại vì cache trống; `npm install --package-lock-only` qua registry sau đó thành công. Đã sao chép `node_modules` từ `san-may` để kiểm thử ban đầu. Thư mục này bị git bỏ qua; máy mới dùng `npm ci`.

## Vấn đề cần xử lý trước khi xác nhận DoD

1. QA trình duyệt: đăng ký, tạo farm, di chuyển, camera, bảng/cửa/đèn, reload, logout/login, resize và hai tài khoản.
2. Kiểm tra reconnect và hành vi khi mất mạng bằng trình duyệt; test socket hiện bao gồm kết nối lại bằng session cũ và snapshot.
3. Rà soát bảo mật trước public deployment: proxy HTTPS, origin chính xác cho Socket.IO, giới hạn đăng ký và xử lý phiên hết hạn khi client đang mở.
4. Asset Canvas hiện là hình tạm; cần art gốc khi tiến tới polish.

## Ngoài phạm vi

Trồng/thu hoạch, inventory, tiền, chợ, ao, chuồng, crafting, social multiplayer và thanh toán đều để phase sau.

## Bước tiếp

Chạy `npm start`, mở trình duyệt và hoàn tất các mục QA trên. Sửa lỗi quan sát được, bổ sung kiểm thử reconnect, sau đó cập nhật tài liệu này và đánh dấu Phase 1 hoàn thành nếu toàn bộ DoD có bằng chứng. Prompt tiếp theo: “Đọc PROJECT_MASTER_CONTEXT.md, GDD.md, IMPLEMENTATION_PROGRESS.md, HANDOFF.md; hoàn tất QA và các mục còn thiếu của Phase 1.”
