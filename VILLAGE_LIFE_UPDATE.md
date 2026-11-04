# Bổ sung cảnh làng và giao dịch sau Phase 9

Ngày: 04/11/2026.

## Thay đổi

- **Mua hàng:** hiển thị toàn bộ 26 mặt hàng bằng thẻ có ảnh, tên, đơn giá và số lượng đang có. Chọn thẻ mở popup nhập số lượng 1–999, tổng tiền và nút xác nhận. Có nút điền số lượng tối đa theo tiền và chỗ còn trong túi.
- **Bán hàng:** mở kho nông sản bằng ảnh, chỉ hiện sản phẩm bán được đang có trong kho. Chọn món rồi nhập số lượng để bán. Mặt hàng đã hết được bỏ khỏi danh sách; kho trống có thông báo rõ ràng.
- **Giới hạn giao dịch:** client và server nhận số nguyên 1–999. Vẫn giữ trần 999 mỗi vật phẩm trong túi, kiểm tra đủ tiền/hàng và giao dịch nguyên tử, chống cộng/trừ lặp khi gửi lại request. Vì vậy mua 999 hạt khi đã có 4 hạt sẽ bị chặn với hướng dẫn chỗ trống còn 995.
- **NPC:** Bác Tư, Ông Ba và Bé Na chuyển sang làng cùng Cô Lan. Farm riêng không có NPC. Giữ nguyên ID nhiệm vụ và tiến độ đã lưu; mô tả nhiệm vụ chỉ dẫn người chơi đến làng.
- **Bản đồ làng:** mở rộng từ 1200×800 lên 2000×1500; thêm sân cây đa, giếng làng, đình, xóm nhà, đường nối, ruộng ven làng, vịt, chó và mèo nhỏ. Các công trình lớn có collision dùng chung giữa client/server. Nút khu vực cho nhân vật tự đi đến nơi bằng đường tránh vật cản.
- **Cây:** thêm tre, cây bóng mát không quả và cây phượng, cùng cây đa ở làng; giữ một số cây cũ. Cây hiện là cảnh quan, chưa triển khai tính năng ra quả/thu hái tương lai.
- **Khung cảnh ngoài farm/làng:** nền mở rộng bằng ruộng, đường, dòng nước, vườn và nhà hàng xóm quanh rìa bản đồ; không còn phần ngoài bản đồ chỉ có một màu xanh. Không mở rộng đất sở hữu hoặc chặn vùng xây dựng hiện có của người chơi.
- **Cổng:** chạm điểm cổng để nhân vật tự tìm đường; đi tới vùng cổng sẽ tự chuyển cảnh. Phím E vẫn là lối tắt tùy chọn. Điểm xuất hiện đặt cách cổng để không tự chuyển ngược ngay khi vừa tới.
- **Khởi động:** HTML mặc định hiển thị loading, ẩn đăng nhập. Phiên hợp lệ đi thẳng vào game sau khi tải dữ liệu và asset. Chỉ hiện đăng nhập khi server trả 401; lỗi tải khác có nút thử lại, không giả thành đăng xuất.

Không thay đổi database schema, không reset tài khoản, tiền, đồ hoặc tiến độ người chơi. Các bài kiểm tra dùng SQLite RAM, không dùng database thật.

## Kiểm tra

```powershell
node tests/run.mjs
node tests/browser-village-life.mjs qa
```

Regression: **47/47 PASS**. Các kiểm tra bổ sung bao gồm mua/bán 999, từ chối 1000/số lẻ, rollback khi túi đầy, NPC ở làng và đường đi tránh các gian hàng.

Browser: **14/14 PASS**, Edge headless chạy game và API thật trên database kiểm thử. Kết quả nằm trong [docs/village-life/qa.json](docs/village-life/qa.json). Bao gồm loading với API chậm và API giả lập lỗi 503/thử lại, cổng hai chiều không cần E, tự đi đến cây đa, mua/bán 999 qua UI, kho trống, popup mobile và Escape quay lại danh sách. Lỗi 503 chủ động tạo để kiểm tra phục hồi được xử lý riêng, không tính thành lỗi game. **Không chụp/lưu screenshot theo yêu cầu.**

Mẫu 120 frame tại làng: median 16,7 ms, p95 16,7 ms (khoảng 60 FPS trên máy kiểm thử), không ghi nhận lỗi runtime ngoài trường hợp lỗi mạng giả lập. Đây là mẫu ngắn, không phải kết luận hiệu năng trên mọi thiết bị.

Mobile được kiểm tra bằng viewport 390×844 và browser desktop ở 1366×768; chưa thử trên thiết bị điện thoại vật lý. Không thực hiện vòng đối chiếu hình ảnh mới sau khi người dùng yêu cầu dừng chụp ảnh.

## Asset và tái tạo

Ảnh mới dùng built-in `image_gen.imagegen`, giữ nguyên PNG nguồn và bản WebP runtime trong `public/assets/`. [Manifest](public/assets/manifest.json) ghi nguồn và SHA-256; [prompt đầy đủ](public/assets/village-life-prompts.json) lưu hai prompt gốc. Không sử dụng ảnh từ game khác.

```powershell
node scripts/build-village-surroundings.mjs
node tests/browser-village-life.mjs package
```

Đóng gói và browser QA cần Node.js 22+ cùng Edge, có thể đặt `EDGE_PATH`. Game không thêm dependency npm mới. Layer nền được cache thành bitmap; icon sản phẩm dùng chung atlas để tránh tải nhiều ảnh riêng.

## Sử dụng bản cập nhật

Khởi động lại server để nạp giới hạn giao dịch, vị trí NPC và kích thước map mới, sau đó tải lại trang game. Phiên đăng nhập và dữ liệu hiện có được giữ nguyên.
