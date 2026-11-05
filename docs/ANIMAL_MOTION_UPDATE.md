# Cải thiện chuyển động cá và gà — 2026-11-05

## Lỗi và nguyên nhân

Vùng đi cũ của gà là hình chữ nhật trong tọa độ thế giới, không khớp với hình đa giác của nền sân trong sprite. Test cũ cũng chỉ xác nhận hình chữ nhật đó, nên có thể đạt dù gà đang đứng trên hàng rào trong hình ảnh. Ao dùng nội suy từng đoạn khiến cá chậm lại và đổi hướng thiếu tự nhiên; thân cá trước đây chủ yếu được lật và co giãn cả hình.

## Thay đổi

- `public/js/animalMotion.js`: khai báo đa giác phần nền sân bên trong hàng rào theo tọa độ ảnh `living-coop-yard-small-v4.png`. Quy đổi giữa mặt phẳng ảnh và thế giới bằng cùng anchor dùng khi vẽ.
- Chừa chỗ cho cả thân/đầu/chân gà, tránh máng thức ăn và chậu nước. Điểm sinh, đích đi và từng bước di chuyển đều được xác nhận; gà nhường chỗ khi có con khác chặn đường thay vì đẩy nhau ra ngoài.
- Sân thay đổi bố cục thì hình ảnh và vùng đi cùng dịch chuyển. Hai bố cục sân hiện có dùng chung quy tắc.
- Gà có nhịp đi tăng tốc nhẹ, bước chân xen kẽ, quay hướng dần, dừng nghỉ, mổ đất, ăn, uống và nghỉ gần chuồng. Hành vi được chọn lệch nhịp theo từng con.
- `public/js/animalDrawing.js`: dùng vùng nguồn cắt sát con vật, giữ phần thân ổn định; chuyển động đầu/chân gà và đuôi cá tách khỏi co giãn toàn bộ sprite. Không thay file ảnh gốc.
- Cá đi theo đường cong B-spline liên tục, có vùng tuần tra riêng theo từng con để giảm tụ lại một điểm. Hướng thân chuyển dần và đuôi uốn nhẹ; giảm các vòng sóng lặp liên tục.
- Cập nhật vị trí hit target của con vật theo vị trí hình ảnh thực tế; dọn cache con vật đã thu hoạch. Giữ chế độ giảm hiệu ứng.
- Không thay schema, vật phẩm, thời gian nuôi, sản lượng hay dữ liệu farm thật.

## Kiểm chứng

- `npm test`: **76/76 PASS**.
- Mô phỏng bốn con gà trong **10 phút** ở mỗi bố cục sân: thân gà ở trong đa giác nền sân, ngoài máng ăn/nước, không nhảy vị trí; có cả trạng thái đi, đứng, mổ, ăn, uống và nghỉ sau khi tới đích.
- Cá được kiểm tra ở cả hai kích thước ao: nằm trong nước, vận tốc liên tục tại chỗ nối đường đi và cache được xóa khi hết cá.
- Browser Edge: bốn gà trưởng thành và sáu cá, 50 lượt lấy mẫu trong khoảng hơn 30 giây; các mẫu ở trong sân; xem chuỗi ảnh, không ghi nhận pageerror.
- Thao tác cho gà/cá ăn trực tiếp qua menu con vật: PASS.
- Browser VAC: thả cá, cho ăn, thu hoạch cá, thêm gà, cho gà ăn, nhặt trứng: PASS; chuyển đổi thức ăn kiểm tra qua API từ vị trí hợp lệ vì nút Chi tiết đã bị bỏ theo yêu cầu trước.
- Viewport kiểm tra: desktop 1366x900 và mobile 390x844. Mô phỏng không thay thế kiểm tra trên điện thoại vật lý hoặc đánh giá cảm giác của người chơi.

## Chạy lại

```powershell
npm test
npm run qa:animal-motion
npm run qa:collision-vac
```

Browser QA cần Playwright/Edge như README; có thể đặt `PLAYWRIGHT_MODULE` khi dùng thư viện cài ngoài dự án. Test dùng SQLite trong bộ nhớ, không chỉnh database chơi.

Bằng chứng ở `.qa/animal-motion/`: `results.json`, `frame-0.png`, `frame-1.png`, `frame-2.png`, `frame-10.png`, `frame-25.png`, `frame-49.png`, `mobile.png`. Bản source trước thay đổi để đối chiếu nằm trong `.qa/animal-motion/livingVisual-before.js`.

Tải lại trang bằng **Ctrl+F5** để nhận module JavaScript mới. Nếu sau này đổi hình sân chuồng, cần cập nhật đa giác và vị trí máng trong `coopGeometry`, rồi chụp QA lại; không suy vùng đi từ một hình chữ nhật chung.

## Bổ sung phân biệt cá trưởng thành — 06/11/2026

`livingVisual.js` làm cá đủ tuổi thu hoạch sáng/rõ màu hơn cá non, dựa vào trạng thái server (`remainingMs === 0` hoặc `progress >= 1`). Alpha 1, filter `brightness(1.55) saturate(1.35) contrast(1.08)`; áp dụng cả chế độ giảm hiệu ứng. Cá non giữ màu dịu. Không đổi kích thước đã có, quỹ đạo, tốc độ lớn hay quyền thu hoạch. Đã chạy 3/3 fish-motion tests và browser animal-motion (50 mẫu chuyển động, thao tác cho ăn) đạt. Đây chưa phải phép đo độ sáng bằng pixel hoặc đánh giá chủ quan trên mọi màn hình.
