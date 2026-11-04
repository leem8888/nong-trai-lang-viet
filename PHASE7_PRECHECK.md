# Phase 7 precheck — 2026-11-03

- Baseline `main` `3b3e174`; nhánh `feature/phase-7-social-farms`. Baseline khớp SHA trong kế hoạch. `Phase7.md` là file mới chưa được commit khi bắt đầu.
- Kiến trúc: Express + cookie session/CSRF (`server/auth.js`, `server/index.js`); SQLite v6 (`server/db.js`); mỗi user một farm (`server/farms.js`); các API farming/VAC/market/phase5/quest chỉ dùng farm của user đã xác thực. Socket `farm:join`, `player:move`, `world:travel`, `farm:interact` hiện chỉ cho chủ vào farm và đồng bộ các tab của họ. Canvas/UI trong `public/js/main.js`.
- Sẽ sửa `server/db.js`, thêm service xã hội, tích hợp REST/Socket tại `server/index.js`, thêm UI trong `public/index.html`, `public/js/main.js`, CSS, test Phase 7 và tài liệu. Không sửa quy tắc giá, cây, VAC, crafting, quest.
- Rủi ro: room `farm:<id>` hiện phát kho/ví riêng; khách phải dùng room xã hội khác và snapshot lọc dữ liệu. Chuyển quyền private/kick phải thu hồi ngay. Vị trí khách chỉ ở RAM, không ghi đè vị trí farm chủ. Multi-tab phải gộp một avatar.
- Baseline: `npm test` 34/34 (lần đầu sandbox hạn chế ghi `starter.sqlite` làm 33/34, chạy lại với quyền ghi đúng đạt 34/34); Edge/Playwright `qa:phase6` 12/12, `qa:browser` 14/14, `qa:vac` 5/5, `qa:phase5` 13/13.
- Backup: `data/backups/farm-2026-11-03T15-25-11-123Z.sqlite`, SQLite backup API; đã restore thử vào file tạm: `integrity_check=ok`, `foreign_key_check` 0, schema v6, 1 user/1 farm. Backup và dữ liệu thật không commit.
- Rollback migration: dừng server, backup schema v7, checkout phiên bản trước, restore file v6 bằng SQLite backup API. Không chạy server v6 trên DB v7 nếu chưa thử tương thích.
