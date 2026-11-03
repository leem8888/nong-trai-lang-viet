# Nông Trại Làng Việt

Game nông trại web 2D, Phase 1: tài khoản, farm riêng, di chuyển, tương tác và lưu trạng thái.

## Yêu cầu

Node.js 20+, npm. Cài dependency bằng `npm install` hoặc `npm ci`. `node_modules` không được đưa lên GitHub.

## Chạy

```sh
npm install
npm start
```

Mở `http://localhost:3000`. Dùng `npm run dev` để tự khởi động lại server khi sửa code. Đặt `PORT` nếu cần đổi cổng. Đặt `DB_FILE` thành đường dẫn SQLite riêng nếu không dùng `data/farm.sqlite`. Đặt `NODE_ENV=production` sau reverse proxy HTTPS để cookie dùng cờ `Secure`; production cần HTTPS thực và nơi lưu database bền vững.

## Kiểm thử

`npm test` chạy kiểm thử API, SQLite, quyền farm, Socket.IO, va chạm và TimeService. Thử thủ công trên trình duyệt: tạo hai tài khoản, đặt hai farm, đi quanh bản đồ, bật đèn, tải lại và đăng nhập lại.

## Sao lưu

`npm run backup` tạo bản sao SQLite nhất quán trong `data/backups`. Sao lưu thư mục này ra nơi lưu độc lập theo lịch vận hành. Không đặt database, backup hay `.env` trong `public`.

## Bảo mật và giới hạn hiện tại

Mật khẩu được băm bằng scrypt, phiên lưu bằng cookie HttpOnly và token CSRF; thao tác farm được xác thực server-side. Chưa có dịch vụ email nên chưa có khôi phục tài khoản tự động. Chưa có thanh toán, cây trồng, tiền hoặc giao dịch giữa người chơi. Asset Phase 1 được vẽ bằng Canvas và là hình tạm có cùng tỷ lệ; cần thay bằng bộ art gốc trước phát hành.

## Code tái sử dụng

`Player.js`, `InputManager.js`, `GameLoop.js`, `Camera.js` và `CollisionSystem.js` được sao chép từ dự án `san-may` rồi dùng trong game mới. `server/db.js` dựa trên mẫu migration/SQLite của dự án đó. Dự án `san-may` không bị sửa.
