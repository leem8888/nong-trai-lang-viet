# Cập nhật tương tác và bố cục nông trại

## Thay đổi

- Chọn hành động trên ô đất, VAC, quầy chợ và công trình sẽ tự tìm đường tới vị trí thao tác rồi mới gửi yêu cầu. Quyền sở hữu, vật phẩm, trạng thái và khoảng cách tại lúc thực hiện vẫn do server xác nhận.
- Nhấp điểm đi bộ dùng tìm đường quanh vật cản. Chỉnh ngưỡng hoàn thành waypoint, xử lý chuyển động chéo và dùng cùng hình học va chạm cho công trình ở client/server để tránh bị kéo lùi tại góc.
- Thu nhỏ và đưa nhà chính sát mép bắc; cập nhật vùng cản và cửa nhà. Thêm hàng rào có lối cổng phía nam, cùng sprite gốc gồm ba kiểu nhà hàng xóm khác nhau.
- Cố định kích thước cửa hàng khi chuyển nhóm hàng; dialog mua/bán vẫn nằm trong khung cố định.

## Kiểm tra ngày 05/11/2026

- `npm test`: 53/53.
- Browser contextual: 14/14, gồm thao tác ô xa và kéo nhiều ô trên desktop/mobile.
- Browser chung: 14/14; VAC: 5/5; Phase 5: 13/13; Phase 6: 12/12; Phase 7 multiplayer: 4/4.
- Village Life: 14 kiểm tra qua, gồm kích thước cửa hàng giữa ba nhóm. Đồ họa farm chụp ở `.qa/phase8-neighbor-desktop-farm.png` và `.qa/phase8-neighbor-mobile-farm.png`; mẫu đo gần 60 FPS trên sáu viewport.

## Lưu ý

- Đường đi tự động có thể báo lỗi nếu đối tượng bị chặn hoàn toàn bởi các vật cản hoặc người chơi khác; không gửi hành động khi chưa đến được vị trí hợp lệ.
- Các ảnh `.qa/` là artifact kiểm tra cục bộ và không đưa vào Git.
