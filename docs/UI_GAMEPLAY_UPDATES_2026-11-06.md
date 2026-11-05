# Cập nhật giao diện và tương tác — 06/11/2026

Tài liệu tổng hợp trạng thái mã hiện tại sau các lượt sửa ngày 05–06/11/2026. Các báo cáo theo giai đoạn giữ lại để đối chiếu lịch sử; khi khác nhau, dùng trạng thái hiện tại trong tài liệu này và mã nguồn.

## Nhà, nền sân, bảng tên và cổng

- Nhà hiện dùng `public/assets/farmhouse-v4.png`, hiển thị 480 × 300 tại (790,160). Thay bản v3 có mái/thân lệch phối cảnh; mái liền, cột đứng, mặt tiền rộng và thấp. Prompt và quy trình tạo hình ở [HOUSE_V4.md](HOUSE_V4.md).
- `public/js/shared/house.js` dùng chung hình học chân nhà, độ sâu vẽ, điểm cửa `HOUSE_DOOR` cho client/server và nền đường. Điểm cửa hiện là `houseToWorld(.43,.98)`.
- Dùng đa giác chân nhà để chặn đi xuyên và đặt công trình chồng nhà; tìm đường vòng; vị trí lưu bị kẹt được đưa ra chỗ an toàn.
- Đường làng `farm-surroundings-roads-v2.svg` chạy ngoài hàng rào, clip loại phần đất bên trong. `terrain.js` vẽ lối sân cong, rộng 44 đơn vị; nhánh 28–30 đơn vị, nối tới hiên theo điểm cửa chung.
- Bảng gỗ tại (570,430) còn 105.4 × 89.9; tên farm khắc trên mặt bảng và thu theo cùng tỷ lệ, không phải nhãn HTML nổi.
- Cổng ở hàng rào nam được căn theo độ dốc chiếu `ISO_Y/ISO_X`, trụ giữ thẳng; bỏ vùng xóa hình chữ nhật gây hở rào. Giữ điểm chuyển cảnh `FARM_GATE` (720,855), hình cổng neo (720,905). Kiểm tra nhấp cổng đi tới chợ thành công.

## HUD và thanh thao tác

- `public/farm-hud.css`: bảng màu kem, viền gỗ, số dư nền xanh; dock có biểu tượng và tên Túi đồ, Nhiệm vụ, Xây dựng, Bạn bè.
- `public/js/hud-layout.js` theo dõi kích thước header bằng ResizeObserver và cập nhật vị trí thanh thời gian/thời tiết, tránh chồng khi header xuống dòng.
- Kiểm tra 1920×1080, 900×800, 390×844 và 320×740; mở menu, túi đồ và nhiệm vụ đạt.

## Cây xoài

- Cây chuyển sang (400,220), cập nhật va chạm thân theo tọa độ chung; bỏ xe kéo trang trí sát vị trí cây để mở khoảng trống.
- Asset `mango-tree-leaves-v2.png` chỉ có thân/lá, không có quả vàng vẽ sẵn. Canvas vẽ quả non xanh với kích thước 65% quả chín, quả chín vàng và lớn hơn theo thời gian máy chủ. Hái xong trở lại quả xanh nhỏ.
- Bỏ toàn bộ nhãn nổi dưới cây; chạm cây vẫn xem tên, cấp, sản lượng, thời gian và nút hái.
- Giữ chu kỳ 4 giờ, mốc 0/5/15/30 lần hái, sản lượng 3/5/8/12 và giá bán 10 Đồng/quả. Không đặt lại tiến trình cây đã lưu.
- Chi tiết: [MANGO_TREE_FEATURE.md](MANGO_TREE_FEATURE.md), [MANGO_RIPENESS_VISUAL.md](MANGO_RIPENESS_VISUAL.md).

## Cá và chuồng gà

- Cá đủ tuổi (`remainingMs === 0` hoặc `progress >= 1`) có alpha 1, tăng sáng 1.55, bão hòa 1.35 và tương phản 1.08; cá non giữ màu dịu, trong hơn. Áp dụng cả khi giảm hiệu ứng. Không đổi tốc độ lớn, sản lượng hoặc quyền thu hoạch.
- Giữ chuyển động cá và gà đã sửa; gà đi trong vùng sân chuồng. Không đưa lại nút “Chi tiết ao” hoặc “Chi tiết chuồng”; dùng menu thao tác trực tiếp và bảng VAC khi phù hợp.

## Thông tin cây trồng khi bấm ô đất

- `contextual.js`: ô có cây mở thẻ gồm tên, ảnh nông sản, thời gian còn lại, trạng thái tưới và thanh tiến độ. Ô trống/ô khóa giữ menu cũ.
- Đồng hồ tính từ `farming.serverNow()` và `cropProgress`, hiển thị giờ/phút/giây. Khi đủ tuổi, thẻ đổi thành “Có thể thu hoạch” và cập nhật thao tác thu hoạch khi còn mở.
- Quyền của khách thăm vẫn chỉ đọc; server tiếp tục xác nhận thao tác thật. Không tạo dữ liệu mới hoặc thay quy tắc sinh trưởng.

## Bằng chứng kiểm tra đã chạy

| Nhóm | Lệnh | Kết quả đã ghi nhận |
| --- | --- | --- |
| Kiểm thử Node tổng thể | `npm test` | 85/85 đạt sau thay đổi thẻ cây trồng |
| Nhà và tìm đường | `node tests/browser-house-collision-qa.mjs` | Phím bốn hướng, chuột đi vòng, cứu vị trí lưu, mobile đạt |
| Cổng | `node tests/browser-gate-qa.mjs` | Nhấp cổng đi tới và chuyển sang chợ đạt |
| HUD | `node tests/browser-hud-qa.mjs` | Bốn kích thước, nút mở bảng và bố cục đạt |
| Xoài | `node tests/browser-mango-qa.mjs` | Bốn cấp, hái, hai tab, reload, bán chợ, mobile đạt |
| Màu quả xoài | `node tests/browser-mango-ripeness-qa.mjs` | Canvas non xanh/chín vàng, chín lớn hơn, không vẽ nhãn đạt |
| Chuyển động vật nuôi | `node tests/browser-animal-motion-qa.mjs` | 50 mẫu gà trong rào, cho gà/cá ăn đạt |
| Thẻ cây trồng | `node tests/browser-crop-info-qa.mjs` | Nhấp ô thật, ảnh/tên, đếm ngược, tự chín, nút thu hoạch, mobile đạt |

Đây là kết quả các lượt triển khai đã chạy, không phải tuyên bố chạy lại toàn bộ browser suite trong lượt cập nhật tài liệu này. Các script browser cũ có selector/tọa độ từ giao diện trước chưa được xác nhận lại toàn bộ. Kiểm tra dùng Edge headless và Playwright, SQLite trong bộ nhớ hoặc tạm; chưa thay thế kiểm tra trên thiết bị cảm ứng vật lý. Ảnh và JSON QA nằm trong `.qa/`, bị Git bỏ qua; một số script tiện ích tái dùng thư mục kết quả, nên lượt sau có thể ghi đè ảnh/JSON cũ.

Đặt `PLAYWRIGHT_MODULE` thành URL module cài ngoài dự án và `EDGE_PATH` nếu Edge không ở vị trí mặc định. Các lệnh `node tests/...` ở bảng trên chưa phải tất cả đều có npm alias.

## Nạp bản mới và dữ liệu

Khởi động lại server khi đổi vùng va chạm, vị trí hoặc module dùng chung; Ctrl+F5 để tải asset/CSS/JS mới. Schema hiện là v11; những lượt sửa hình ảnh và thẻ thông tin không thêm migration, không reset database, ví, inventory hoặc tiến trình. Giữ các asset v2/v3 để đối chiếu, không còn được dùng cho nhà hiện tại.
