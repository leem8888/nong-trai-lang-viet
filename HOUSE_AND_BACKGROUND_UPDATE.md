# Nhà ba gian và đường nền quanh nông trại

> Báo cáo lịch sử của phiên bản trước. Nhà hiện dùng **v4**, bảng tên và hiển thị xoài đã sửa tiếp. Xem [trạng thái hiện tại](docs/UI_GAMEPLAY_UPDATES_2026-11-06.md); không lấy kích thước/asset cũ dưới đây để triển khai bản mới.

Đã thay nhà cũ bằng nhà ba gian rộng 520 × 330, neo tại (750,160), tăng chiều rộng khoảng 33%. Mái ngói đỏ, cửa gỗ, hiên gạch, bậc đá, chum và mẹt tre. Asset: `public/assets/farmhouse-v2.png` (RGBA, nền alpha). Giữ nguyên asset cũ để có thể quay lại.

Chân nhà được vẽ lại trong `public/js/shared/house.js`; client, server và tìm đường cùng dùng một đa giác. Giữ xử lý lớp trước/sau nhà và cứu vị trí lưu nằm trong vật cản.

Đường làng mới: `public/assets/farm-surroundings-roads-v2.svg`. Đường chạy ngoài ranh hàng rào (65,-195)–(1675,905), nhánh nối ở cổng (720,905). `main.js` dùng clip evenodd loại phần bên trong ranh đất, nên lớp đường làng không phủ vào vườn. Giữ đường sân nối nhà, cổng, ao và chuồng.

## Kiểm tra

- `npm test`: 85/85 đạt.
- `node tests/browser-house-collision-qa.mjs`: đi phím bốn phía, chuột tìm đường vòng, khôi phục vị trí kẹt, mobile đều đạt.
- Kiểm tra ảnh thực tế `.qa/house-collision/front.png`: nền cỏ sạch trong hàng rào, đường làng bên ngoài, nhà mới trong sân.
- Kiểm tra hồi quy cây xoài bằng `tests/browser-mango-qa.mjs`.

## Tạo hình

Dùng công cụ ImageGen tích hợp, chế độ chỉnh ảnh tham chiếu và nền trong suốt. File cuối: `public/assets/farmhouse-v2.png`.

Prompt thiết kế: Redesign the isolated farmhouse game sprite into a wider authentic Vietnamese countryside nha ba gian, same elevated 3/4 orthographic camera and warm painterly farming-game style. Three timber door bays, deep brick veranda, ochre plaster, traditional red terracotta tiled pitched roof with restrained straight ridge, low stone steps, clay jars, wicker baskets and winnowing trays, small chrysanthemum pots. Entire building visible, landscape composition, isolated transparent background, no people, animals, fences, roads, scenery or text.

Prompt chỉnh alpha cuối cùng (nguyên văn): Remove ALL background from this house sprite. Preserve the house, steps, pots, roof and attached foliage exactly. The brown black green gradient surrounding the building must be removed, replaced by actual alpha transparency. No rectangular background, no scenery, no checkerboard painted into image. Output isolated entire house cutout on truly transparent background, keep same composition and camera.

## Áp dụng khi đang chạy game

Khởi động lại server để nạp hình học va chạm mới, sau đó Ctrl+F5 trên trình duyệt. Không sửa dữ liệu cây trồng, vật nuôi hoặc số dư.
