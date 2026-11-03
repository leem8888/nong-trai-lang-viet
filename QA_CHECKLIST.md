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

## Phase 3

- [ ] Farm cũ sau migration vẫn đăng nhập được, giữ hạt/cây và có ví 200 Đồng Làng đúng một lần.
- [ ] Đi theo lối phía nam tới cổng chợ; nhấn E chuyển cảnh, camera/va chạm hoạt động và có thể về farm.
- [ ] Đứng gần quầy Cô Mai; xem giá hạt, số dư, tổng tiền, mua hạt; ví giảm và túi đồ tăng đúng số lượng.
- [ ] Đứng gần quầy Cô Lan; bán nông sản; ví tăng và túi đồ giảm đúng số lượng.
- [ ] Đứng xa NPC hoặc đang ở farm thì không mua/bán được; lỗi hiển thị rõ.
- [ ] Nhận ít nhất một đơn, kiểm tra tiến trình nguyên liệu, giao đủ hàng và nhận thưởng đúng một lần.
- [ ] Mở lịch sử; thấy cấp tiền ban đầu, mua, bán và thưởng đơn với số dư sau giao dịch.
- [ ] Hai tab cùng tài khoản thực hiện lại cùng request ID hoặc bấm liên tiếp không nhân đôi tiền/hàng.
- [ ] Reload và restart server giữ ví, kho, scene và trạng thái đơn.
- [ ] Giá mặt hàng nổi bật +15% theo ngày UTC; đổi ngày không làm hỏng giao dịch đang xem mà báo xem lại giá.
- [ ] Kiểm tra console browser, layout desktop/mobile và vùng tương tác E/click.
