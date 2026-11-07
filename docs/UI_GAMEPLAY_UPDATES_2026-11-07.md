# Cập nhật nông trại — 07/11/2026

Báo cáo này mô tả bộ thay đổi tiếp sau bản ngày 06/11. Các báo cáo và số liệu QA cũ được giữ làm lịch sử; không dùng chúng để xác nhận hình ảnh của bản hiện tại.

## Ruộng và thao tác

- Bỏ giới hạn chọn 25 ô mỗi lượt. Có thể kéo qua toàn bộ ô hợp lệ đã mở; ruộng hiện có tối đa 32 ô (8 × 4), không phải diện tích vô hạn.
- Nhân vật xử lý lần lượt từng ô, chờ hoạt ảnh cuốc/gieo/tưới/thu hoạch trước khi chuyển ô tiếp theo. Hủy thao tác không để hoạt ảnh cũ ghi đè trạng thái mới.
- Thanh công cụ tự đóng sau ba giây khi hết vật tư hoặc không còn ô hợp lệ.
- Ô mới mua đã được cuốc sẵn. Sau thu hoạch phải cuốc lại trước khi gieo vụ mới; lịch sử cây trồng vẫn được giữ.
- Thêm các bộ ảnh hoạt tác và chuyển động đi bộ, ổn định hướng quay theo hướng di chuyển thực tế.

## Chuối và cây ăn quả

- Mỗi farm có một khóm chuối, chu kỳ bốn giờ theo thời gian máy chủ, đổi giai đoạn mỗi giờ: khóm, hoa, quả nhỏ, quả lớn, chín vàng.
- Thu hoạch được 6 chuối, giá bán 8 Đồng Làng mỗi đơn vị; bắt đầu lại chu kỳ khi thu hoạch. Có kiểm tra chủ sở hữu, khoảng cách, sức chứa kho và chống nhận trùng.
- Chuối có trong snapshot khi thăm farm; thêm ảnh khóm, buồng xanh/chín, biểu tượng và hoạt ảnh với tay thu hoạch.
- Điều chỉnh hình ảnh và chuyển động thu hoạch xoài.

## Ao, sân gà và nhân vật

- Ao và chuồng cùng có sức chứa 10 con; điều chỉnh đường tiếp cận, vùng bấm và thứ tự vẽ sân gà để nhân vật không bị che sai.
- Cải thiện đường bơi, quay đầu, nhịp đuôi và phản ứng khi cho cá ăn; thêm ảnh cá chép và các bộ ảnh gà đi/mổ/quay đầu.
- Thu hoạch cá có lưới bung, chạm nước, kéo về cùng cá và giọt nước. Bỏ tay vẽ chồng lên nhân vật; thân trên lấy đà, nghiêng khi tung và ngả lại khi kéo. Dây lưới dùng cùng phép biến đổi với điểm bàn tay.

## Cảnh quan và va chạm

- Nhà dùng ảnh v5, cập nhật chân nhà, điểm cửa và va chạm dùng chung giữa client/server.
- Cập nhật đường đi, ranh giới farm, tìm đường, vị trí đèn/bảng tên, đất/cỏ, bụi cây và HUD.
- Thêm trẻ thả diều/đạp xe ngoài đường, có che khuất theo nhà hàng xóm.

## Dữ liệu và vận hành

- Schema v12 thêm `farm_banana_clumps`, `banana_receipts`; farm cũ được thêm khóm chuối, farm mới tạo khóm ngay khi khởi tạo.
- Schema v13 thêm `farm_spent_soil` để đánh dấu đất cần cuốc lại mà vẫn giữ liên kết lịch sử cây trồng.
- `data/starter.sqlite` được cập nhật cùng mã. Database chơi và các bản backup nằm ngoài Git. Khi chạy bản mới, máy chủ áp dụng migration còn thiếu; nên sao lưu database trước khi cập nhật máy đang chơi.
- Bộ ảnh v1/v2/v3 và prompt được giữ trong kho mã để tham chiếu; ảnh hiện dùng được chỉ định trong phần tải asset của game.

## Kiểm tra

- `npm test`: **129/129 đạt** ngày 07/11/2026, gồm API, ownership/CSRF, lưu trữ/migration, chuối, ruộng, đường đi/va chạm và logic hoạt ảnh.
- Kiểm tra cú pháp `public/js/main.js` và `public/js/contextual.js`: đạt.
- Chưa chạy lại bộ browser QA trong lượt cập nhật tài liệu này. Cú tung lưới mới chưa được xác minh trực quan trong trình duyệt; test logic không thay thế đánh giá hình ảnh.
- Các hạng mục nghiệm thu hình ảnh còn thiếu trong báo cáo Terrain/Living Farm trước đây vẫn giữ nguyên trạng thái chưa xác minh. Push mã lên GitHub không đồng nghĩa triển khai production.
