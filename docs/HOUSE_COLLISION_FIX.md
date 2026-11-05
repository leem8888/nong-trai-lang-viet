# Sửa lỗi đi xuyên nhà — 2026-11-05

## Nguyên nhân

Vùng chặn cũ `{x:540,y:-70,w:340,h:260}` là hình chữ nhật thế giới không khớp nền móng của sprite nhà upright isometric. Nó bỏ sót một phần mép hiên/trái và chặn nhầm đất bên ngoài. Thứ tự vẽ nhà theo một depth cố định cũng có thể che nhân vật đứng ngoài góc hiên, tạo cảm giác nhân vật ở trong nhà.

## Thay đổi

- `public/js/shared/house.js` chứa cùng anchor/kích thước ảnh nhà và đa giác chân móng. `farmWorld.js` dùng đa giác này thay hình chữ nhật cũ.
- Client, server và A-star dùng chung kiểm tra hình tròn nhân vật với cạnh/miền đa giác. Giữ bước chia nhỏ di chuyển để chống xuyên tường khi frame dài; server tiếp tục kiểm tra toàn bộ đoạn đường và giới hạn tốc độ.
- Xây dựng server và preview phần nhà cùng kiểm tra rectangle–polygon, không cho đặt công trình xuyên móng.
- `houseActorDepth` xét cạnh hiên ở cột màn hình tương ứng để nhân vật ở phía trước được vẽ trên ảnh nhà. Nhân vật đứng phía sau vẫn có thể bị nhà che theo phối cảnh; điều đó không cho phép đi qua phần nền móng.
- Dùng cơ chế cứu vị trí hiện có khi tải farm: nếu vị trí lưu cũ nằm trong vùng nhà mới, server tìm đất trống lân cận thay vì giữ nhân vật mắc trong tường.
- Không đổi schema, ví, kho hoặc tiến độ cây/VAC. Không tự khởi động lại server đang phục vụ người chơi.

## Kiểm chứng

- `npm test`: **85/85 PASS**.
- Kiểm tra mới: các điểm nền nhà nhìn thấy bị chặn ở cả client/server; đất trước hiên vẫn đi được; bước di chuyển lớn không xuyên từ bốn phía; đường A-star đi vòng; actor trước góc hiên được vẽ đúng lớp; vị trí lưu trong nhà được cứu; xây đè móng bị từ chối và không mất tiền.
- Browser Edge: giữ phím đi vào nhà từ trái/phải/sau/trước, lấy mẫu vị trí trong lúc di chuyển — không vào đa giác móng. Bấm sang phía bên kia đi vòng và tới đích. Tải lại từ vị trí thử bên trong được đưa ra đất hợp lệ. PASS, không có pageerror.
- Đã xem ảnh góc hiên sau chỉnh depth: thân nhân vật đứng trước bậc nhà hiển thị đầy đủ.
- Browser xoài cạnh nhà: thu hoạch, đi tới cây, tăng cấp 2–4, đồng bộ hai tab và bán tại chợ vẫn PASS.
- Viewport: desktop 1366x900 và ảnh mobile 390x844. Test dùng SQLite trong bộ nhớ, không đổi dữ liệu chơi thật.

Chạy lại `npm run qa:house-collision` (cần Playwright/Edge như README). Bằng chứng: `.qa/house-collision/results.json`, ảnh `left.png`, `right.png`, `back.png`, `front.png`, `mobile.png`.

## Nhận bản sửa

**Khởi động lại server**, sau đó **Ctrl+F5** trên trang game. Cần cả hai bước vì phần kiểm tra va chạm server được nạp khi tiến trình Node khởi động, còn client có thể đang giữ module cũ trong bộ nhớ/cache.
