# Tiến độ triển khai

Cập nhật: 2026-11-03. Tài liệu này ghi tình trạng code thực tế; `PROJECT_MASTER_CONTEXT.md` là bản thiết kế cố định.

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P1.1 Setup | Hoàn thành ở mức development | `package.json`, `server/index.js`, `server/db.js`; health endpoint được kiểm thử |
| P1.2 Auth và ownership | Hoàn thành nền tảng | `server/auth.js`, `server/farms.js`; hai user/farm, CSRF, truy cập trái phép được kiểm thử |
| P1.3 Engine | Đã triển khai, chưa kiểm tra trình duyệt | `public/js/main.js` dùng các module di chuyển/camera/va chạm từ `san-may` |
| P1.4 Starter map | Đã triển khai, cần QA hình ảnh | Tile Canvas nhiều chi tiết, nhà, sân, ruộng, hàng rào, cây, chỗ ao/chuồng |
| P1.5 Interactions | Đã triển khai; đèn được kiểm thử server | Bảng, cửa, đèn; trạng thái đèn lưu SQLite |
| P1.6 Persistence/Socket.IO | Đã triển khai và kiểm thử tự động phần chính | Snapshot, room join/leave/reconnect, quyền, vị trí, đèn, mở lại database |
| P1.7 UI và QA | Một phần | UI tiếng Việt, loading/error cơ bản; chưa QA trên trình duyệt thật |

Lần chạy `npm test` gần nhất: 4/4 test pass trên Node.js v20.19.6. Kiểm tra cú pháp JavaScript, health endpoint và backup đều thành công. `npm install --package-lock-only` đã tạo lockfile đầy đủ qua registry; test ban đầu dùng dependency đã cài của `san-may`. Phase 1 chưa thể đánh dấu hoàn thành toàn bộ trước QA trình duyệt và rà soát bảo mật sâu hơn.

Database dùng chung trên Git: `data/starter.sqlite` chứa migration v1 và không có dữ liệu người chơi. Database đang chơi là `data/farm.sqlite`, được giữ cục bộ.
