# Chỉnh bố cục sân và hướng nhà — 05/11/2026

> Báo cáo lịch sử của phiên bản trước. Nhà hiện dùng **v4**, bảng tên và hiển thị xoài đã sửa tiếp. Xem [trạng thái hiện tại](UI_GAMEPLAY_UPDATES_2026-11-06.md); không lấy kích thước/asset cũ dưới đây để triển khai bản mới.

- Nhà: ảnh góc chéo từ trên xuống, bề rộng hiển thị 470px tại (790,160), giữ kiến trúc ba gian. Asset cuối: D:\Game\nong-trai-lang-viet\public\assets\farmhouse-v3.png.
- Bảng tên gỗ: giảm 30%, chữ khắc thu theo đúng mặt bảng; giữ điểm tương tác cũ.
- Cây xoài: chuyển từ (520,260) sang (400,220), đồng bộ hitbox, va chạm và kiểm tra khoảng cách server. Bỏ xe kéo trang trí ở vị trí cũ sát cây để tạo khoảng thoáng. Không thay đổi số lần hái, tiến độ hay sản lượng đã lưu.
- Lối đi: đường cong hẹp 44 đơn vị từ cổng tới bậc hiên, các nhánh 28–30 đơn vị. Điểm cửa dùng chung giữa client/server và nền đường.
- Va chạm nhà được vẽ lại theo chân nhà mới; giữ tìm đường vòng và khôi phục vị trí bị kẹt.

## Xác minh

85/85 bài kiểm thử đạt. Kiểm thử trình duyệt đi phím bốn hướng, nhấp chuột vòng nhà, khôi phục vị trí lưu và mobile đạt. Kiểm thử cây xoài kiểm tra bốn cấp, hái quả, đồng bộ hai tab, reload, bán tại chợ và menu mobile. Fixture dùng SQLite trong bộ nhớ, không sửa dữ liệu người chơi.

## Tạo hình

Dùng ImageGen tích hợp (built-in), chỉnh từ farmhouse-v2.png, transparent_background=true; giữ alpha của PNG. Giữ asset cũ để quay lại khi cần.

Prompt cuối (nguyên văn):

Edit target: the supplied Vietnamese three-bay rural farmhouse sprite. Preserve its architecture, terracotta roof, ochre plaster, timber doors and veranda, clay pots, woven baskets and warm painterly detailed 2.5D farming-game style. CHANGE CAMERA ORIENTATION substantially: true isometric game asset viewed from HIGH ABOVE at about 35 degrees elevation and rotated 40 degrees horizontally, see front facade facing diagonally DOWN-LEFT and the RIGHT gable side facing diagonally DOWN-RIGHT. Front facade baseline and roof ridge must slope UP to the right at approximately 26 degrees from horizontal, like the rising edge of an isometric diamond; right side baseline slopes DOWN to the right at approximately 26 degrees. All vertical posts remain vertical. Clear deep three-dimensional building volume, no almost-flat straight-on frontal view. Single-storey Vietnamese nha ba gian, broad veranda and three low stone steps facing down-left, compact generous proportions. Entire isolated building within frame including steps and pots, landscape 3:2 canvas, 7% transparent margins, no surrounding lawn or trees or people or text. Truly transparent background, actual alpha zero outside the silhouette including between objects. Keep house beautiful and legible at 470 pixels wide. Do not include any colored matte or landscape.

## Cách tải bản mới

Khởi động lại server để nạp vị trí và vùng va chạm mới, sau đó Ctrl+F5 trên trình duyệt.
