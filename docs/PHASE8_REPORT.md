# Phase 8 report: baseline and QA

---

## Phase 8 baseline — 2026-11-04

### Baseline cho đợt hoàn thiện

Nhánh `feature/phase-8-completion` bắt đầu từ `main` commit `d1012036bf90fa162855f6e055a95e2c8bc22328`, working tree ban đầu sạch. `npm test` baseline **36/36**. Sao lưu dữ liệu địa phương: `data/backups/farm-2026-11-04T07-07-23-366Z.sqlite`. Client baseline của commit này được trích vào `.qa/phase8-main-source` (bị Git bỏ qua) để chụp ảnh cùng clock/mùa/thời tiết với client sau sửa. Ảnh và kết quả chi tiết ở `PHASE8_REPORT.md`. Phần dưới là baseline gốc của lần triển khai đầu tiên từ `c867fa6`.

- Branch: `feature/phase-8-player-experience`; HEAD trước sửa: `c867fa6` (Phase 7).
- Stack: Canvas 2D/ES modules, Express/Socket.IO, SQLite. Scene farm và chợ; soil, market, VAC, crafting/building, NPC quests và social trong các module `public/js/` tương ứng. Không có hệ thống âm thanh trước Phase 8.
- Dữ liệu chơi thật được sao lưu tại `data/backups/farm-2026-11-04T02-54-43-426Z.sqlite`; QA sử dụng SQLite tạm. Không migration.
- `npm test`: 36/36. Edge headless qua Playwright, Windows, 120 RAF frames: desktop 1366×768 median 60.24 FPS, p95 17.8 ms; mobile 390×844 median 59.88 FPS, p95 17.7 ms.
- Ảnh gốc: `.qa/phase8-baseline-desktop-login.png`, `.qa/phase8-baseline-desktop-farm.png`, `.qa/phase8-baseline-mobile-login.png`, `.qa/phase8-baseline-mobile-farm.png`. Thư mục `.qa/` bị Git bỏ qua; ảnh lưu tại máy làm việc.

### Vấn đề nhìn thấy

1. Mobile 390×844: HUD có nhiều nút trải thành nhiều hàng; thanh công cụ chiếm gần 1/3 màn hình. Người chơi khó nhận diện hành động đầu tiên.
2. Không có hướng dẫn vào game, bấm nhầm ô ruộng không có phản hồi chờ server.
3. Nhân vật chỉ là các khối màu nhỏ, tên người chơi không hiển thị trên nhân vật.
4. Không có nút tắt/chỉnh âm thanh vì chưa có âm thanh.

Ảnh và phép đo dùng tài khoản mới trên DB tạm, cùng điểm spawn; thời tiết/giờ thế giới có thể khác vì world clock của server chạy theo thời gian thực.

---

## Phase 8 QA — cập nhật 2026-11-04

**Trạng thái hiện tại: INCOMPLETE.** Commit nền: `d1012036bf90fa162855f6e055a95e2c8bc22328`; phần hoàn thiện từ `feature/phase-8-completion` được đưa lên `main` để AI web review theo yêu cầu. Việc merge để review không phải nghiệm thu Phase 8. Báo cáo phía dưới mục “Bản QA đầu tiên” là lịch sử của commit nền.

### Kết quả mới trên nhánh hoàn thiện

- Đã backup SQLite chơi trước sửa: `data/backups/farm-2026-11-04T07-07-23-366Z.sqlite`. Browser QA dùng SQLite tạm. **NO DB MIGRATION**; server authority và công thức kinh tế không đổi.
- `node tests/browser-phase8-journey.mjs`: Edge mở **600 giây** với tài khoản mới. Qua đăng ký, đi bằng bàn phím quanh vật cản, cuốc/gieo/tưới bằng UI, xem túi/nhiệm vụ, mở lại/bỏ qua hướng dẫn, đi ra chợ và reload. Rau cải cần 15 phút theo luật nên chưa thu hoạch trong 10 phút; regression kiểm thu hoạch offline. Ảnh `.qa/phase8-journey-*.png`, mẫu `.qa/phase8-journey-report.json`.
- `node tests/browser-phase8-panels.mjs`: **17 loại popup × 5 viewport = 85 lượt PASS** ở 1366×768, 1920×1080, 390×844, 360×800, 768×1024; có touch emulation, Escape, nút Đóng, focus và kiểm khung popup không ra ngoài màn hình.
- `node tests/browser-phase8-network.mjs`: POST chậm 1,2 giây hiện pending, chỉ trừ tiền một lần; offline hiện lỗi, ví không đổi và kết nối lại được.
- Regression cuối: `npm test` **36/36**; Edge `npm run qa:browser` **14/14**, `qa:vac` **5/5**, `qa:phase5` **13/13**, `qa:phase6` **12/12**, `qa:phase7` **4/4**. Hai tài khoản social và kiểm quyền khách vẫn qua. Đã sửa race báo kết nối trước khi `farm:join` thành công, phát hiện bởi browser QA.
- Ảnh khớp vị trí và clock: `.qa/phase8-{before,after}-desktop-{morning,night,rain,spring,summer,autumn,winter}.png`, `.qa/phase8-{before,after}-mobile-morning.png`. `before` lấy client từ commit `d101203` bằng `git archive`, `after` lấy nhánh hiện tại; cùng fixture server giờ/thời tiết/mùa.
- FPS sau sửa, Edge headless, 120 frame tại farm 1366×768: median **59,88 FPS**, p95 **17,1 ms**; 390×844: **59,88 FPS**, p95 **17,1 ms**. Baseline ngắn ở commit nền được ghi phía dưới. Mẫu 10 phút ở chợ có median frame **16,7 ms**, p95 **16,8 ms**, draw trung bình **0,37 ms**, update **0,06 ms** tại phút 10. JS heap các mẫu khoảng **3,50–4,22 MB**, cuối **3,97 MB**, không tăng đều. Mẫu 10 phút bắt đầu trước thay đổi hình NPC/quầy chợ cuối; các thay đổi cuối đã qua benchmark ngắn và regression.

### Chưa đạt Definition of Done

- **MAJOR — browser zoom thật 125%: BLOCKED bởi công cụ QA.** `browser-phase8-zoom.mjs` trong Edge headless và headed gửi `Ctrl+=` nhưng `innerWidth`, DPR và visual viewport không đổi. Công cụ `computer-use` và `cua_repl` đều lỗi `failed to write kernel assets` trước khi điều khiển UI. CSS zoom 125% đã qua kiểm tràn ngang nhưng không thay thế browser zoom thật. Cần thử thủ công trên Edge/Chrome ở 125%.
- **NOT TESTED ON PHYSICAL DEVICE.** Mobile đã giả lập cảm ứng, chưa có bằng chứng điện thoại thật.
- Chưa đo 10 phút *trước* sửa cùng cảnh, chỉ có benchmark ngắn trước/sau. Chưa đo 10 phút riêng ở chế độ giảm hiệu ứng.
- Canvas art và animation hành động đã cải thiện nhưng không có remote animation cho mọi thao tác VAC/kinh tế vì server không phát broadcast hành động đó. Không thêm sự kiện gameplay chỉ để trang trí.

Thử thủ công còn lại: chạy `npm start`, đặt browser zoom thật 125%, mở Menu/Túi đồ/Nhiệm vụ/Chợ/Ao/Chuồng/Chế biến/Xây dựng tại 1366×768 và 390×844; trên điện thoại thật thử joystick, chạm ô ruộng, đóng popup, xoay màn hình và âm thanh.

### Bản QA đầu tiên tại commit `d101203` (lịch sử)

**Trạng thái: INCOMPLETE.** Đây là kết quả của thay đổi hiện có, chưa phải chứng nhận toàn bộ Phase 8.

### Môi trường và dữ liệu

- Baseline `c867fa6`, nhánh `feature/phase-8-player-experience`.
- Windows, Edge headless qua Playwright, Node/SQLite test tạm. Không dùng mật khẩu tài khoản thật.
- SQLite chơi hiện tại đã backup; **NO DB MIGRATION**. Không push/merge/deploy.
- Ảnh ở `.qa/phase8-{baseline,after}-{desktop,mobile}-*.png` và `after-{wide,small,tablet}-farm.png`. Thư mục này bị Git bỏ qua.

### Đã chạy

| Kịch bản | Kết quả | Bằng chứng |
|---|---|---|
| A: đăng ký, di chuyển, gieo, tồn kho, chợ, reload | PASS qua browser regression Phase 1–3; hướng dẫn skip/replay/reload PASS ở 5 viewport | `npm run qa:browser` 14/14; `node tests/browser-phase8-visual.mjs after` |
| B: farm cũ, offline harvest, VAC, craft/build, NPC, weather | PASS trong các bộ browser có fixture thời gian; chưa chạy 10 phút thật | `npm run qa:vac` 5/5; `qa:phase5` 13/13; `qa:phase6` 12/12 |
| C: hai tài khoản, private/request/public, quyền khách, kick/reconnect | PASS | `npm run qa:phase7` 4/4, visitor khoảng 58 FPS |
| D: 1366×768, 1920×1080, 390×844, 360×800, 768×1024 | PASS cho load, hướng dẫn, audio preference, reload, frame timing và kiểm tràn ngang với CSS zoom 125%; chưa kiểm thủ công mọi panel, zoom browser thật, touch thật hoặc mạng chậm | `node tests/browser-phase8-visual.mjs after` |
| Server/integrity | PASS 36/36, gồm ownership, CSRF, idempotency, migration cũ, economy, VAC, crafting, NPC, social | `npm test` |

Browser regression lần đầu sau sửa có hai lỗi do ẩn trạng thái kết nối và nút social trên mobile. Đã sửa CSS, chạy lại Phase 5/6/7 đều PASS. Các QA browser dùng SQLite tạm và thao tác UI; khi cần tăng tốc thời gian chín thì chỉ sửa timestamp trong fixture thử.

### Frame timing thực đo

120 `requestAnimationFrame` trên Edge headless, cùng spawn và viewport, các phép đo ngắn. Không đại diện cho máy điện thoại thật.

| Cảnh | Baseline median FPS / p95 ms | Sau sửa median FPS / p95 ms |
|---|---:|---:|
| Farm 1366×768 | 60.24 / 17.8 | 59.88 / 17.1 |
| Farm 390×844 | 59.88 / 17.7 | 59.88 / 17.9 |
| Farm 1920×1080 | chưa đo baseline | 59.88 / 19.3 |
| Farm 360×800 | chưa đo baseline | 59.88 / 18.5 |
| Farm 768×1024 | chưa đo baseline | 59.88 / 18.8 |

### Chưa đạt Definition of Done

- P8.2: các panel economy/crafting/building/VAC chưa được audit và nâng cấp UX đầy đủ.
- P8.3–4: đã cải thiện nhân vật local/remote và nét đất; chưa làm đủ season/environment art và animation từng hành động.
- P8.6: có Web Audio cue tùy chọn, mặc định tắt, nhưng chưa có cue riêng cho mọi hành động.
- P8.7–8: chưa có benchmark draw/update/memory dài hạn, network throttle, browser zoom thật và kiểm tra mọi popup trên 5 viewport; **NOT TESTED ON PHYSICAL DEVICE**.
- Chưa có local commit vì các hạng mục bắt buộc trên chưa đạt.

### Kiểm thử thủ công trên máy thật

Mở `npm start` ở máy chạy server; trên điện thoại cùng mạng mở địa chỉ máy đó. Đăng ký mới, bỏ qua/mở lại hướng dẫn, di chuyển bằng joystick, cuốc/gieo/tưới, kiểm tra túi đồ/chợ, mở từng popup, xoay màn hình, bật/tắt âm thanh và kiểm tra không có nút bị che.
