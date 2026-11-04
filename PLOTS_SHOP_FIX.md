# Ô ruộng vuông, nhóm cửa hàng và ảnh sản phẩm

Ngày thực hiện: 04/11/2026.

## Ô ruộng

- Ô vuông **48×48** trong hệ tọa độ world, khoảng cách 50 px; dưới góc nhìn isometric tạo các ô thoi vuông cân đối, sát nhau hơn.
- Farm mới có **5 ô**, bố cục tối đa **8×4 = 32 ô**. Ô khóa có viền mờ; ô tiếp theo có dấu `+`.
- Chạm ô khóa → Mở rộng ruộng → xác nhận mở thêm một ô. Cũng có nút `Ô ruộng x/32` trong menu công cụ nông trại.
- Giá theo số lần đã mua `n`, bắt đầu từ `n = 0`: **100 + 50n + 25n²** Đồng Làng. Các lần đầu: **100, 175, 300, 475, 700…**
- Server tự tính giá, kiểm tra đủ tiền và quyền chủ farm, mở ô/trừ tiền/ghi lịch sử trong cùng transaction. Gửi lại cùng request không trừ thêm. Xác nhận đã cũ sau khi một phiên khác mở ô sẽ yêu cầu xem lại giá.
- Giữ kéo để làm nhiều ô; ô khóa không nhận hành động gieo/tưới/thu hoạch. Người thăm farm thấy đúng bố cục nhưng không được mua ô.
- Cây non có bầu đất tròn đậm ở gốc. Cây trưởng thành bỏ lớp đậm này, dùng hình cây được cắt riêng, đúng loại.

## Dữ liệu cũ

Migration **9** mở giới hạn tọa độ trong SQLite và giữ nguyên ID cây, tọa độ ô, thời gian tăng trưởng, nước tưới, sản lượng, kho và ví. Farm cũ được mở miễn phí đủ số ô để bao phủ các tọa độ đã dùng; không xóa cây để ép về 5 ô. Số lần mua ô mới vẫn bắt đầu từ 0, nên lần mua tiếp đầu tiên là 100 Đồng.

Template `data/starter.sqlite` được cập nhật lên schema 9 và đã xác nhận không có tài khoản, farm hoặc ví người chơi.

Đã sao lưu database local trong `data/backups/` trước khi khởi động lại server cổng 3000. Hash dữ liệu tài khoản, ví, kho, cây và trạng thái đất trước/sau được đối chiếu và giữ nguyên. Server hiện chạy schema 9; database thật không dùng cho các giao dịch kiểm thử.

## Cửa hàng và ảnh

- Ba nhóm: **Hạt giống**, **Vật nuôi & thức ăn**, **Đồ trang trí**; lần lượt 6, 5 và 15 mặt hàng.
- Tiêu đề, ví và nút nhóm nằm trong header sticky, giữ lại khi cuộn danh sách.
- Lỗi ảnh gốc: `mature-crops.webp` có **6 cột**, nhưng pipeline cũ chia thành **5**, dẫn đến sai cây và lẫn mảnh ảnh bên cạnh. Một số ô của sheet sản phẩm cũng có mảnh nhỏ từ ô liền kề.
- Đã xuất **33 ảnh WebP riêng 128×128**, dùng đúng khung nguồn, loại mảnh alpha nhỏ rời rạc và thêm padding trong suốt. Thẻ sản phẩm dùng thẻ `img` thay vì một cửa sổ SVG nhìn vào cả atlas. Atlas tương thích cũ cũng được sửa lại.
- Ảnh gốc không bị ghi đè; [manifest](public/assets/items-v11/manifest.json) lưu khung nguồn và pipeline. Không tạo thêm ảnh bằng AI cho đợt sửa này.

## NPC

NPC vẫn có lịch trình ở làng, không có lịch trình ở farm. Client còn chặn hiển thị NPC ở farm ngay cả khi nhận dữ liệu cũ từ server. Server local trước đó chưa được khởi động lại, đang giữ module cũ trong bộ nhớ; đã khởi động lại đúng entrypoint và xác nhận `/api/health` hoạt động.

## Kiểm tra

- **53/53** regression/unit tests PASS: migration, khóa/mở ô, giá, ví, quyền, idempotency, đủ 32 ô, bảo toàn dữ liệu, bầu đất cây non và NPC.
- **7** kiểm tra browser mới PASS: 5 ô đầu, popup mở ô và trừ đúng 100, cây non/trưởng thành, số lượng theo nhóm, decode ảnh riêng, sticky header và popup mobile.
- **14** kiểm tra browser luồng làng/mua/bán trước đó tiếp tục PASS sau khi điều chỉnh cho nhóm cửa hàng.
- Không chụp thêm screenshot theo yêu cầu trước đó.

```powershell
node tests/run.mjs
node tests/browser-plots-shop.mjs package
node tests/browser-plots-shop.mjs qa
node tests/browser-village-life.mjs qa
```

Kết quả mới: [docs/plots-shop/qa.json](docs/plots-shop/qa.json). Chỉ cần tải lại game bằng **Ctrl+F5** để nạp giao diện mới; server local đã được khởi động lại.
