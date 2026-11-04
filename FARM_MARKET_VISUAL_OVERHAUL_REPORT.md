# Phase 9 — Farm & Village Market Visual Overhaul

Ngày thực hiện: 04/11/2026. Trạng thái: **COMPLETE** trong phạm vi Phase 9.

## Baseline và phạm vi

- Baseline yêu cầu: `1bd1efb9c6f641204d7c0d94012550ce725bc248`.
- HEAD thực tế lúc bắt đầu: `8de04dc0bea3b8f736c68de63a356821bb151fe1`, có thêm sửa tab đăng nhập và seed admin. Giữ lại các thay đổi đó.
- Ảnh BEFORE dùng renderer từ `8de04dc`, nạp qua CDP vào browser kiểm thử. Không checkout đè workspace.
- Không sửa backend, schema, tiền hoặc database người chơi. Browser QA dùng SQLite `:memory:` và tài khoản riêng.

## Đã triển khai

Farm có sân gạch trước nhà, đường đất uốn nối cửa nhà, ruộng, ao, chuồng và cổng chợ. Nền cỏ dùng gradient, mảng chuyển sắc và chi tiết xác định bằng seed; bỏ nền bàn cờ. Cây lớn ở rìa, cụm hoa, đá, xe kéo và chum nước tạo các lớp trước/sau. Giữ nhà, ao, chuồng, cây và nhân vật cũ; điều chỉnh tỷ lệ nhà/ao/chuồng để cân đối hơn.

Chợ có ba asset độc lập, không dùng lại cùng một gian hàng:

| Quầy | Kiến trúc và hàng hóa | Nhân vật |
| --- | --- | --- |
| Hạt giống | Mái lá, tre, vải xanh, bao hạt, khay cây giống | Người bán áo xanh, nón lá |
| Thu mua | Mái ngói rộng, mái che vàng, cân, giỏ rau và bao lúa | Cô Lan với sprite và lịch trình hiện có |
| Đơn hàng | Trạm gỗ mái xanh cao, bảng giấy, kiện hàng, xe kéo | Người nhận hàng áo xanh dương, mũ vải |

Sân chợ, đường vào, cây bóng mát, dải cờ, cụm hoa và đồ dùng tạo không gian chung. Bảng hiệu nằm trong artwork, tránh nhãn phụ đè lên tên NPC. Tương tác vẫn mở các API mua, bán và đơn hàng hiện có.

Camera chọn zoom theo viewport, giới hạn mức phóng đại và đặt tiêu điểm desktop thấp hơn để mái nhà không lọt dưới HUD. `toWorld`, `toScreen` và `apply` dùng cùng điểm chiếu; tọa độ server và collision không đổi. Trên mobile, camera theo nhân vật để người chơi tiếp cận từng khu thay vì thu nhỏ toàn farm đến khó thao tác.

Độ sâu dùng tổng tọa độ world `x+y`, phù hợp phép chiếu hiện có. Nhà, ao, chuồng, cây, crop, công trình, trang trí, người chơi và NPC tham gia cùng thứ tự vẽ. Đường trang trí là lớp mặt đất; các vật đứng dùng ground anchor phía dưới. Bộ 15 trang trí có atlas WebP nguyên bản cùng phong cách vẽ với công trình, thay cách vẽ emoji nằm trên mặt đất. Bảng farm, đèn sân và cổng chợ dùng đúng điểm tương tác đã có.

Có chuyển động nhẹ của cây/hoa, bướm, chim, cá và gà khi đã nuôi; NPC có idle nhẹ. Hai nhân vật nằm trong artwork quầy có chuyển động thở nhỏ trong vùng được cắt khi render. Hiệu ứng giảm chuyển động tắt các chuyển động phụ. Giữ chu kỳ ngày/đêm, mùa và mưa; bổ sung quầng đèn ấm vào ban đêm. Không thay đổi tác động gameplay của thời tiết.

Lớp SVG được raster một lần rồi giữ `ImageBitmap`. Asset quầy được nạp khi vào chợ. Ảnh nguồn PNG được giữ để truy nguyên; game sử dụng WebP đã cắt padding alpha và giảm kích thước phù hợp với DPR.

## Lỗi tương tác đã sửa

Listener đóng panel khi bấm ra ngoài trước đây chạy sau handler của canvas. Vì vậy chạm cửa nhà hoặc quầy có thể mở panel rồi đóng ngay trong cùng sự kiện. Chuyển listener ra pha capture: đóng panel cũ trước khi canvas mở panel mới. Kiểm thử bằng pointer/touch phát hiện và xác nhận lỗi này; phím E không gặp lỗi đó.

## Asset và tái tạo

- [Manifest](public/assets/manifest.json): nguồn, quyền sử dụng, anchor và SHA-256 ảnh nguồn.
- [Prompt đầy đủ](public/assets/phase9-art-prompts.json): sáu ảnh/atlas tạo bằng built-in `image_gen.imagegen`, thêm một lần chỉnh nền trong suốt cho atlas trang trí. Kết quả sinh ảnh không có tính xác định; PNG nguồn cuối được giữ nguyên.
- `node tests/browser-phase9-qa.mjs package`: cắt padding và đóng gói lại các PNG sang WebP bằng Edge. Quầy tối đa 1024 px, hoa/xe kéo tối đa 512 px; atlas 5×3 được đóng thành 15 ô 128×128, có kiểm tra padding alpha.
- `node scripts/build-phase9-scenery.mjs`: tái tạo ground, bướm và chim bằng seed cố định.
- Không dùng asset sao chép từ game khác, không có dịch vụ ảnh bên ngoài khi chơi.

## File thay đổi

| Nhóm | File |
| --- | --- |
| Renderer | `public/js/main.js`, `public/js/scenery.js` |
| Camera | `public/js/core/Camera.js` |
| Grid và trang trí | `public/js/phase5.js` |
| Nguồn và runtime art | `public/assets/*-v9.png`, `*-v9.webp`, `*-v9.svg` |
| Nguồn gốc | `public/assets/manifest.json`, `public/assets/phase9-art-prompts.json` |
| Tái tạo | `scripts/build-phase9-scenery.mjs`, chế độ `package` của browser QA |
| Browser QA | `tests/browser-phase9-qa.mjs` |
| Bằng chứng | `docs/phase9/`, `FARM_MARKET_VISUAL_QA.md` |

## Giới hạn thực tế

- Mobile được kiểm tra bằng cảm ứng giả lập của Edge; chưa thử trên thiết bị iOS/Android vật lý.
- Nhân vật bán giống và nhận đơn là hình vẽ trong quầy với idle tại chỗ; không thêm hệ thống hội thoại hoặc lịch trình backend mới.
- Cảnh quan mỹ thuật không thêm collision. Các vùng thao tác, mở rộng và vật đã đặt vẫn do server quyết định.
- Đo heap là JS heap do Chromium báo, không phải toàn bộ RAM/GPU. Phép đo FPS ngắn không thay thế stress test nhiều giờ.

Chi tiết kiểm thử và ảnh đối chiếu nằm trong [FARM_MARKET_VISUAL_QA.md](FARM_MARKET_VISUAL_QA.md).

## Kết quả xác nhận

- Regression Phase 1–8: 44/44 PASS.
- Browser AFTER: 14 kiểm tra tương tác PASS, 22 ảnh; không có lỗi console game.
- Tổng bằng chứng: 44 ảnh BEFORE/AFTER ở `docs/phase9/`, bao gồm hai cặp camera trùng baseline.
- Farm ban ngày, đủ hiệu ứng và fixture trồng/xây dựng: median 16,7 ms/frame, p95 16,8 ms/frame cho cả BEFORE và AFTER (xấp xỉ 60 FPS trên máy kiểm thử).
- JS heap tại mẫu cuối: BEFORE 2.565.722 byte; AFTER 2.058.667 byte. Đây là mẫu sau GC/điều hướng, không phải kết luận giảm bộ nhớ hay toàn bộ bộ nhớ ảnh.
- Sáu WebP mới tổng 1.105.802 byte; PNG nguồn không được game nạp khi chơi.
- Không còn lỗi chặn nghiệm thu trong các kịch bản đã kiểm tra. Giới hạn thiết bị và phạm vi stress test được ghi rõ ở trên.
