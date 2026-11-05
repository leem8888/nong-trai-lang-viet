# Sửa lớp hiển thị quanh bờ ao — 2026-11-05

## Thay đổi

- Bỏ nút **Chi tiết ao** khỏi menu ngữ cảnh. Người chơi tiếp tục thả cá qua menu ao và cho ăn/thu hoạch bằng cách chọn cá.
- Chuyển ảnh ao (mặt nước và bờ đá vẽ sẵn) cùng cá sang lớp nền dưới nhân vật. Trước đây ảnh ao có depth cố định 1935, khiến nhân vật đứng ở một số phía bờ bị mặt nước che thân dù tọa độ vẫn ở ngoài vùng nước.
- Giữ nguyên vùng nước chặn di chuyển dùng chung giữa client và server; không cho nhân vật đi vào ao để xử lý lỗi hiển thị.
- Không thay schema, tiền, kho hay tiến độ người chơi.

## Kiểm chứng

- `npm test`: 74/74 PASS, gồm hai kiểm tra mới cho đường đi và thứ tự vẽ quanh cả ao lớn/nhỏ.
- `npm run qa:pond-rim`: PASS. Browser đi thật qua bờ trái, trước, phải và sau của cả hai kích thước ao; lấy 117 mẫu vị trí ở ao lớn và 118 mẫu ở ao nhỏ. Các mẫu chân đều ngoài vùng nước, không có pageerror, không còn nút Chi tiết ao.
- Đã xem ảnh browser ở bờ trái và bờ trước: nhân vật hiển thị đầy đủ, không bị ảnh mặt nước che thân.
- Bộ browser VAC được cập nhật để thao tác cá trực tiếp qua menu thay vì phụ thuộc nút Chi tiết ao đã bỏ.

Bằng chứng: `.qa/pond-rim/results.json`, ảnh `.qa/pond-rim/{large,small}-{left,front,right,back}.png` và `.qa/vac-fixed-results.json`.

Ảnh và test dùng farm thử riêng, không dùng dữ liệu chơi. Để nhận code JavaScript mới khi server đang chạy, tải lại trang bằng Ctrl+F5.

Ghi chú: Báo cáo triển khai mở đầu trước đó ghi nhận việc thêm nút Chi tiết ao; thay đổi này chủ động bỏ nút theo yêu cầu mới của người dùng.
