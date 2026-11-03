# QA trình duyệt — Phase 1 và Phase 2

Trạng thái: **chưa thực hiện** trong phiên 2026-11-03 vì công cụ browser trả danh sách rỗng. Không đánh dấu pass dựa trên kiểm thử API.

## Gate 0 — Phase 1

- [ ] Mở game, đăng ký hai tài khoản riêng.
- [ ] Mỗi tài khoản tạo một farm khác tên; đăng xuất/đăng nhập lại đúng farm.
- [ ] Đi bằng WASD/phím mũi tên; nhân vật không xuyên nhà, cây, hàng rào hoặc rìa bản đồ.
- [ ] Camera theo nhân vật và giữ trong ranh giới khi đổi kích thước cửa sổ.
- [ ] Tới gần bảng, cửa nhà và đèn; nhấn E hoặc nhấp để tương tác.
- [ ] Bật đèn, tải lại trang và khởi động lại server; đèn vẫn giữ trạng thái.
- [ ] Mất mạng rồi kết nối lại; snapshot vị trí/trạng thái được khôi phục.
- [ ] Hai tab/tài khoản không nhìn thấy hoặc sửa farm riêng của nhau.
- [ ] Kiểm tra console browser không có lỗi JavaScript.

## Phase 2

- [ ] Farm cũ sau migration vẫn đăng nhập được và có 4 hạt mỗi loại.
- [ ] Đứng gần ruộng, chọn cuốc rồi nhấp một ô; ô đổi hình và không cuốc trùng.
- [ ] Chọn một trong sáu hạt, gieo trên đất đã cuốc; số hạt trong túi giảm đúng 1.
- [ ] Không gieo được trên đất chưa cuốc, trên ô đã có cây hoặc khi đứng quá xa.
- [ ] Tưới đất/cây, thấy hiệu ứng nước; tưới lặp không cộng lợi ích.
- [ ] Thấy hạt, mầm, cây đang lớn, cây trưởng thành; thông tin cây và tiến trình thay đổi.
- [ ] Tải lại khi đang trồng; cây và túi đồ còn nguyên.
- [ ] Đóng trình duyệt hoặc server, quay lại sau thời gian thực; cây tiến triển tương ứng.
- [ ] Thu hoạch sớm bị từ chối; thu hoạch chín cộng đúng số nông sản và ô có thể trồng lại.
- [ ] Hai tab thu hoạch cùng lúc không nhân đôi nông sản.
- [ ] Khi hết toàn bộ hạt, nhận gói bổ sung một lần; nhận tiếp cùng ngày bị từ chối.
- [ ] Thử viewport nhỏ và thao tác chạm nếu có thiết bị phù hợp.
