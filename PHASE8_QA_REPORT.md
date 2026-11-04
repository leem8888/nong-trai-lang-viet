# Phase 8 QA — 2026-11-04

**Trạng thái: INCOMPLETE.** Đây là kết quả của thay đổi hiện có, chưa phải chứng nhận toàn bộ Phase 8.

## Môi trường và dữ liệu

- Baseline `c867fa6`, nhánh `feature/phase-8-player-experience`.
- Windows, Edge headless qua Playwright, Node/SQLite test tạm. Không dùng mật khẩu tài khoản thật.
- SQLite chơi hiện tại đã backup; **NO DB MIGRATION**. Không push/merge/deploy.
- Ảnh ở `.qa/phase8-{baseline,after}-{desktop,mobile}-*.png` và `after-{wide,small,tablet}-farm.png`. Thư mục này bị Git bỏ qua.

## Đã chạy

| Kịch bản | Kết quả | Bằng chứng |
|---|---|---|
| A: đăng ký, di chuyển, gieo, tồn kho, chợ, reload | PASS qua browser regression Phase 1–3; hướng dẫn skip/replay/reload PASS ở 5 viewport | `npm run qa:browser` 14/14; `node tests/browser-phase8-visual.mjs after` |
| B: farm cũ, offline harvest, VAC, craft/build, NPC, weather | PASS trong các bộ browser có fixture thời gian; chưa chạy 10 phút thật | `npm run qa:vac` 5/5; `qa:phase5` 13/13; `qa:phase6` 12/12 |
| C: hai tài khoản, private/request/public, quyền khách, kick/reconnect | PASS | `npm run qa:phase7` 4/4, visitor khoảng 58 FPS |
| D: 1366×768, 1920×1080, 390×844, 360×800, 768×1024 | PASS cho load, hướng dẫn, audio preference, reload, frame timing và kiểm tràn ngang với CSS zoom 125%; chưa kiểm thủ công mọi panel, zoom browser thật, touch thật hoặc mạng chậm | `node tests/browser-phase8-visual.mjs after` |
| Server/integrity | PASS 36/36, gồm ownership, CSRF, idempotency, migration cũ, economy, VAC, crafting, NPC, social | `npm test` |

Browser regression lần đầu sau sửa có hai lỗi do ẩn trạng thái kết nối và nút social trên mobile. Đã sửa CSS, chạy lại Phase 5/6/7 đều PASS. Các QA browser dùng SQLite tạm và thao tác UI; khi cần tăng tốc thời gian chín thì chỉ sửa timestamp trong fixture thử.

## Frame timing thực đo

120 `requestAnimationFrame` trên Edge headless, cùng spawn và viewport, các phép đo ngắn. Không đại diện cho máy điện thoại thật.

| Cảnh | Baseline median FPS / p95 ms | Sau sửa median FPS / p95 ms |
|---|---:|---:|
| Farm 1366×768 | 60.24 / 17.8 | 59.88 / 17.1 |
| Farm 390×844 | 59.88 / 17.7 | 59.88 / 17.9 |
| Farm 1920×1080 | chưa đo baseline | 59.88 / 19.3 |
| Farm 360×800 | chưa đo baseline | 59.88 / 18.5 |
| Farm 768×1024 | chưa đo baseline | 59.88 / 18.8 |

## Chưa đạt Definition of Done

- P8.2: các panel economy/crafting/building/VAC chưa được audit và nâng cấp UX đầy đủ.
- P8.3–4: đã cải thiện nhân vật local/remote và nét đất; chưa làm đủ season/environment art và animation từng hành động.
- P8.6: có Web Audio cue tùy chọn, mặc định tắt, nhưng chưa có cue riêng cho mọi hành động.
- P8.7–8: chưa có benchmark draw/update/memory dài hạn, network throttle, browser zoom thật và kiểm tra mọi popup trên 5 viewport; **NOT TESTED ON PHYSICAL DEVICE**.
- Chưa có local commit vì các hạng mục bắt buộc trên chưa đạt.

## Kiểm thử thủ công trên máy thật

Mở `npm start` ở máy chạy server; trên điện thoại cùng mạng mở địa chỉ máy đó. Đăng ký mới, bỏ qua/mở lại hướng dẫn, di chuyển bằng joystick, cuốc/gieo/tưới, kiểm tra túi đồ/chợ, mở từng popup, xoay màn hình, bật/tắt âm thanh và kiểm tra không có nút bị che.
