# Nông Trại Làng Việt

Game nông trại web 2.5D isometric đang được hoàn thiện. Phase 1–3 có tài khoản/farm riêng, trồng cây và chợ NPC; Phase 4 thêm VAC, Phase 5 thêm chế biến/xây dựng, Phase 6 thêm NPC, nhiệm vụ và nhịp sống làng. Xem `ISOMETRIC_REMAKE_PROGRESS.md` trước khi đánh giá trạng thái nghiệm thu đồ họa.

Phase 7 trên nhánh `feature/phase-7-social-farms`: nút **Thăm farm** cho tìm nông trại mở cửa hoặc cần duyệt. Chủ đặt quyền `Riêng tư`, `Cần duyệt` hoặc `Công khai`, xem yêu cầu, mời người chơi bằng tên tài khoản và mời khách rời đi. Khách được đi dạo, vẫy tay và về farm mình; không được sửa ruộng, kho, ví, công trình hay nhận thưởng lúc đang thăm. Mỗi farm tối đa 8 khách hiện diện. `npm run qa:phase7` chạy Edge/Playwright với 3 tài khoản và SQLite tạm; xem `PHASE7_TEST_REPORT.md` và `PHASE7_API_CONTRACT.md`.

Phase 6: nút **Nhiệm vụ** mở tuyến “Một ngày ở làng” gồm 5 nhiệm vụ chính và 2 nhiệm vụ phụ làm mới mỗi ngày UTC. Đến gần Bác Tư, Cô Lan, Ông Ba hoặc Bé Na rồi nhấn **E** hay nhấp NPC để trò chuyện. HUD hiển thị giờ thế giới, thời tiết và mùa; nút **Giảm hiệu ứng** tắt mưa động. Một ngày thế giới dài 24 phút thực; thời tiết đổi theo slot 8 phút, mỗi mùa dài 7 ngày thực. Các hiệu ứng này chỉ đổi cảnh và lời thoại, không đổi tốc độ cây/VAC/chế biến. Xem `PHASE6_TEST_REPORT.md` để chạy kiểm thử.

## Yêu cầu

Node.js 20+, npm. Cài dependency bằng `npm install` hoặc `npm ci`. `node_modules` không được đưa lên GitHub.

## Chạy

```sh
npm install
npm start
```

Mở `http://localhost:3000`. Dùng `npm run dev` để tự khởi động lại server khi sửa code. Đặt `PORT` nếu cần đổi cổng. Đặt `DB_FILE` thành đường dẫn SQLite riêng nếu không dùng `data/farm.sqlite`. Đặt `NODE_ENV=production` sau reverse proxy HTTPS để cookie dùng cờ `Secure`; production cần HTTPS thực và nơi lưu database bền vững.

`data/starter.sqlite` được lưu trong Git, chứa schema khởi đầu và **không có tài khoản, mật khẩu hay session**. Lần chạy đầu, server sao chép file này thành `data/farm.sqlite`. Dữ liệu chơi cá nhân nằm trong `data/farm.sqlite` và không tự đồng bộ qua Git. Mỗi máy/nhánh dùng cùng schema khởi đầu; dùng backup riêng nếu muốn chuyển tiến độ chơi giữa các máy.

## Tài khoản Admin cho phát triển

Chạy `npm run dev` để bật `NODE_ENV=development`. Khi mở database lần đầu, game tạo tài khoản **admin / admin**, role `ADMIN`, nông trại sẵn chơi và 999.999.999 Đồng Làng. Tài khoản này chỉ dành cho máy phát triển hoặc môi trường test. Tắt server rồi chạy lại không tạo thêm tài khoản và không đặt lại số dư. Khoản cấp đầu được ghi trong `economy_transactions` và `admin_audit_log`.

`npm start` không tự bật tài khoản mặc định khi `NODE_ENV` chưa được đặt. Trên production, đặt `NODE_ENV=production`, `ADMIN_USERNAME` và `ADMIN_PASSWORD` (ít nhất 12 ký tự, khác `admin`) bằng biến môi trường trước khi khởi động. Thiếu thông tin quản trị hợp lệ thì server từ chối khởi động. Nếu dùng lại database từng chạy development với mật khẩu `admin`, đặt `ADMIN_USERNAME=admin` và mật khẩu production mới để server đổi mật khẩu cũ; số dư và nông trại vẫn được giữ. Không đưa mật khẩu production vào Git.

Người chơi thường đăng ký qua giao diện luôn có role `USER` và 200 Đồng Làng ban đầu; client không có API để tự cấp quyền hoặc cấp tiền. `data/starter.sqlite` vẫn không chứa tài khoản Admin: seed chỉ chạy trên database làm việc.

## Trồng trọt

Chạm hoặc nhấp ô ruộng để xem thao tác hợp lệ. Chọn **Cuốc**, **Gieo** (chọn giống trong menu), **Tưới** hoặc **Thu hoạch**; nhân vật tự tìm đường đến ô và thực hiện. Giữ và kéo qua nhiều ô để làm liên tiếp. Trên điện thoại, giữ khoảng 0,38 giây trước khi kéo. **Esc** hoặc **Hủy** thoát chế độ thao tác. Phím **1–4** vẫn chọn nhanh thao tác. Dock nhỏ dưới màn hình mở **Túi đồ**, **Nhiệm vụ**, **Xây dựng**, **Bạn bè**; nút **Nông trại** mở thêm chế biến, trang trí, mở đất và nhận hạt khi hết. Server vẫn kiểm quyền, khoảng cách tại lúc thực hiện, hạt giống và trạng thái từng ô. Cây lớn theo thời gian thực kể cả khi đóng trình duyệt.

## Chợ quê

Đi theo lối phía nam farm tới biển **Chợ quê** và nhấn **E** để vào chợ. Đến gần quầy hạt, quầy thu mua hoặc bảng đơn rồi nhấn **E**. Chọn vật phẩm và số lượng để mua/bán, hoặc nhận và giao đơn hàng. Nút **Lịch sử** cạnh số dư cho xem các giao dịch. Cổng phía nam chợ đưa về farm. Chợ luôn mở; một loại nông sản được thu mua cao hơn 15% theo ngày UTC. Giá, tiền và vật phẩm được xác nhận ở server. Dùng `npm run economy:report` để xem bảng lợi nhuận thử nghiệm.

## Ao cá và chuồng gà

Ở farm, tới ao phía đông nam hoặc chuồng gà phía đông bắc, chạm/nhấp vật thể để xem menu ngữ cảnh; **E** vẫn mở bảng VAC khi đứng gần. Menu cho phép xem, cho ăn và thu hoạch khi hợp lệ. Mua cá giống, gà con và thức ăn tại quầy Cô Mai ở chợ; thả cá/thêm gà trong bảng VAC. Đổi đậu nành thành thức ăn cá, ngô hoặc lúa thành thức ăn gà ngay tại bảng tương ứng. Cá và gà lớn theo thời gian thật khi offline. Cá và trứng vào túi đồ và bán cho Cô Lan. Số liệu hiện là giá trị playtest.

## Kiểm thử

`npm test` chạy kiểm thử Phase 1–5: API, SQLite, quyền farm, Socket.IO, offline growth, inventory, kinh tế, VAC, crafting, xây dựng, migration và retry. Checklist QA trình duyệt ở `QA_CHECKLIST.md`.

`npm run qa:browser` chạy Playwright trên Edge thật với database tạm; cài Playwright bằng `npm install --no-save playwright` nếu máy chưa có. Có thể đặt `PLAYWRIGHT_MODULE` thành URL module Playwright đã cài và `EDGE_PATH` thành đường dẫn trình duyệt. Kịch bản tạo tài khoản thử riêng, không chạm `data/farm.sqlite`; ảnh kiểm tra được lưu trong `.qa/` và bị Git bỏ qua.

`npm run qa:vac` chạy luồng browser Phase 4 trên Edge, cũng dùng SQLite tạm. Script tăng tốc chờ cá/gà bằng cách lùi timestamp trong database thử sau khi tương tác thật; không thay đổi giờ máy hoặc dữ liệu chơi.

## Phase 5 — chế biến, xây dựng và mở đất

Ở farm, dùng **Chế biến** để xem 6 công thức và hàng đợi. Chọn công thức hoặc nhận thành phẩm; nhân vật tự đi tới cối xay, bếp quê hoặc giàn phơi tương ứng. Nguyên liệu trừ khi bắt đầu mẻ, thành phẩm nhận sau khi đồng hồ server hoàn thành, kể cả khi offline. Công trình có lần lượt 1/2/1 chỗ chế biến. Kho đầy thì mẻ vẫn chờ nhận.

**Xây dựng** hoặc phím **B** mở danh sách 3 công trình. Chọn vật, rê chuột để xem vùng chiếm rồi nhấp để đặt; nhân vật tự đi tới điểm thao tác. **R** xoay, **Esc** hủy. Công trình đầu tiên trả Đồng Làng, cất vào túi rồi đặt lại không trả thêm. Chỉ di chuyển/cất khi đã nhận hết mẻ. **Trang trí** có 15 loại; mua tại quầy Cô Mai, chọn tại farm rồi đặt/di chuyển/cất tương tự. Vật trong túi và vật đã đặt là hai trạng thái loại trừ nhau.

**Mở đất** có hai cấp, giá thử nghiệm 180 rồi 280 Đồng Làng. Vùng phủ màu nhẹ trên Canvas là khu chưa mở khóa; mở đất chỉ cho phép đặt vật trên khu đó, không đổi kích thước map hay di chuyển ao/chuồng. Server xác nhận vị trí, va chạm, lối đi, tiền, kho và quyền sở hữu; màu preview là gợi ý.

`npm run qa:phase5` chạy kịch bản Edge/Playwright trên SQLite tạm. `npm run economy:phase5` in biên lợi nhuận từng công thức. `node scripts/phase5-migration-check.mjs <bản-sao-sqlite>` kiểm tra giữ dữ liệu khi nâng lên v5. File `data/starter.sqlite` trong Git là schema v5 rỗng; dữ liệu chơi và backup riêng không vào Git.

## Sao lưu

`npm run backup` tạo bản sao SQLite nhất quán trong `data/backups`. Sao lưu thư mục này ra nơi lưu độc lập theo lịch vận hành. Không đặt database, backup hay `.env` trong `public`.

## Bảo mật và giới hạn hiện tại

Mật khẩu được băm bằng scrypt, phiên lưu bằng cookie HttpOnly và token CSRF; thao tác farm được xác thực server-side. Chưa có dịch vụ email nên chưa có khôi phục tài khoản tự động. Chưa có thanh toán, tiền hoặc giao dịch giữa người chơi. Nhà, ruộng, ao, chuồng, NPC và công trình chính đã dùng art gốc; catalogue trang trí và một số hiệu ứng Canvas vẫn cần hoàn thiện trước khi đánh dấu remake COMPLETE.

## Code tái sử dụng

`Player.js`, `InputManager.js`, `GameLoop.js`, `Camera.js` và `CollisionSystem.js` được sao chép từ dự án `san-may` rồi dùng trong game mới. `server/db.js` dựa trên mẫu migration/SQLite của dự án đó. Dự án `san-may` không bị sửa.
