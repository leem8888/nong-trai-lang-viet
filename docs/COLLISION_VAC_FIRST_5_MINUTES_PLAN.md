# Kế hoạch sửa va chạm, VAC và hoàn thiện 5 phút đầu

Ngày lập: 2026-11-05.
Trạng thái: PLAN — chưa triển khai.

## Mục tiêu và phạm vi

Triển khai theo hai đợt: đồng bộ va chạm và sửa VAC trước; hoàn thiện trải nghiệm 5 phút đầu sau khi đợt 1 đạt nghiệm thu. Kế hoạch không bao gồm phát hành, thêm model kinh doanh hay mở rộng nội dung dài hạn.

Giữ nguyên dữ liệu người chơi. Trước thay đổi schema, tạo bản sao lưu SQLite nhất quán; kiểm thử migration trên bản sao và QA bằng database dùng một lần. Không sửa dữ liệu chơi để tăng tốc QA.

## Cơ sở đánh giá

Đã đọc mã nguồn, tài liệu và ảnh QA có sẵn; chưa chơi trực tiếp bản hiện tại trên trình duyệt.

Lần chạy `node tests/run.mjs` khi đánh giá: 67 test, 61 đạt, 6 lỗi. Đây là kết quả tại thời điểm đánh giá, không thay thế kết quả nghiệm thu sau triển khai:

- Bốn lỗi liên quan VAC và vùng tiếp cận chuồng gà. Cần phân biệt lỗi logic với fixture tọa độ đã cũ.
- Một lỗi SQLite `unable to open database file`; cần xác định đường dẫn/quyền truy cập trước khi kết luận migration hỏng.
- Một lỗi kiểm thử nền cỏ `document is not defined`; cần sửa mock hoặc cách kiểm thử Canvas, chưa chứng minh lỗi hiển thị trong game.

Mã client trong `public/js/main.js` có một vật cản tại x=1060, trong khi `server/world.js` đặt vật cản tương ứng tại x=1300. Phải đối chiếu bản vẽ và hình ảnh chạy thật trước khi chọn tọa độ chuẩn.

## Đợt 1 — Đồng bộ va chạm và sửa VAC

### 1. Tái hiện và chốt nguyên nhân

- Ghi lại trạng thái Git và kết quả test hiện tại.
- Tái hiện từng lỗi VAC với farm trống và farm có công trình/trang trí.
- Ghi rõ vị trí client, vị trí server, bố cục ao/sân gà, điểm đích và kết quả kiểm tra khoảng cách.
- Kiểm tra các fixture cũ trong `tests/phase4.test.js` và `tests/animalAccess.test.js` so với bố cục mới.
- Không sửa test chỉ để làm xanh; khi thay fixture phải ghi lý do và giữ kiểm tra hành vi độc lập.

### 2. Một nguồn dữ liệu va chạm chung

- Tách kích thước map, vật cản cố định và điểm tương tác vào module dùng chung, ví dụ `public/js/shared/farmWorld.js`.
- Client và server cùng nhập module này, không duy trì hai bản tọa độ riêng.
- Tiếp tục tính vật cản động từ công trình, đồ trang trí, ao và sân gà bằng cùng quy tắc.
- Đồng bộ bán kính nhân vật, hệ tọa độ và ranh giới thế giới.
- Đối chiếu vật cản với artwork; không chọn mặc định bên client hoặc server là đúng.

### 3. Điểm tiếp cận VAC hợp lệ và đi tới được

Các tệp chính: `public/js/shared/livingLayout.js`, `public/js/shared/vac.js`, `public/js/main.js`, `server/world.js`, `server/vac.js`.

- Xác định rõ vùng đứng chăm sóc cho từng bố cục ao lớn/nhỏ và sân gà.
- Chọn điểm đích từ các ứng viên hợp lệ theo va chạm và có đường đi tới; không chỉ chọn theo khoảng cách thẳng.
- Nếu mọi ứng viên bị chặn, trả trạng thái không thể tiếp cận, không dùng lại điểm bị chặn.
- Thống nhất kiểm tra vùng tương tác client/server; server giữ quyền quyết định cuối.
- Kiểm tra bố cục thay đổi sau đặt, xoay, di chuyển hoặc cất công trình/trang trí.
- Tránh điểm đứng nằm trong nước, hàng rào, vật thể hoặc vị trí khiến nhân vật bị che hoàn toàn.

### 4. Đồng bộ di chuyển trước thao tác

- Hoàn tất đường đi và chờ server xác nhận vị trí cuối trước khi gửi thao tác VAC.
- Nếu server hiệu chỉnh vị trí, tính lại đường/điểm tiếp cận với số lần thử hữu hạn.
- Cho hủy thao tác đang chờ; timeout hoặc mất kết nối phải kết thúc rõ ràng.
- Báo cụ thể không tìm được đường, đường bị chặn hoặc mất kết nối; không nuốt lỗi `Movement unavailable` rồi để người chơi không biết kết quả.
- Giữ transaction, quyền sở hữu, kiểm tra khoảng cách và receipt chống thực hiện lặp của VAC.

### 5. Ma trận kiểm thử và nghiệm thu

- [ ] Client/server có cùng kết quả với tập vị trí biên, góc vật cản và đoạn di chuyển xuyên vật cản.
- [ ] Thả cá, cho ăn, thu hoạch thành công với cả bố cục ao lớn và ao nhỏ.
- [ ] Thêm gà, cho ăn, nhặt trứng thành công với mọi bố cục sân gà hiện có, kể cả nhánh không có sân nếu được hỗ trợ.
- [ ] Chuyển đổi thức ăn đúng vị trí, trừ và cộng kho nguyên tử.
- [ ] Các phía được thiết kế cho phép tiếp cận đều thao tác được; phía không cho phép phải có phản hồi rõ.
- [ ] Khi bị trang trí chặn, nhân vật chọn đường khác hoặc báo không thể tiếp cận.
- [ ] Thao tác từ xa, sai farm, sai scene và khi đang thăm farm bị từ chối.
- [ ] Gửi lại cùng request không trừ/nhận vật phẩm lần hai; đổi payload với cùng request bị từ chối.
- [ ] Kho đầy, ao/chuồng đầy không làm mất vật phẩm hoặc cập nhật dở dang.
- [ ] Offline growth, reload và restart giữ đúng cá, gà, kho và thời gian.
- [ ] Kiểm tra desktop 1366x768, 1920x1080 và mobile 390x844.
- [ ] Kiểm tra mạng có độ trễ và ngắt/kết nối lại trong lúc tiếp cận.
- [ ] Chạy bộ Node test, browser VAC, contextual, xây dựng và thăm farm liên quan.
- [ ] Điều tra riêng lỗi SQLite và mock Canvas; mọi lỗi còn lại phải ghi nguyên nhân, không tuyên bố toàn bộ test đạt khi chưa đạt.

Điều kiện chuyển đợt: lỗi va chạm và VAC đã tái hiện được phải được xử lý, test liên quan đạt, luồng trình duyệt thực tế được xác minh và dữ liệu cũ được bảo toàn.

## Đợt 2 — Hoàn thiện 5 phút đầu

### Mục tiêu trải nghiệm

Người mới tự thực hiện vòng trồng, thu hoạch, bán hàng, mua hạt và hiểu việc tiếp theo trong khoảng 5 phút. Các mốc dưới đây là mục tiêu playtest, không tự chuyển bước theo đồng hồ.

| Thời gian mục tiêu | Hành động và kết quả |
| --- | --- |
| 0:00–0:30 | Vào farm, thấy một mục tiêu: Trồng luống rau đầu tiên. |
| 0:30–1:15 | Ô đất nổi bật; cuốc, gieo, tưới và nhận phản hồi từng bước. |
| 1:15–2:00 | Rau hướng dẫn chín; thu hoạch và nhìn thấy vật phẩm vào túi. |
| 2:00–3:15 | Đi theo chỉ dẫn ra chợ, bán rau, thấy số dư tăng. |
| 3:15–4:15 | Mua một gói hạt để hiểu vòng tái đầu tư. |
| 4:15–5:00 | Về farm gieo vụ thường; chọn mục tiêu mở ô đất hoặc nuôi cá/gà. |

### 1. Hướng dẫn dựa trên hành động

Các tệp dự kiến: `public/js/onboarding.js`, `public/js/main.js`, UI/CSS, dịch vụ farming/economy/quests và migration nếu cần.

- Thay chuỗi trang bấm Tiếp bằng máy trạng thái dựa trên hành động thành công do server xác nhận.
- Mỗi thời điểm hiện một mục tiêu chính, chỉ rõ vật thể/ô đất và thao tác tiếp theo.
- Lưu tiến trình ở server để reload, thoát game hoặc đổi thiết bị vẫn tiếp tục đúng bước.
- Khi quay lại phải đọc trạng thái farm/kho để phục hồi bước hợp lý, không ép lặp hành động đã hoàn thành.
- Có Bỏ qua và Xem lại; xem lại chỉ nhắc thao tác, không cấp lại ưu đãi.
- Không phụ thuộc việc farm mới tạo trong 10 phút hay localStorage để xác định đủ điều kiện nhận thưởng.

### 2. Vụ rau đầu nhanh, có giới hạn

- Một vụ rau hướng dẫn chín sau 30–60 giây; chỉ áp dụng một lần theo tiến trình server.
- Ghi thời gian của cây bằng snapshot như cơ chế hiện có; các vụ thường giữ thời gian đang cấu hình.
- Ưu đãi và tiến trình phải được ghi nguyên tử, chống hai tab/retry tạo nhiều vụ nhanh.
- Dùng hạt/vật phẩm hiện có nếu phù hợp; chỉ thêm khoản cấp khi playtest chứng minh cần thiết và phải có dấu vết giao dịch.
- Không tạo API cho client tự chọn thời gian cây, cấp tiền hoặc xác nhận đã hoàn thành.
- Không tự thay đổi cây, thời gian hoặc tài nguyên của farm cũ.

### 3. Dẫn đường và phản hồi

- Làm nổi bật ô đang hướng dẫn, cổng ra chợ và quầy cần tới.
- Hiện phản hồi ngắn cho cuốc/gieo/tưới/thu hoạch, số lượng vào túi và số tiền thay đổi.
- Khi chờ rau, hướng dẫn xem túi và đọc đồng hồ; không để khoảng trống dài không có mục tiêu.
- Mobile dùng chỉ dẫn chạm và nút tương tác; không lấy phím E làm hướng dẫn chính.
- Panel, joystick, lời nhắc và mục tiêu không che điểm bấm thiết yếu.
- Hỗ trợ giảm hiệu ứng và không dùng màu sắc làm dấu hiệu duy nhất.

### 4. Tích hợp nhiệm vụ và xử lý lệch tiến trình

- Đối chiếu tuyến nhiệm vụ hiện có: nhiệm vụ thu hoạch có thể chưa mở khi người chơi đã thu hoạch lần đầu.
- Chọn và ghi rõ cách phối hợp onboarding với quest để hành động hợp lệ không bị mất tiến độ hoặc thưởng hai lần.
- Xử lý trường hợp bán hết rau, tiêu tiền trước, hết hạt, đi sai scene, đóng panel, bỏ hướng dẫn hoặc mất kết nối.
- Có cách tiếp tục an toàn, không yêu cầu xóa farm hay đăng ký lại.
- Khi hoàn tất, chỉ đưa một hoặc hai mục tiêu kế tiếp có chi phí/điều kiện rõ; chưa mở rộng thêm hệ thống gameplay.

### 5. Dữ liệu và tương thích

- Chỉ bổ sung schema nếu cần; migration thêm mới, có kiểm tra chạy lại và bảo toàn dữ liệu.
- Farm cũ mặc định không bị reset hoặc tự nhận ưu đãi dành cho người mới.
- Trước code phải chốt rõ quy tắc tài khoản/farm nào được tham gia onboarding mới.
- Nếu thêm phần thưởng, dùng ledger/receipt hiện có hoặc cơ chế tương đương để kiểm toán và chống nhận lặp.

### Nghiệm thu đợt 2

- [ ] Tài khoản mới hoàn thành trồng → thu hoạch → bán → mua hạt → gieo vụ thường.
- [ ] Tiến trình chỉ tăng từ thao tác hợp lệ được server xác nhận.
- [ ] Reload, restart và hai tab không cấp lại cây nhanh, tiền hoặc vật phẩm.
- [ ] Bỏ qua/xem lại không làm kẹt gameplay và không nhận lại ưu đãi.
- [ ] Farm cũ giữ nguyên cây, vật phẩm, tiền và tiến độ nhiệm vụ.
- [ ] Desktop/mobile không che hoặc làm mất nút cần bấm.
- [ ] Luồng xử lý được hết hạt, hết tiền, bán hết rau, đi sai scene và mất kết nối.
- [ ] Người chơi nhìn thấy thời gian của vụ thường sau hướng dẫn, hiểu rằng cây tiếp tục lớn khi offline.

Playtest với 5 người chưa biết game, không chỉ dẫn bằng lời:

- Mục tiêu ban đầu: ít nhất 4/5 người hoàn thành vòng đầu trong khoảng 5 phút.
- Ghi thời gian đến từng mốc, số lần bấm sai và vị trí người chơi cần trợ giúp.
- Người chơi nói được việc tiếp theo và không cần đọc README để thao tác.
- Không coi test tự động đạt là bằng chứng đủ cho mục tiêu trải nghiệm; nếu chưa có người thử phải ghi rõ chưa xác minh.

## Thứ tự bàn giao

1. Báo cáo nguyên nhân lỗi, test tái hiện và tọa độ/vùng tương tác chuẩn.
2. Module va chạm dùng chung, luồng tiếp cận VAC và kết quả nghiệm thu đợt 1.
3. Thiết kế trạng thái onboarding, điều kiện tham gia và migration nếu có.
4. Hướng dẫn theo hành động, vụ rau đầu và phản hồi UI.
5. Báo cáo hồi quy, ảnh desktop/mobile, kết quả playtest và danh sách giới hạn.

Sau mỗi đợt cập nhật tài liệu bàn giao bằng kết quả thực tế. Chỉ đánh dấu COMPLETE khi các tiêu chí tương ứng đã được kiểm chứng. Không deploy trong phạm vi kế hoạch này.
