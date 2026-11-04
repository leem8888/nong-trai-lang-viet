# Phase 8 baseline — 2026-11-04

- Branch: `feature/phase-8-player-experience`; HEAD trước sửa: `c867fa6` (Phase 7).
- Stack: Canvas 2D/ES modules, Express/Socket.IO, SQLite. Scene farm và chợ; soil, market, VAC, crafting/building, NPC quests và social trong các module `public/js/` tương ứng. Không có hệ thống âm thanh trước Phase 8.
- Dữ liệu chơi thật được sao lưu tại `data/backups/farm-2026-11-04T02-54-43-426Z.sqlite`; QA sử dụng SQLite tạm. Không migration.
- `npm test`: 36/36. Edge headless qua Playwright, Windows, 120 RAF frames: desktop 1366×768 median 60.24 FPS, p95 17.8 ms; mobile 390×844 median 59.88 FPS, p95 17.7 ms.
- Ảnh gốc: `.qa/phase8-baseline-desktop-login.png`, `.qa/phase8-baseline-desktop-farm.png`, `.qa/phase8-baseline-mobile-login.png`, `.qa/phase8-baseline-mobile-farm.png`. Thư mục `.qa/` bị Git bỏ qua; ảnh lưu tại máy làm việc.

## Vấn đề nhìn thấy

1. Mobile 390×844: HUD có nhiều nút trải thành nhiều hàng; thanh công cụ chiếm gần 1/3 màn hình. Người chơi khó nhận diện hành động đầu tiên.
2. Không có hướng dẫn vào game, bấm nhầm ô ruộng không có phản hồi chờ server.
3. Nhân vật chỉ là các khối màu nhỏ, tên người chơi không hiển thị trên nhân vật.
4. Không có nút tắt/chỉnh âm thanh vì chưa có âm thanh.

Ảnh và phép đo dùng tài khoản mới trên DB tạm, cùng điểm spawn; thời tiết/giờ thế giới có thể khác vì world clock của server chạy theo thời gian thực.
