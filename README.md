# Nông Trại Làng Việt

Game nông trại web 2D. Phase 1 có tài khoản và farm riêng; Phase 2 thêm trồng sáu loại cây; Phase 3 thêm chợ NPC, Đồng Làng và đơn hàng.

## Yêu cầu

Node.js 20+, npm. Cài dependency bằng `npm install` hoặc `npm ci`. `node_modules` không được đưa lên GitHub.

## Chạy

```sh
npm install
npm start
```

Mở `http://localhost:3000`. Dùng `npm run dev` để tự khởi động lại server khi sửa code. Đặt `PORT` nếu cần đổi cổng. Đặt `DB_FILE` thành đường dẫn SQLite riêng nếu không dùng `data/farm.sqlite`. Đặt `NODE_ENV=production` sau reverse proxy HTTPS để cookie dùng cờ `Secure`; production cần HTTPS thực và nơi lưu database bền vững.

`data/starter.sqlite` được lưu trong Git, chứa schema khởi đầu và **không có tài khoản, mật khẩu hay session**. Lần chạy đầu, server sao chép file này thành `data/farm.sqlite`. Dữ liệu chơi cá nhân nằm trong `data/farm.sqlite` và không tự đồng bộ qua Git. Mỗi máy/nhánh dùng cùng schema khởi đầu; dùng backup riêng nếu muốn chuyển tiến độ chơi giữa các máy.

## Trồng trọt

Đi tới khu ruộng ở góc tây nam. Dùng phím **1 cuốc**, **2 gieo**, **3 tưới**, **4 thu hoạch**, hoặc nhấp các nút công cụ. Chọn loại hạt trong danh sách, đứng gần ô đất rồi nhấp ô. Nút **Túi đồ** hiển thị vật phẩm thật. Khi dùng hết mọi loại hạt, nút **Nhận hạt** cấp một gói nhỏ tối đa một lần trong ngày UTC. Cây lớn theo thời gian thực kể cả khi đóng trình duyệt; thời gian trồng hiện là giá trị thử nghiệm.

## Chợ quê

Đi theo lối phía nam farm tới biển **Chợ quê** và nhấn **E** để vào chợ. Đến gần quầy hạt, quầy thu mua hoặc bảng đơn rồi nhấn **E**. Chọn vật phẩm và số lượng để mua/bán, hoặc nhận và giao đơn hàng. Nút **Lịch sử** cạnh số dư cho xem các giao dịch. Cổng phía nam chợ đưa về farm. Chợ luôn mở; một loại nông sản được thu mua cao hơn 15% theo ngày UTC. Giá, tiền và vật phẩm được xác nhận ở server. Dùng `npm run economy:report` để xem bảng lợi nhuận thử nghiệm.

## Kiểm thử

`npm test` chạy kiểm thử Phase 1–3: API, SQLite, quyền farm, Socket.IO, di chuyển, tăng trưởng offline, inventory, ví, mua/bán, đơn hàng, migration và retry. Checklist QA trình duyệt ở `QA_CHECKLIST.md`.

`npm run qa:browser` chạy Playwright trên Edge thật với database tạm; cài Playwright bằng `npm install --no-save playwright` nếu máy chưa có. Có thể đặt `PLAYWRIGHT_MODULE` thành URL module Playwright đã cài và `EDGE_PATH` thành đường dẫn trình duyệt. Kịch bản tạo tài khoản thử riêng, không chạm `data/farm.sqlite`; ảnh kiểm tra được lưu trong `.qa/` và bị Git bỏ qua.

## Sao lưu

`npm run backup` tạo bản sao SQLite nhất quán trong `data/backups`. Sao lưu thư mục này ra nơi lưu độc lập theo lịch vận hành. Không đặt database, backup hay `.env` trong `public`.

## Bảo mật và giới hạn hiện tại

Mật khẩu được băm bằng scrypt, phiên lưu bằng cookie HttpOnly và token CSRF; thao tác farm được xác thực server-side. Chưa có dịch vụ email nên chưa có khôi phục tài khoản tự động. Chưa có thanh toán, tiền hoặc giao dịch giữa người chơi. Asset Canvas hiện là hình tạm có cùng tỷ lệ; cần thay bằng bộ art gốc trước phát hành.

## Code tái sử dụng

`Player.js`, `InputManager.js`, `GameLoop.js`, `Camera.js` và `CollisionSystem.js` được sao chép từ dự án `san-may` rồi dùng trong game mới. `server/db.js` dựa trên mẫu migration/SQLite của dự án đó. Dự án `san-may` không bị sửa.
