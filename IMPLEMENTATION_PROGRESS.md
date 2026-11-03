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

Phase 1 vẫn **partial** vì chưa có QA trình duyệt thật. Test Phase 1 đạt 4/4; checklist Gate 0 ở `QA_CHECKLIST.md`.

## Phase 2 — partial

| Gói | Trạng thái | Bằng chứng |
|---|---|---|
| P2.0 Gate 0 | Một phần | Test Phase 1 pass; browser inventory rỗng nên QA trực quan chưa thực hiện |
| P2.1 Migration/registry | Đã triển khai và kiểm thử | Migration v2; sáu cây; database cũ còn 1 user/1 farm, integrity ok |
| P2.2 Đất/công cụ | Đã triển khai và kiểm thử logic | 15 ô; cuốc, gieo, tưới, thu hoạch có kiểm tra vị trí |
| P2.3 Offline growth | Đã triển khai và kiểm thử | UTC server, snapshot thời lượng, 4 giai đoạn, cây vẫn chín sau nhiều ngày |
| P2.4 Inventory | Đã triển khai và kiểm thử | Hạt và nông sản lưu SQLite; gieo/thu hoạch giao dịch; gói hạt giới hạn ngày |
| P2.5 UI | Đã triển khai, chờ browser QA | Toolbar, chọn hạt, hình cây, progress, túi đồ trong `public/js/farming.js` |
| P2.6 Network/security | Đã triển khai và kiểm thử | Auth, CSRF, quyền farm, khoảng cách, rate limit, Socket.IO broadcast tới hai tab |
| P2.7 QA/docs | Một phần | `npm test` 9/9 pass; browser QA chưa có |

`npm ci` cài sạch trong thư mục tạm thành công: 124 package, 0 vulnerability. Trong thư mục chính, Windows giữ file native SQLite nên `npm ci` không thay được; module đã được khôi phục và test chạy lại thành công. Server chạy trên cổng 3001, health và static trả 200; cổng 3000 đang có tiến trình khác.

`data/starter.sqlite` hiện chứa migration v2 và không có dữ liệu người chơi. `data/farm.sqlite` sau migration giữ 1 user/1 farm và có 6 loại hạt giống. Database chơi vẫn cục bộ. Chưa đủ bằng chứng để đánh dấu Phase 1 hoặc Phase 2 hoàn thành và chuyển Phase 3.
